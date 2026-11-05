"""Pack approved imagegen sprites without repainting or changing their alpha."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
from PIL import Image

GAME = Path(__file__).resolve().parents[1]


def prepare(explosion, turret, supply):
    output = GAME / 'assets/shared'
    sources = GAME / 'design/source-art/shared'
    output.mkdir(parents=True, exist_ok=True)
    sources.mkdir(parents=True, exist_ok=True)
    records = []

    def save(key, name, image, source, prompt, frames=None):
        destination = output / f'{name}.webp'
        image.save(destination.with_suffix('.png'))
        image.save(destination, 'WEBP', quality=90, method=6, exact=True)
        with Image.open(destination) as decoded:
            assert decoded.getchannel('A').tobytes() == image.getchannel('A').tobytes()
        relative = destination.relative_to(GAME).as_posix()
        records.append(dict(key=key, file=relative, url='/games/contra2026/'+relative,
            dimensions=list(image.size), bounds=[0,0,*image.size], frames=frames or {},
            bytes=destination.stat().st_size, sha256=hashlib.sha256(destination.read_bytes()).hexdigest(),
            source=source, prompt=prompt, alphaPreserved=True))

    for name, source in [('explosions',explosion),('turret-kit',turret),('supply-case',supply)]:
        shutil.copy2(source,sources / f'{name}.png')
    original=Image.open(explosion).convert('RGBA')
    assert original.size==(1448,1086)
    atlas=Image.new('RGBA',(1024,768))
    for index in range(12):
        x,y=index%4*362,index//4*362
        cell=original.crop((x,y,x+362,y+362)).resize((256,256),Image.Resampling.LANCZOS)
        atlas.paste(cell,(index%4*256,index//4*256))
    save('explosionAtlas','explosions',atlas,'design/source-art/shared/explosions.png',
         'Built-in imagegen. One twelve-frame 4 by 3 transparent explosion sequence: white-hot ignition, expanding luminous orange fireball, rolling charcoal smoke and fading embers. Fixed camera, consistent center and scale, warm glow, crisp detailed HD arcade game art. No text, labels, backdrop or ground. Runtime packs the approved equal-size cells and adds a short additive light flash without changing simulation.',
         {f'frame{i}':[i%4*256,i//4*256,256,256] for i in range(12)})
    save('equipmentTurret','turret-kit',Image.open(turret).convert('RGBA'),'design/source-art/shared/turret-kit.png',
         'Built-in imagegen precise-object-edit of the latest winter turret kit. Remove all snow, ice, icicles and frost while preserving heavy beveled worn ivory-grey armor, dark ribbed gunmetal, bolts, circular socket and warm amber sensor. Front-facing pedestal in upper two thirds and a separate horizontal right-facing cannon barrel in bottom third. Preserve two-component layout and transparent alpha; expose painted armor beneath snow. No text, logos or scene.',
         dict(body=[436,14,664,680],barrel=[175,711,1190,298]))
    save('equipmentSupply','supply-case',Image.open(supply).convert('RGBA'),'design/source-art/shared/supply-case.png',
         'Built-in imagegen precise-object-edit of the latest winter two-state supply case. Remove snow, frost and icicles, retaining the same ivory/slate camouflaged beveled equipment box, corner plates, rivets, handles, central latch and warm amber lamps. One closed case on left; the identical case opened on hydraulic supports on right, with visible equipment. Same body width and aligned bottom baseline. Detailed hand-painted HD arcade texture, transparent alpha, no text or scene.',
         dict(closed=[46,512,689,348],open=[810,199,691,661]))
    saucer=GAME / 'assets/stage5/winter-supply-saucer.webp'
    shutil.copy2(saucer,output / 'supply-saucer.webp')
    save('supplySaucer','supply-saucer',Image.open(saucer).convert('RGBA'),'assets/stage5/winter-supply-saucer.webp',
         (GAME / 'design/stage-05-saucer-prompt.txt').read_text(encoding='utf-8'))
    manifest=dict(generatedWith='built-in imagegen',assets=records,totalBytes=sum(a['bytes'] for a in records))
    (GAME / 'design/combat-art-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    stage_five=GAME / 'design/stage-05-assets.json'
    fifth=json.loads(stage_five.read_text(encoding='utf-8'))
    replaced={'winterTurret','winterSupply','winterSaucer',*(a['key'] for a in records)}
    fifth['assets']=[a for a in fifth['assets'] if a['key'] not in replaced]+records
    stage_five.write_text(json.dumps(fifth,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    versions=GAME / 'js/asset-url.mjs'
    source=versions.read_text(encoding='utf-8')
    import re
    for asset in records:
        source=re.sub(r'^  "'+re.escape(asset['url'])+r'":.*\n','',source,flags=re.MULTILINE)
    marker='const VERSIONS=Object.freeze({\n'
    source=source.replace(marker,marker+''.join(f'  "{a["url"]}": "{a["sha256"][:10]}",\n' for a in records))
    versions.write_text(source,encoding='utf-8')
    print(json.dumps(dict(totalBytes=manifest['totalBytes'],assets=[{k:a[k] for k in ['key','bytes','dimensions']} for a in records])))


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    for name in ['explosion','turret','supply']:
        parser.add_argument('--'+name,type=Path,required=True)
    args=parser.parse_args()
    prepare(args.explosion,args.turret,args.supply)
