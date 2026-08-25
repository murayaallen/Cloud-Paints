# ============================================================
# CLOUD PAINTS — image optimisation
# ============================================================
#   python build/optimise-images.py           report only
#   python build/optimise-images.py --write   convert and rewrite references
#
# The homepage was 9.5MB on a first visit, and the loader waited for the
# last byte of it. Six of those megabytes were PNGs — and a PNG with an
# alpha channel is the worst possible container for a photograph of a paint
# tin. The same image as WebP is around a tenth the size with no visible
# difference at any size the site displays it.
#
# What is NOT converted, and why:
#
#   images/rooms/*-mask.png     The visualiser composites these as alpha
#                               masks on a canvas. Lossy compression would
#                               fray the mask edges and the paint would
#                               bleed past the wall.
#   images/logo.png             The og:image. Social and chat scrapers
#                               still handle WebP inconsistently, and this
#                               file is fetched by scrapers, never by a
#                               visitor, so its weight costs nobody.
#   images/logo-icon.png        Favicon. Small, and favicon handling is
#                               fussy enough without changing the format.
#
# Every reference across HTML, CSS and JS is rewritten to match, and the
# original PNG is removed so it cannot be served by accident.
# ============================================================

import glob
import io
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITE = '--write' in sys.argv
QUALITY = 90          # brand assets; the difference from 100 is not visible
os.chdir(ROOT)

CONVERT = [
    'images/buckets/hero/*.png',
    'images/splatter/*.png',
    'images/logo-mark.png',
    'images/hero-bucket.png',
    'images/kebs-standardisation-mark.png',
]
KEEP = re.compile(r'(rooms/.*-mask\.png|logo\.png|logo-icon\.png)$')

targets = []
for pattern in CONVERT:
    for f in glob.glob(pattern):
        f = f.replace('\\', '/')
        if not KEEP.search(f):
            targets.append(f)
targets = sorted(set(targets))

before = after = 0
converted = []

for src in targets:
    dst = src[:-4] + '.webp'
    orig = os.path.getsize(src)
    im = Image.open(src)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=QUALITY, method=6)
    data = buf.getvalue()

    # Never make a file bigger. A few small PNGs already beat WebP.
    if len(data) >= orig:
        print('  skip (WebP is larger)  %s' % src)
        continue

    before += orig
    after += len(data)
    converted.append((src, dst, orig, len(data)))
    if WRITE:
        with open(dst, 'wb') as fh:
            fh.write(data)

print('%-52s %9s %9s %7s' % ('FILE', 'PNG', 'WEBP', 'SAVED'))
for src, dst, o, n in converted:
    print('%-52s %7.0fKB %7.0fKB %6.0f%%' % (src, o / 1024, n / 1024, 100 - n * 100.0 / o))

print('')
print('  %d files   %.2f MB -> %.2f MB   (%.2f MB saved, %.0f%%)'
      % (len(converted), before / 1048576, after / 1048576,
         (before - after) / 1048576, 100 - after * 100.0 / max(before, 1)))

# ---- rewrite every reference -------------------------------------------
if WRITE and converted:
    names = {os.path.basename(s): os.path.basename(d) for s, d, _, _ in converted}
    files = []
    for pattern in ('*.html', 'paints/*.html', 'css/*.css', 'js/*.js'):
        files.extend(glob.glob(pattern))

    edits = 0
    touched = 0
    for f in files:
        with io.open(f, encoding='utf-8') as fh:
            text = fh.read()
        original = text
        for png, webp in names.items():
            if png in text:
                edits += text.count(png)
                text = text.replace(png, webp)
        if text != original:
            with io.open(f, 'w', encoding='utf-8', newline='\n') as fh:
                fh.write(text)
            touched += 1

    for src, _, _, _ in converted:
        os.remove(src)

    print('  %d references rewritten across %d files' % (edits, touched))
    print('  %d PNG originals removed' % len(converted))
    print('')
    print('  now re-run:  node build/site.mjs')
elif not WRITE:
    print('')
    print('  DRY RUN — pass --write to convert')
