"""Wall-mask generator v2 — semantic segmentation (SegFormer-B4, ADE20K).

Replaces the colour-distance heuristic in _make_wall_masks.py. The old
approach could not separate a white ceiling from a white wall and its
floor/top band limits sliced hard horizontal lines across walls. This
version classifies every pixel semantically, so ceilings, floors,
windows, doors and curtains are excluded by class rather than by colour.

Run offline (never in production):  python _make_wall_masks_v2.py [slug ...]
Outputs  room-<slug>-mask.png  (RGBA, every channel = grade) — the same
format js/visualiser.js already consumes. Verify with the diagnostic
compositor before committing.

One-time deps: pip install torch --index-url https://download.pytorch.org/whl/cpu
               pip install transformers pillow numpy scipy
"""
import os
import sys

import numpy as np
import torch
from PIL import Image, ImageFilter
from scipy import ndimage
from transformers import AutoImageProcessor, SegformerForSemanticSegmentation

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = "nvidia/segformer-b4-finetuned-ade-512-512"

# ADE20K class ids (0-indexed)
WALL = 0
BUILDING = 1
HOUSE = 25

# Per-room wall classes. Interiors paint class `wall`. NOTE: the
# exterior shot is NOT regenerated here — ADE20K's `building` class
# includes the roof, which paints the roof tiles. Its committed v1
# heuristic mask was verified corner-to-corner; keep it.
ROOM_WALL_CLASSES = {
    "room-exterior": None,          # skip — keep the v1 mask
}
DEFAULT_WALL_CLASSES = (WALL,)

# Rooms with fine structures (pendant lights, frosted glass, blinds)
# get higher-res inference and gentler morphology so thin furniture
# isn't bridged into the wall.
ROOM_TUNING = {
    "room-kitchen-island": {"size": 896, "close": 1},
    "room-bathroom":       {"size": 896, "close": 2},
    "room-office":         {"size": 896, "close": 2},
}

MIN_COMPONENT_FRAC = 0.004   # drop stray specks < 0.4% of image area
FEATHER_RADIUS = 2.5         # same soft edge the old pipeline shipped


def load_model():
    processor = AutoImageProcessor.from_pretrained(MODEL)
    model = SegformerForSemanticSegmentation.from_pretrained(MODEL)
    model.eval()
    return processor, model


def segment(processor, model, img, size=None):
    kw = {"size": {"height": size, "width": size}} if size else {}
    inputs = processor(images=img, return_tensors="pt", **kw)
    with torch.no_grad():
        logits = model(**inputs).logits          # (1, 150, h/4, w/4)
    logits = torch.nn.functional.interpolate(
        logits, size=img.size[::-1], mode="bilinear", align_corners=False)
    return logits.argmax(dim=1)[0].numpy()       # (H, W) class ids


def build_mask(seg, wall_classes, close=3, open_=2):
    wall = np.isin(seg, wall_classes)

    # clean: close pinholes, then drop speck components
    wall = ndimage.binary_closing(wall, iterations=close)
    wall = ndimage.binary_opening(wall, iterations=open_)
    labels, n = ndimage.label(wall)
    if n:
        min_px = wall.size * MIN_COMPONENT_FRAC
        sizes = ndimage.sum(wall, labels, range(1, n + 1))
        keep = np.flatnonzero(sizes >= min_px) + 1
        wall = np.isin(labels, keep)

    # fill interior holes that are genuinely enclosed by wall and small
    # (light switches, sockets) — big holes (windows, art) stay open
    filled = ndimage.binary_fill_holes(wall)
    holes = filled & ~wall
    hlabels, hn = ndimage.label(holes)
    if hn:
        hsizes = ndimage.sum(holes, hlabels, range(1, hn + 1))
        small = np.flatnonzero(hsizes <= wall.size * 0.002) + 1
        wall |= np.isin(hlabels, small)

    grade = Image.fromarray((wall * 255).astype("uint8"))
    grade = grade.filter(ImageFilter.GaussianBlur(FEATHER_RADIUS))
    g = np.asarray(grade)
    return np.dstack([g, g, g, g])               # RGBA, all channels = grade


def main():
    only = set(sys.argv[1:])
    rooms = sorted(
        f[:-4] for f in os.listdir(HERE)
        if f.endswith(".jpg") and f.startswith("room-"))
    if only:
        rooms = [r for r in rooms if r in only or r.replace("room-", "") in only]

    processor, model = load_model()
    for slug in rooms:
        classes = ROOM_WALL_CLASSES.get(slug, DEFAULT_WALL_CLASSES)
        if classes is None:
            print(f"{slug}: skipped (keeps committed v1 mask)")
            continue
        tune = ROOM_TUNING.get(slug, {})
        img = Image.open(os.path.join(HERE, slug + ".jpg")).convert("RGB")
        seg = segment(processor, model, img, size=tune.get("size"))
        rgba = build_mask(seg, classes, close=tune.get("close", 3))
        out = os.path.join(HERE, slug + "-mask.png")
        Image.fromarray(rgba, "RGBA").save(out)
        cov = (rgba[..., 3] > 128).mean()
        print(f"{slug}: wall coverage {cov:.1%} -> {os.path.basename(out)}")


if __name__ == "__main__":
    main()
