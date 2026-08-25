# ============================================================
# CLOUD PAINTS — print package: artwork preparation
# ============================================================
#     python build/prep-art.py
#
# What it does, and why:
#
# 1. Trims every tin cut-out to its own edges. The website's PNGs
#    carry transparent margin, and that margin costs resolution:
#    a 436px file where the tin is only 220px across prints the tin
#    at half the density the file implies. Trimming is the cheapest
#    resolution gain available.
#
# 2. Rebuilds roof-paint from the full-size source. The cut-out in
#    images/buckets/hero/ was 257px wide where the JPG behind it is
#    436px — it had been downsampled somewhere along the way.
#
# 3. Brings the small cut-outs up to the pixel size the rest of the
#    range prints at. Six tins were only ever supplied at ~220px.
#    Left alone they sit beside 850px tins at the same physical size
#    and the press shows the difference as visible pixel steps.
#    Resampling cannot invent detail — it only stops the stepping —
#    so the true optical resolution is recorded in art-native.json
#    and reported at the end. Those six want re-photographing.
#
# Idempotent: running it twice changes nothing the second time.
# ============================================================

import json
import os
from collections import deque

from PIL import Image, ImageFilter
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
SITE = os.path.dirname(PKG)
BUCKETS = os.path.join(PKG, 'assets', 'img', 'buckets')

TARGET_H = 850          # pixel height the good cut-outs already have
HERO_MM = 62.0          # how wide a tin prints on an A4 flier


def key_white(im):
    """Make the background transparent without touching whites inside the
    artwork. Only white connected to the border is removed, so the tin's own
    white body and label survive."""
    a = np.array(im.convert('RGBA'))
    h, w, _ = a.shape
    white = (a[:, :, 0] > 236) & (a[:, :, 1] > 236) & (a[:, :, 2] > 236)
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if white[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and white[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    a[:, :, 3] = np.where(seen, 0, 255)
    return Image.fromarray(a, 'RGBA')


def pngs():
    return [n for n in sorted(os.listdir(BUCKETS)) if n.endswith('.png')]


def main():
    manifest_path = os.path.join(HERE, 'art-native.json')
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}

    # --- 1. roof-paint: rebuild from the source it was reduced from ---------
    src = os.path.join(SITE, 'images', 'buckets', 'ROOF PAINT 4L.jpg')
    dst = os.path.join(BUCKETS, 'roof-paint.png')
    if os.path.exists(src) and 'roof-paint.png' not in manifest:
        out = key_white(Image.open(src))
        out.crop(out.getbbox()).save(dst)
        print('rebuilt roof-paint from the 4L source -> %dpx wide'
              % Image.open(dst).width)

    # --- 2. trim to content -------------------------------------------------
    print('')
    print('trimming cut-outs to content:')
    trimmed = 0
    for name in pngs():
        path = os.path.join(BUCKETS, name)
        im = Image.open(path).convert('RGBA')
        before = im.size
        box = im.getbbox()
        if box and box != (0, 0, before[0], before[1]):
            im = im.crop(box)
            im.save(path)
            trimmed += 1
            print('  %-24s %sx%s -> %sx%s'
                  % (name, before[0], before[1], im.width, im.height))
        manifest.setdefault(name, [im.width, im.height])
    if not trimmed:
        print('  nothing to trim — all cut-outs already tight')

    # --- 3. normalise the small ones ---------------------------------------
    print('')
    print('normalising small cut-outs (Lanczos + unsharp):')
    upscaled = 0
    for name in pngs():
        path = os.path.join(BUCKETS, name)
        im = Image.open(path).convert('RGBA')
        if im.height >= TARGET_H:
            continue
        k = TARGET_H / im.height
        up = im.resize((round(im.width * k), TARGET_H), Image.LANCZOS)
        up = up.filter(ImageFilter.UnsharpMask(radius=1.6, percent=58, threshold=2))
        up.save(path)
        upscaled += 1
        print('  %-24s x%.1f -> %dx%d' % (name, k, up.width, up.height))
    if not upscaled:
        print('  nothing to do — all cut-outs already at size')

    json.dump(manifest, open(manifest_path, 'w'), indent=1, sort_keys=True)

    # --- 4. report the TRUE optical resolution ------------------------------
    print('')
    print('printed resolution at the %.0fmm flier hero size' % HERO_MM)
    print('(native pixels before any resampling):')
    rows = sorted((nw / (HERO_MM / 25.4), name, nw, nh)
                  for name, (nw, nh) in manifest.items())
    for dpi, name, nw, nh in rows:
        flag = '   <-- soft in print, worth re-shooting' if dpi < 200 else ''
        print('  %-24s native %4dx%-5d %4.0f dpi%s' % (name, nw, nh, dpi, flag))


# ------------------------------------------------------------------
# Thumbnails
# ------------------------------------------------------------------
# The poster, the price list and the brochure rows show a tin about 26mm
# tall. At 300dpi that is 310 pixels, but the file behind it is 850 —
# and the renderer embeds whatever it is given, so the price list was
# carrying 28 full-size tins to draw 28 thumbnails. Generating a small
# set once cuts those documents by more than half with no visible
# difference at the size they actually print.

THUMB_H = 340          # tins:     ~26mm at 330dpi
THUMB_W = 640          # finishes: ~50mm at 325dpi


def thumbs():
    from PIL import Image
    out = os.path.join(BUCKETS, 'sm')
    os.makedirs(out, exist_ok=True)
    n = 0
    for name in pngs():
        im = Image.open(os.path.join(BUCKETS, name)).convert('RGBA')
        if im.height > THUMB_H:
            k = THUMB_H / im.height
            im = im.resize((max(1, round(im.width * k)), THUMB_H), Image.LANCZOS)
        im.save(os.path.join(out, name), optimize=True)
        n += 1

    tex = os.path.join(PKG, 'assets', 'img', 'textures')
    tout = os.path.join(tex, 'sm')
    os.makedirs(tout, exist_ok=True)
    m = 0
    for name in sorted(os.listdir(tex)):
        if not name.endswith('.jpg'):
            continue
        im = Image.open(os.path.join(tex, name)).convert('RGB')
        if im.width > THUMB_W:
            k = THUMB_W / im.width
            im = im.resize((THUMB_W, max(1, round(im.height * k))), Image.LANCZOS)
        im.save(os.path.join(tout, name), quality=82, optimize=True, progressive=True)
        m += 1
    print('')
    print('thumbnails: %d tins -> assets/img/buckets/sm/, %d finishes -> assets/img/textures/sm/'
          % (n, m))


if __name__ == '__main__':
    main()
    thumbs()
