---
name: product-schema-pending-client
description: Product JSON-LD on the site is blocked on a client decision — do not publish prices without it
metadata:
  type: project
---

Search Console reports every product page missing `offers`, `review` or
`aggregateRating`. Four options were put to the client on 2026-08: publish a
price range, publish a "from" price, drop the Product markup, or leave it.

**Why:** options one and two publish the client's prices as structured data,
which is theirs to decide, not ours. Options one and two also require the ten
textures to stop being Products — they are quoted by wall measurement, so they
have no price to state.

**How to apply:** do not change `build/site.mjs` until they answer.
`productJsonLd()` at about line 149 is the only place it is written; changing
it regenerates 28 `paints/*.html`, a patch of roughly 397 KB.
