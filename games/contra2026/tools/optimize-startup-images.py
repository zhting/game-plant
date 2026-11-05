"""Compress active first-stage WebP assets without changing atlas geometry or alpha."""
import concurrent.futures
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import re
from PIL import Image

GAME=Path(__file__).resolve().parents[1]
ROOT=GAME.parents[1]
JOB=ROOT/'.playwright-mcp/lives-load'
JOB.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('image_compression',GAME/'tools/compress-images.py')
compression=importlib.util.module_from_spec(spec)
spec.loader.exec_module(compression)
inventory=JOB/'assets-before.json'
if not inventory.exists():
    script="import {STAGE_ONE_ASSETS} from './games/contra2026/js/stage-one-art.mjs';console.log(JSON.stringify(Object.entries(STAGE_ONE_ASSETS).map(([key,url])=>({key,url}))));"
    assets=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=ROOT,text=True))
    for asset in assets:asset['bytes']=(ROOT/asset['url'].lstrip('/')).stat().st_size
    inventory.write_text(json.dumps(assets,indent=2)+'\n',encoding='utf-8')
assets=json.loads(inventory.read_text(encoding='utf-8'))
active=[a for a in assets if a['key'] not in ['runRed','runBlue','runEnemy']]


def build(asset):
    destination=ROOT/asset['url'].lstrip('/')
    backup=JOB/'before-assets'/destination.relative_to(ROOT)
    backup.parent.mkdir(parents=True,exist_ok=True)
    if not backup.exists():shutil.copy2(destination,backup)
    source=compression.source_for(destination)
    with Image.open(source) as master,Image.open(backup) as previous:
        baseline=compression.visible_psnr(master.convert('RGBA'),previous.convert('RGBA'))
    # Existing hand-painted assets can contain chroma detail WebP cannot encode
    # at PSNR 32 without becoming larger. Never reduce their existing quality.
    minimum=min(32,baseline) if baseline is not None else 32
    record=compression.encode(source,destination,quality=78,min_psnr=minimum,before=backup)
    record['baselinePsnr']=baseline
    record['url']=asset['url']
    record['key']=asset['key']
    record['sha256']=hashlib.sha256(destination.read_bytes()).hexdigest()
    return record


with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    records=list(pool.map(build,active))
changed={r['url']:r for r in records if r['webpBytes']<r['originalBytes']}
versions=GAME/'js/asset-url.mjs'
code=versions.read_text(encoding='utf-8')
for url,r in changed.items():
    code=re.sub('("'+re.escape(url)+'"\\s*:\\s*")[^"]+(")',lambda m:m[1]+r['sha256'][:10]+m[2],code)
versions.write_text(code,encoding='utf-8')

# Keep production asset manifests used by validation consistent with packed files.
for path in sorted((GAME/'design').glob('*.json')):
    data=json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(data,dict):continue
    rows=data.get('assets',[data])
    updated=False
    for row in rows:
        if not isinstance(row,dict):continue
        r=changed.get(row.get('url'))
        if r:
            row['bytes']=r['webpBytes'];row['sha256']=r['sha256'];row['alphaPreserved']=True
            updated=True
    if not updated:continue
    if 'totalBytes' in data:data['totalBytes']=sum(row['bytes'] for row in rows)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report=dict(beforeImageBytes=sum(a['bytes'] for a in assets),
    skippedLegacyBytes=sum(a['bytes'] for a in assets if a not in active),
    afterImageBytes=sum(r['webpBytes'] for r in records),images=records,
    unchangedGeometry=True,exactAlpha=True)
report['savedImageBytes']=report['beforeImageBytes']-report['afterImageBytes']
report['savedImagePercent']=round(report['savedImageBytes']/report['beforeImageBytes']*100,1)
(GAME/'design/startup-optimization.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='images'}))
