"""
Generate per-room wall-mask PNGs for the Visualiser — v2.
Sample-based approach: pick a seed pixel known to be on the wall,
then grow a mask of pixels within colour-distance + saturation
tolerance of that seed. Restrict vertically to wall band.
"""
import os
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageFilter

ROOMS_DIR = os.path.dirname(os.path.abspath(__file__))

# Per-room config: (seed_x_frac, seed_y_frac, max_distance, floor_frac, top_frac)
# seed = approximate location of a definite wall pixel
# Gap-fill strategy: keep dist conservative (so we don't bleed into
# curtains / tables / similar-coloured furniture) and rely on
# binary_fill_holes downstream to plug interior holes. Tighter than v3.
ROOMS = {
    'room-living-modern':  dict(seed=(0.50, 0.20), dist=60, floor=0.82, top=0.00),
    'room-living-warm':    dict(seed=(0.55, 0.15), dist=58, floor=0.55, top=0.00),
    'room-bedroom-soft':   dict(seed=(0.30, 0.18), dist=95, floor=0.55, top=0.00),
    'room-bedroom-suite':  dict(seed=(0.70, 0.18), dist=70, floor=0.62, top=0.00),
    'room-kitchen-island': dict(seed=(0.30, 0.20), dist=60, floor=0.50, top=0.00),
    'room-kitchen-warm':   dict(seed=(0.55, 0.08), dist=82, floor=0.55, top=0.00),
    'room-dining':         dict(seed=(0.50, 0.30), dist=64, floor=0.72, top=0.00),
    'room-bathroom':       dict(seed=(0.55, 0.15), dist=72, floor=0.62, top=0.00),
    'room-hallway':        dict(seed=(0.75, 0.22), dist=46, floor=0.70, top=0.00),
    'room-office':         dict(seed=(0.72, 0.25), dist=38, floor=0.58, top=0.00),
    'room-child':          dict(seed=(0.35, 0.22), dist=64, floor=0.62, top=0.00),
    'room-exterior':       dict(seed=(0.50, 0.45), dist=68, floor=0.80, top=0.05),
}

def make_mask(im, p, slug):
    rgb = np.asarray(im.convert('RGB')).astype(np.int16)
    h, w, _ = rgb.shape

    sx = int(w * p['seed'][0])
    sy = int(h * p['seed'][1])

    # Average a 7×7 patch around the seed to make it robust to noise
    patch = rgb[max(0, sy-3):sy+4, max(0, sx-3):sx+4]
    seed_col = patch.reshape(-1, 3).mean(axis=0)

    # Euclidean distance from each pixel to the seed colour
    diff = rgb - seed_col
    dist = np.sqrt(np.sum(diff * diff, axis=2))

    # Vertical band restriction
    top_y    = int(h * p['top'])
    floor_y  = int(h * p['floor'])

    candidate = dist <= p['dist']
    band = np.zeros_like(candidate)
    band[top_y:floor_y, :] = True
    candidate &= band

    # Morphological close + open to clean up. Keep closing modest so
    # small in-wall fixtures (pendant lights, hanging fittings) don't
    # get swallowed into the wall blob. Hole-fill + horizontal sweep
    # downstream handle the larger interior gaps.
    candidate = ndi.binary_closing(candidate, iterations=2)
    candidate = ndi.binary_opening(candidate, iterations=2)

    # Keep the connected component containing the seed point
    labeled, n_blobs = ndi.label(candidate)
    if n_blobs == 0:
        return Image.new('L', (w, h), 0)
    seed_label = labeled[sy, sx]
    if seed_label == 0:
        # Seed missed the largest cluster — fall back to largest blob
        sizes = ndi.sum(candidate, labeled, range(1, n_blobs + 1))
        seed_label = int(np.argmax(sizes)) + 1
    keep = (labeled == seed_label)

    # Fill SMALL internal holes inside the wall blob — but ONLY if the
    # mean colour of the hole's pixels is reasonably close to the wall
    # seed. Picture frames, mirrors and lamp halos average close to
    # wall colour and get filled; brass pendant lights and dark fittings
    # average far from cream wall and stay as holes.
    inv_lab, n_inv = ndi.label(~keep)
    border = set()
    border.update(np.unique(inv_lab[0, :]).tolist())
    border.update(np.unique(inv_lab[-1, :]).tolist())
    border.update(np.unique(inv_lab[:, 0]).tolist())
    border.update(np.unique(inv_lab[:, -1]).tolist())
    border.discard(0)
    max_hole_px = 0.03 * h * w
    sizes = ndi.sum(np.ones_like(inv_lab), inv_lab, range(1, n_inv + 1))
    hole_colour_thr = p['dist'] * 1.7
    for lab in range(1, n_inv + 1):
        if lab in border: continue
        if sizes[lab - 1] > max_hole_px: continue
        hole_pixels = inv_lab == lab
        mean_col = rgb[hole_pixels].mean(axis=0)
        if np.sqrt(((mean_col - seed_col) ** 2).sum()) > hole_colour_thr:
            continue
        keep[hole_pixels] = True

    # Per-gap horizontal sweep: walk each row above the floor line,
    # and for every gap BETWEEN two consecutive wall pixels in that
    # row, fill it only if (a) the gap is short (< 12% of image
    # width — sofas/tables tend to span much more) and (b) every
    # pixel in the gap is loosely wall-coloured. This catches
    # sunlit/shadowed mid-wall patches and small fixtures while
    # refusing to paint across furniture.
    loose_dist = p['dist'] * 1.5
    edge_dist  = p['dist'] * 2.2   # more permissive at the image edges
                                   # (shadows from frames, floor bounce)
    max_run = int(0.12 * w)
    for y in range(top_y, floor_y):
        row = keep[y]
        if not row.any(): continue
        xs = np.where(row)[0]
        # Edge sweep — extend the leftmost wall pixel out to the image
        # edge while pixels stay wall-coloured. Same on the right edge.
        # Catches wall strips at the edge of the photo (above / below /
        # beside windows) where the per-gap sweep can't help.
        left = xs[0]
        if left > 0:
            run = dist[y, :left] <= edge_dist
            i = left - 1
            while i >= 0 and run[i]:
                keep[y, i] = True
                i -= 1
        right = xs[-1]
        if right < w - 1:
            run = dist[y, right + 1:] <= edge_dist
            i = 0
            while i < len(run) and run[i]:
                keep[y, right + 1 + i] = True
                i += 1
        if len(xs) < 2: continue
        for i in range(len(xs) - 1):
            a, b = xs[i], xs[i + 1]
            gap_len = b - a - 1
            if gap_len <= 0: continue
            if gap_len > max_run: continue
            if (dist[y, a + 1:b] <= loose_dist).all():
                keep[y, a + 1:b] = True

    # Vertical edge sweep: for each column, extend the wall down toward
    # the floor line while pixels stay wall-coloured. Catches wall
    # strips below window frames where the row-based sweep has no
    # neighbouring wall pixel to extend from.
    for x in range(w):
        col = keep[:, x]
        ys = np.where(col)[0]
        if len(ys) == 0: continue
        # Bottommost wall pixel — extend down toward floor_y
        bot = ys[-1]
        i = bot + 1
        while i < floor_y and dist[i, x] <= edge_dist:
            keep[i, x] = True
            i += 1
        # Topmost wall pixel — extend up toward top_y
        top = ys[0]
        i = top - 1
        while i >= top_y and dist[i, x] <= edge_dist:
            keep[i, x] = True
            i -= 1

    # Slightly dilate the final mask so soft edges blend cleanly past
    # the wall boundary instead of stopping a pixel short.
    keep = ndi.binary_dilation(keep, iterations=2)

    # Soft-edge graded mask: full where close to seed, lifted floor
    # where in tolerance edge (was 145 → 180; ensures the wall takes
    # the colour strongly even in slightly-shadowed regions).
    grade = np.zeros_like(dist, dtype=np.float32)
    edge = p['dist'] * 0.65
    full = keep & (dist <= edge)
    soft = keep & (dist > edge)
    grade[full] = 255
    grade[soft] = np.clip(
        255 - (dist[soft] - edge) / (p['dist'] - edge) * 75,
        180, 255
    )
    # And: holes that were filled by binary_fill_holes have dist
    # well above the threshold, so the soft branch missed them.
    # Force any pixel inside `keep` that isn't yet set to a solid
    # 220 — gives the previously-empty interior holes strong coverage.
    interior = keep & (grade < 1)
    grade[interior] = 220

    mask_im = Image.fromarray(grade.astype(np.uint8), 'L')
    mask_im = mask_im.filter(ImageFilter.GaussianBlur(radius=2.5))
    # Save as RGBA where RGB == alpha == grade. This makes the PNG behave
    # identically under mask-mode: alpha (default match-source) and
    # mask-mode: luminance — both end up reading the same grade.
    rgba = Image.merge('RGBA', (mask_im, mask_im, mask_im, mask_im))
    return rgba


def main():
    print(f"Processing {len(ROOMS)} rooms")
    for slug, p in ROOMS.items():
        path = os.path.join(ROOMS_DIR, f'{slug}.jpg')
        out  = os.path.join(ROOMS_DIR, f'{slug}-mask.png')
        if not os.path.exists(path):
            print(f"  MISSING: {path}")
            continue
        im = Image.open(path)
        mask = make_mask(im, p, slug)
        mask.save(out, optimize=True)
        cov = np.asarray(mask).mean() / 255.0
        print(f"  {slug:24s} -> {os.path.basename(out)}  (coverage: {cov:.0%})")


if __name__ == '__main__':
    main()
