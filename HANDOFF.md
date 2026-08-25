# Where things stand — 25 August 2026

Everything is committed on branch `v2`. Copy the whole `Cloud Paints` folder to
the flash drive and it travels complete: working files, generated PDFs, and the
git history in `.git`.

---

## 1. What is in this folder

**The website** (`index.html`, `css/`, `js/`, `images/`) — branch `v2`.
Last work: the mobile placement of *Real Walls of Kenya* directly under the
hero, the tile rush-and-blink sequence, the *Why Cloud Paints* paint-roller
reveal, hero timing, the stray Weatherguard bucket on the gradient, bucket/label
sync in the hero sequence, and the removal of the `exterior` room from the
visualiser.

**The client package** (`client-package/`) — 56 print-ready PDFs generated from
the website's own product catalogue. See `client-package/README.md` for the full
print specification: stock weights, fold instructions, panel widths, bleed and
CMYK notes.

---

## 2. Continuing on another machine

The folder is self-contained apart from three tools:

| Needed | For | Check |
|---|---|---|
| **Node 22+** | building and rendering the package | `node -v` |
| **Microsoft Edge or Chrome** | HTML → PDF | already on most Windows machines |
| **Python 3 + a few packages** | artwork prep and verification | `pip install pillow numpy pypdfium2 pypdf` |

Fonts are **not** a dependency — Fraunces and Inter are bundled in
`client-package/assets/fonts/`, so the package regenerates offline.

To rebuild the whole package from scratch:

```bash
cd client-package
node build/build.mjs      # catalogue + prices -> html/    (~1 second)
node build/render.mjs     # html/ -> pdf/                  (~2 minutes)
python build/verify.py    # check the finished PDFs        (~10 seconds)
```

A clean run ends with three passes: page geometry, font embedding, text
integrity.

**The website needs a local server** — it uses ES modules, so opening
`index.html` from the file system will not work:

```bash
python -m http.server 8000
```

---

## 3. What is versioned, and what is not

`client-package/html/` and `client-package/pdf/` are **generated** and are
excluded from git — 76 MB of PDFs would weigh down every clone for ever. They
are still real files on disk, so they travel with a folder copy, and they
regenerate in about two minutes if they are ever lost.

Everything needed to rebuild them **is** committed: the templates, the shared
library, the price table, the fonts and the prepared artwork.

---

## 4. Open items

**Nothing has been pushed.** The commits are local only. When you want the
offsite copy:

```bash
git push origin v2
```

**The price list ships unpriced, on purpose.** Every pack size prints a ruled
blank. Fill in `client-package/build/prices.js` — one file, numbers only — and
rebuild. Nothing in the package invents a price.

**Six tins want re-photographing.** Turpentine, Road Marking, Super Gloss,
Gloss Enamel, Clear Varnish and Roof Paint were only ever supplied at around
220 px — 82–98 dpi at print size. They have been resampled so they sit
consistently beside the rest, but the detail was never captured. Shoot them
against white, drop them into `client-package/assets/img/buckets/` as
`<slug>.png`, run `python build/prep-art.py`, and rebuild.

**Two products have no usable tin photograph at all.** Metal Primer and
Universal Undercoat exist only as phone snapshots on a desk, and the Universal
Undercoat frame is cropped through its own label. They appear by name in the
range tables, the brochures and the price list, but get no flier and no picture.

**The colour flier is a sample.** `pdf/0-colour-flier/` shows the treatment on
Weatherguard only, at A4 and A5. If it is approved it can be rolled across all
22 products — it is the same generator, so a rebuild rather than a redesign.

**Decorative and textured finishes** were removed from the range flier only.
They are still on the range poster, in the price list, and in their own
brochure.

**Two prototype pages are still in the repo root** — `_bg-options.html`,
`_hero-open.html`, `_intro-trials.html`. They are publicly reachable if the
branch is deployed as-is. Delete them before launch, or leave them if you still
want the comparisons.

**The velvet grain on the hero** is a repeating SVG overlay. Baking it into a
tiled PNG would cut the compositing cost on large screens.
