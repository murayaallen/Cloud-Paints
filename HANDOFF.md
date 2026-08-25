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

## 1a. The website pass — 25 August 2026

A full review, then the fixes. What was actually wrong, and what it is now.

**Rendering and behaviour**

- The hero wordmark was clipped to "CLOUD PAINT" for anyone browsing with
  Reduce Motion on. A blanket `transform: none !important` in the
  reduced-motion block was cancelling the wordmark's own centring, and the
  hero column's `overflow:hidden` cut the rest off. Reduced motion now stops
  movement without undoing layout.
- The five-tin opening line-up never appeared at all under Reduce Motion —
  the whole layer was `display:none`. It now draws in its resting position:
  no flight, no squash, no splash, but the range is there. Reduced motion is
  about movement, not about removing content.
- The slide label ("EXTERIOR WALL PAINT / Weatherguard") rendered below the
  bottom edge of `.lp-pour`, which clips, so on a phone it was invisible —
  and the part you could see sat over the CTA block. The column now reserves
  a band of bottom padding for it.
- Texture products showed their finish photograph floated at the tin's 78%,
  leaving the stage gradient down both sides. A render fills the frame now; a
  tin still floats.
- Tapping the mobile menu threw `Cannot read properties of null` every time.
  `js/main.js` was toggling a `.nav` element the current header does not
  have — dead code from an older header. The drawer always worked, because
  partials.js had already handled the same click.

**Requests that went nowhere**

Every 404 the site used to fire on a normal visit is gone. The homepage was
asking for a hero backdrop and eight wall photographs that were never
produced; product pages guessed at a cut-out only twelve of the
twenty-eight products own. `build/site.mjs` now resolves each product's art
against the filesystem and writes `js/art-manifest.js`, so nothing is
requested speculatively. There is also a `favicon.ico` at last.

The designs those files were meant to fill are unaffected — the wall strip
was always a set of colour chips underneath, and it is a good one.

**Self-contained**

GSAP, ScrollTrigger and Lenis were loaded from two CDNs on every page, and the
fonts from a third. All four are now served from this site
(`js/vendor/`, `fonts/`). The package works with no network, and there is no
third-party origin left to trust.

**URLs**

`/products` not `/products.html`, and `/paints/silk-vinyl` not
`/product.html?p=silk-vinyl`. Twenty-eight real product pages, each with its
own title, trimmed description, canonical, social tags and Product schema
written into the HTML. Every old URL 301s to its new one.

**Security**

HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
`Permissions-Policy` and a Content-Security-Policy that allows this origin and
nothing else, bar the OpenStreetMap frame on the contact page.
`build/serve.mjs` serves the same policy locally, which is how the two
breakages it caused were found before deploy rather than after.

**How it reads in search**

JSON-LD on every page: Organization and LocalBusiness with the address, the
opening hours and the geo point; WebSite; BreadcrumbList; the catalogue as an
ItemList of all 28 products; Product on each product page with its full spec
table; FAQPage on contact, with the fifteen questions read out of the page
itself so the two can never disagree. Titles and descriptions are cut to what
a result actually shows.

**Verified, not assumed**

- 43 pages: 0 console errors, 0 failed requests, 0 broken images, 0 dead
  internal links, every page canonical, unique title and description.
- 0 horizontal overflow at 390 / 820 / 1440 px.
- 19 functional checks pass under the production CSP: cart, size selector,
  coverage calculator, catalogue, colour book, visualiser, FAQ accordion,
  quote form, mobile drawer.

The scripts are in `build/` and re-runnable.

**Portable paths.** The site no longer assumes it is mounted at the domain
root. HTML uses relative paths, resolved per depth — a bare path at the root,
`../` under `paints/`. Anything built in JavaScript, where one string is
inserted at both depths, goes through `window.cpUrl` / `window.cpLocalise`
from `js/base.js`, which reads the mount point off its own script URL.

This came out of a real failure: the GitHub Pages build lost every logo and
photograph while the files sat there answering 200, because a project site
serves from `/<repo>/` and every root-relative path missed by exactly that
prefix. `node build/serve.mjs 8323 Cloud-Paints` reproduces that shape, and
the site is now verified at both.

It also found the Datasheet button: the catalogue stores
`datasheets/<slug>.pdf`, which resolved to `/paints/datasheets/...` on the
new product URLs. That button led nowhere on all twelve products that have a
datasheet, and nothing but requesting every link would have caught it.

**The first load was 9.5MB, and the splash waited for all of it.**

Reported as "the bucket animation isn't happening on the first load". It was
happening — around twenty seconds in, to nobody. Three faults stacked:

1. `loader.js` started its sequence on `window.load`, which is the last byte
   of the page. On anything slower than an office connection the splash sat
   there until the whole 9.5MB had arrived. It now starts on whichever comes
   first: `load`, or a short beat after the document is parsed. The splash is
   bounded by its own choreography instead of by the network.
2. `hero-slides.js` preloaded every one of the twelve slides' tins and
   backdrops the moment the rotation started — about 6MB, for a hero that
   shows one slide every five seconds. It now fetches one slide ahead.
3. `hero-intro.js` did not even request the five line-up tins until the
   loader handed over, then gave them 600ms before animating regardless. On
   a cold cache the line-up flew in as five empty boxes. They are preloaded
   in the head now — 50KB, fetched during the splash.

Then the images. Six megabytes of the page was PNG, and a PNG with an alpha
channel is the worst possible container for a photograph of a paint tin. The
tin cut-outs, the logo mark and the splatters are WebP now: 5.25MB to 0.78MB,
an 85% cut with no visible difference. Not converted, deliberately: the
visualiser's room masks, where lossy compression would fray the alpha and let
paint bleed past the wall; and `logo.png`, which is the og:image.

  homepage, first visit    9.48 MB  ->  2.84 MB
  first six seconds                     1.92 MB
  cold cache at 4 Mbps     never*   ->  splash hands over at 4.1s
  cold cache on 3G                      15s, and the tins are decoded

  * the page did not finish loading within 45 seconds

Social cards are separate from on-page art for the same reason: product pages
show the WebP cut-out but advertise the JPEG to scrapers, because WhatsApp is
how this catalogue actually gets shared and its WebP handling is uneven. The
filenames with spaces in them are percent-encoded, which they were not.

`build/serve.mjs` now gzips text the way `mod_deflate` does in production, so
local weight measurements are honest: CSS 218KB → 51KB, JS 341KB → 115KB.

**Left alone on purpose**

- The 2.9-second opening loader. It is the Largest Contentful Paint and Google
  scores it, and 2.9s scores poorly — but it is the brand moment and the call
  was to keep it.
- Small uppercase eyebrow labels at 10–11px. Editorial, and deliberate. Form
  labels and consent text were raised to 12px on phones; those are the two
  places where small type costs someone something.
- Five inline prose links are under the 24px tap-target minimum
  ("Try it now →" and friends). WCAG exempts links inline in a sentence. The
  "← Discover" back link is the one that is arguably not prose.

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
rebuild. Nothing in the package invents a price. It runs to two pages inside a
double keyline frame, with no effective date and no page numbers.

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

**Decorative and textured finishes** are off the range flier and off the price
list — they are sold by weight, applied by hand and quoted per wall, so the
closing note on the price list points to the trade desk instead. They are still
on the range poster, in the range flier's tables and in their own brochure.

**Two prototype pages are still in the repo root** — `_bg-options.html`,
`_hero-open.html`, `_intro-trials.html`. They are publicly reachable if the
branch is deployed as-is. Delete them before launch, or leave them if you still
want the comparisons.

**The velvet grain on the hero** is a repeating SVG overlay. Baking it into a
tiled PNG would cut the compositing cost on large screens.
