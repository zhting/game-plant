"""Build small browser WebP assets, retaining atlas sizes and exact alpha (Pillow)."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import io
import json
import math
from pathlib import Path
import re
import shutil

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[3]
GAME = ROOT / "games/contra2026"
WUKONG = ROOT / "games/wukong"
MAX_IMAGE_SIZES = {WUKONG / "assets/giant-whole-sweep-link.webp": 1024}


def visible_psnr(original, decoded):
    alpha = original.getchannel("A")
    if alpha.getbbox() is None:
        return None
    mask = alpha.point(lambda value: 255 if value else 0)
    matte = Image.new("RGBA", original.size, (16, 45, 54, 255))
    first = Image.alpha_composite(matte, original).convert("RGB")
    second = Image.alpha_composite(matte, decoded).convert("RGB")
    error = ImageStat.Stat(ImageChops.difference(first, second), mask).rms
    mse = sum(value * value for value in error) / 3
    return round(10 * math.log10(255 * 255 / mse), 2) if mse else None


def encode(source, destination, *, max_size=None, quality=88, min_psnr=32, before=None):
    with Image.open(source) as original:
        image = original.convert("RGBA")
        profile = original.info.get("icc_profile")
    if max_size:
        image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    before_bytes = before.stat().st_size if before and before.exists() else source.stat().st_size
    options = {"method": 6, "alpha_quality": 100, "exact": True, "icc_profile": profile or b""}
    used_quality, lossless = quality, False
    for used_quality in [*range(quality, 100, 4), 100]:
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=used_quality, **options)
        encoded = buffer.getvalue()
        with Image.open(io.BytesIO(encoded)) as decoded:
            psnr = visible_psnr(image, decoded.convert("RGBA"))
        if psnr is None or psnr >= min_psnr:
            break
    else:
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", lossless=True, **options)
        encoded, used_quality, lossless = buffer.getvalue(), None, True
    # Keep an already smaller, sufficiently clear asset instead of growing it.
    if destination.exists() and destination.stat().st_size < len(encoded):
        previous = destination.read_bytes()
        with Image.open(io.BytesIO(previous)) as decoded:
            previous_image = decoded.convert("RGBA")
            previous_psnr = visible_psnr(image, previous_image) if decoded.size == image.size else 0
            if (previous_image.size == image.size and
                    previous_image.getchannel("A").tobytes() == image.getchannel("A").tobytes() and
                    (previous_psnr is None or previous_psnr >= min_psnr)):
                encoded, used_quality = previous, None
                lossless = previous_image.tobytes() == image.tobytes()
    with Image.open(io.BytesIO(encoded)) as decoded:
        assert decoded.size == image.size, destination
        decoded = decoded.convert("RGBA")
        assert decoded.getchannel("A").tobytes() == image.getchannel("A").tobytes(), destination
        psnr = visible_psnr(image, decoded)
        assert psnr is None or psnr >= min_psnr, (destination, psnr)
    assert len(encoded) <= before_bytes, (destination, before_bytes, len(encoded))
    destination.parent.mkdir(parents=True, exist_ok=True)
    if not destination.exists() or destination.read_bytes() != encoded:
        temporary = destination.with_suffix(".webp.tmp")
        temporary.write_bytes(encoded)
        temporary.replace(destination)
    return {
        "source": source.relative_to(ROOT).as_posix(),
        "webp": destination.relative_to(ROOT).as_posix(),
        "originalBytes": before_bytes,
        "sourceBytes": source.stat().st_size,
        "webpBytes": len(encoded),
        "width": image.width,
        "height": image.height,
        "lossless": lossless,
        "alphaPreserved": True,
        "quality": used_quality,
        "psnr": psnr,
    }


def cover_records():
    source = ROOT / "assets/covers/contra2026-zh.png"
    return [
        encode(source, source.with_name("contra2026-zh-512.webp"), max_size=512, quality=80, min_psnr=26, before=source.with_name("contra2026-zh-512.webp")),
        encode(source, source.with_suffix(".webp"), max_size=800, quality=76, min_psnr=28, before=source.with_suffix(".webp")),
    ]


def source_for(browser_asset):
    png = browser_asset.with_suffix(".png")
    if png.exists():
        return png
    # Some newer artwork arrived as WebP. Archive its master once so rerunning
    # never recompresses an already lossy browser asset.
    source = GAME / "design/source-art" / browser_asset.relative_to(GAME / "assets")
    if not source.exists():
        source.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(browser_asset, source)
    return source


def runtime_assets():
    files = [game / "index.html" for game in [GAME, WUKONG]]
    files += [path for game in [GAME, WUKONG] for path in (game / "js").glob("*.mjs")]
    code = "\n".join(path.read_text(encoding="utf-8") for path in files)
    urls = sorted(set(re.findall(r"/games/(?:contra2026|wukong)/assets/[A-Za-z0-9_./-]+\.(?:png|webp)", code)))
    return [ROOT / url.lstrip("/") for url in urls]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()
    assets = runtime_assets()
    def build(asset):
        return encode(source_for(asset), asset.with_suffix(".webp"), max_size=MAX_IMAGE_SIZES.get(asset), before=asset)
    with ThreadPoolExecutor(max_workers=args.workers) as workers:
        records = list(workers.map(build, assets))
    records.extend(cover_records())
    original = sum(record["originalBytes"] for record in records)
    compressed = sum(record["webpBytes"] for record in records)
    report = {"originalBytes": original, "webpBytes": compressed, "savedPercent": round((1 - compressed / original) * 100, 1), "images": records}
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "images"} | {"images": len(records), "losslessImages": sum(record["lossless"] for record in records)}, indent=2))


if __name__ == "__main__":
    main()
