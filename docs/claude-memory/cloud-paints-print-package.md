---
name: cloud-paints-print-package
description: How the Cloud Paints print package is generated and what must stay true of it
metadata:
  type: project
---

Cloud Paints is Cloudsent Decor Ltd's brand (Nairobi paint manufacturer).
The print package is generated, not drawn: `client-package/build/build.mjs`
writes HTML masters, `build/render.mjs` prints them to PDF with headless Edge,
`build/verify.py` checks every page for size, embedded fonts and text
integrity. `build/prices.js` is the single definition of the range — categories,
pack sizes, prices and the flier's descriptions — and both the price list and
the flier read it, which is the only way the sheet on the counter and the flier
a customer takes home can agree.

Two invariants worth keeping:

- **Zero transparency groups.** The price list would not print until 336 of
  them were removed; every alpha fade, box-shadow and blend mode is a soft mask
  the RIP must flatten. Check with `grep -c /Group` on the PDF after any change.
- **Trust the overset check, and make it honest.** `render.mjs` measures named
  boxes for clipping. It measured only `.pnl` for a long time, so content that
  cleared the panel but overran the ink was invisible to it; `.ip` and
  `.cover-in` are measured now too.

See [[acrobat-locks-pdfs]] and [[colour-collection-transparency]].
