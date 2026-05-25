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

# Per-room config: (seed_x_frac, seed_y_frac, max_distance, floor_frac, top_frac, blur)
# seed = approximate location of a definite wall pixel
# max_distance = Euclidean colour distance (0-441) tolerated from the seed
ROOMS = {
    'room-living-modern':  dict(seed=(0.50, 0.20), dist=42, floor=0.75, top=0.00),
    'room-living-warm':    dict(seed=(0.55, 0.15), dist=42, floor=0.55, top=0.00),
    'room-bedroom-soft':   dict(seed=(0.78, 0.18), dist=38, floor=0.55, top=0.00),
    'room-bedroom-suite':  dict(seed=(0.70, 0.18), dist=42, floor=0.55, top=0.00),
    'room-kitchen-island': dict(seed=(0.50, 0.20), dist=38, floor=0.45, top=0.00),
    'room-kitchen-warm':   dict(seed=(0.50, 0.20), dist=55, floor=0.62, top=0.00),
    'room-dining':         dict(seed=(0.50, 0.30), dist=38, floor=0.72, top=0.00),
    'room-bathroom':       dict(seed=(0.55, 0.18), dist=38, floor=0.62, top=0.00),
    'room-hallway':        dict(seed=(0.75, 0.30), dist=42, floor=0.78, top=0.00),
    'room-office':         dict(seed=(0.72, 0.20), dist=42, floor=0.62, top=0.00),
    'room-child':          dict(seed=(0.45, 0.18), dist=38, floor=0.62, top=0.00),
    'room-exterior':       dict(seed=(0.50, 0.45), dist=60, floor=0.80, top=0.05),
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

    # Morphological close + open to clean up
    candidate = ndi.binary_closing(candidate, iterations=3)
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

    # Soft-edge graded mask: full where close to seed, half where in tolerance edge
    grade = np.zeros_like(dist, dtype=np.float32)
    edge = p['dist'] * 0.65
    full = keep & (dist <= edge)
    soft = keep & (dist > edge)
    grade[full] = 255
    # Linear ramp from 255 down to ~150 at the edge of tolerance
    grade[soft] = np.clip(255 - (dist[soft] - edge) / (p['dist'] - edge) * 110, 145, 255)

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
