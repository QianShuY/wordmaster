"""Lossless transport variants; preserve PNG masters and decoded RGBA pixels."""
from pathlib import Path
import json, hashlib, sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'static/adventure/assets'
names = ['mist-campaign-map-v4-dusk', 'mist-bridge-v1', 'mist-warden-v1',
         'warden-lantern-v1', 'warden-shield-v1', 'warden-storm-v1',
         'shield-ink-impact-v1', 'river-camp-v1']
report = []
for name in names:
    source, target = assets / (name + '.png'), assets / (name + '.webp')
    with Image.open(source) as image:
        pixels = image.convert('RGBA')
        pixels.save(target, format='WEBP', lossless=True, method=6, exact=True)
    with Image.open(target) as image:
        decoded = image.convert('RGBA')
        assert decoded.size == pixels.size and decoded.tobytes() == pixels.tobytes(), name
    assert target.stat().st_size < source.stat().st_size, name
    report.append(dict(asset=name, width=pixels.width, height=pixels.height,
                       png_bytes=source.stat().st_size, webp_bytes=target.stat().st_size,
                       rgba_identical=True, sha256=hashlib.sha256(target.read_bytes()).hexdigest()))
dest = root / 'output/playwright/fullsite-20261014/asset-encoding.json'
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
print(json.dumps(dict(assets=len(report), png_bytes=sum(x['png_bytes'] for x in report),
                      webp_bytes=sum(x['webp_bytes'] for x in report), rgba_identical=True)))
if '--apply' in sys.argv:
    for filename in ['journey.html', 'journey-atmosphere.js', 'camp.html', 'battle.html', 'boss.html', 'boss.css']:
        file = root / 'static/adventure' / filename
        text = file.read_text(encoding='utf-8')
        updated = text
        for name in names:
            updated = updated.replace('assets/' + name + '.png', 'assets/' + name + '.webp')
        if updated != text:
            file.write_text(updated, encoding='utf-8')
