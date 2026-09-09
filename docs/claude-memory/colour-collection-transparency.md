---
name: colour-collection-transparency
description: The colour collection carries 1122 transparency groups and is a print risk
metadata:
  type: project
---

`pdf/7-colour-collection/cloud-paints-colour-collection.pdf` — 21 pages —
contains 1122 transparency groups. Every other document in the package is at
zero.

**Why:** this is the fault that stopped the price list printing, at three times
the count. It has not been fixed and the client has not been told.

**How to apply:** fix before that document goes to press — find the alpha
fades, box-shadows or blend modes in its generator and replace them with opaque
equivalents, as was done for the price list in commit 288e498. Raise it when
the colour collection next comes up. See [[cloud-paints-print-package]].
