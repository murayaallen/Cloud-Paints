---
name: acrobat-locks-pdfs
description: Rendering fails with EBUSY when the user has the PDF open in Acrobat; render to a preview path instead
metadata:
  type: feedback
---

The user reviews the work by opening the PDFs in Acrobat and leaves them
open. `render.mjs` then fails with `EBUSY: resource busy or locked`.

**Why:** Acrobat holds an exclusive handle on Windows.

**How to apply:** do not stall waiting. Copy `build/render.mjs`, point the
locked entry at `6-range-flier/_prev.pdf` with sed, render, restore render.mjs
from the copy, and review the preview. Write the real file once they say it is
closed, then delete `_prev.pdf`. They close it promptly when asked.
