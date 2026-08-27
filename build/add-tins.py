# ============================================================
# CLOUD PAINTS — bring newly supplied tin photographs into the range
# ============================================================
#     python build/add-tins.py            report
#     python build/add-tins.py --write    prepare and place them
#
# A tin arrives as a photograph on a white studio background. The
# site and the print package both want it as a cut-out with a real
# alpha channel: on the product page it floats on a coloured
# gradient, and in the flier it sits on white paper with its own
# shadow. A white rectangle in either place looks like a mistake.
#
# The keying is the same routine the print package already uses —
# flood-fill inward from the border, so only white CONNECTED to the
# edge is removed and the tin's own white body and label survive.
# Then a one-pixel feather, because a hard 0/255 alpha shows as a
# stair-stepped edge against a dark ground.
#
# Two outputs per tin, because the two pipelines want different
# things:
#   images/buckets/hero/<slug>.webp         the site  (a tenth the weight)
#   client-package/assets/img/buckets/<slug>.png  the press (lossless)
# ============================================================

import os
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WRITE = '--write' in sys.argv
os.chdir(ROOT)

# What arrived, and which product it is.
# The current batch. Entries are removed once the prepared files are in
# place and committed — the sources are working files, not part of the
# project, and a stale name here reports NOT FOUND on every run.
INCOMING = {
    'new thinner.png': 'standard-thinner',
}

SITE_OUT = os.path.join('images', 'buckets', 'hero')
PRINT_OUT = os.path.join('client-package', 'assets', 'img', 'buckets')


def key_background(im, cutoff=236, tol=70):
    """Transparent background without touching the artwork.

    Only background REACHABLE FROM THE BORDER is removed, so a white tin
    body on white paper survives and so does a dark label on a dark ground.

    Two kinds of ground turn up. Most tins are shot on white, and there the
    test is simply "brighter than cutoff" — a fixed threshold, because a
    white sweep is even and the risk is eating the tin's own highlights.
    The Super High Gloss Thinner arrived on a dark grey sweep instead,
    running 54 to 71 across the frame, and a brightness threshold cannot
    express that. So when the border is dark the test becomes distance from
    the border's median colour, which absorbs the gradient in one number and
    stays far away from a white jerrican.
    """
    a = np.array(im.convert('RGBA'))
    h, w, _ = a.shape
    rgb = a[:, :, :3].astype(np.int16)

    edge = np.concatenate([rgb[0], rgb[h - 1], rgb[:, 0], rgb[:, w - 1]])
    ground = np.median(edge, axis=0)

    if ground.mean() > 200:
        bg = (rgb[:, :, 0] > cutoff) & (rgb[:, :, 1] > cutoff) & (rgb[:, :, 2] > cutoff)
    else:
        bg = np.abs(rgb - ground).max(axis=2) <= tol

    seen = np.zeros((h, w), bool)
    q = deque()

    def push(y, x):
        if bg[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w:
                push(ny, nx)

    a[:, :, 3] = np.where(seen, 0, 255)
    return Image.fromarray(a, 'RGBA')


def feather(im, radius=0.8):
    """Soften the cut edge by a fraction of a pixel. The flood fill leaves
    alpha fully on or fully off, which reads as a stair-stepped outline
    against the product page's dark gradient."""
    alpha = im.getchannel('A').filter(ImageFilter.GaussianBlur(radius))
    out = im.copy()
    out.putalpha(alpha)
    return out


rows = []
for src, slug in INCOMING.items():
    if not os.path.exists(src):
        rows.append((src, slug, 'NOT FOUND', '', ''))
        continue

    im = Image.open(src)
    before = '%dx%d %s' % (im.size[0], im.size[1], im.mode)

    # Some sources arrive already cut out. White Spirit did: RGBA, 72% of
    # it transparent. Re-keying that would key against a border of pure
    # black — the colour Pillow reports under a transparent pixel — and take
    # the tin's own shadows with it. If the alpha is already doing work,
    # trust it and only soften the edge.
    supplied_alpha = (im.mode == 'RGBA'
                      and (np.array(im.getchannel('A')) < 8).mean() > 0.05)
    cut = feather(im.convert('RGBA') if supplied_alpha else key_background(im))
    how = 'supplied alpha' if supplied_alpha else 'keyed'
    # Trim on the ALPHA channel, not the image. getbbox() on an RGBA image
    # counts any non-zero channel, and a supplied cut-out often keeps colour
    # under its transparent pixels — White Spirit did, which made the bbox
    # the whole 300x300 frame and trimmed nothing.
    # Threshold first: getbbox() counts any alpha above zero, and a supplied
    # cut-out carries a haze of 1-7 values across the whole frame that is
    # invisible but bounds the box at the full 300x300.
    box = cut.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        cut = cut.crop(box)

    covered = int((np.array(cut.getchannel('A')) > 8).mean() * 100)
    after = '%dx%d RGBA  %d%% opaque' % (cut.size[0], cut.size[1], covered)

    webp = os.path.join(SITE_OUT, slug + '.webp')
    png = os.path.join(PRINT_OUT, slug + '.png')

    if WRITE:
        os.makedirs(SITE_OUT, exist_ok=True)
        os.makedirs(PRINT_OUT, exist_ok=True)
        cut.save(webp, 'WEBP', quality=90, method=6)
        cut.save(png, 'PNG', optimize=True)

    after = '%s · %s' % (after, how)
    rows.append((src, slug, before, after,
                 '%.0fKB webp / %.0fKB png' % (
                     os.path.getsize(webp) / 1024 if os.path.exists(webp) else 0,
                     os.path.getsize(png) / 1024 if os.path.exists(png) else 0)))

print('%-30s %-22s %-16s %s' % ('SUPPLIED', 'SLUG', 'AS SUPPLIED', 'PREPARED'))
for src, slug, before, after, size in rows:
    print('%-30s %-22s %-16s %s' % (src, slug, before, after))
    if size:
        print('%-30s %-22s %-16s %s' % ('', '', '', size))

print('')
if WRITE:
    print('  written. Next:')
    print('    python client-package/build/prep-art.py     # thumbnails + resolution report')
    print('    node build/site.mjs && node build/schema.mjs')
    print('    cd client-package && node build/build.mjs && node build/render.mjs')
else:
    print('  DRY RUN — pass --write to prepare and place them')
