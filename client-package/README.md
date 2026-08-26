# Cloud Paints — Marketing & Print Package

Print-ready artwork for **Cloudsent Decor Ltd**, generated from the Cloud Paints
website's own product catalogue so print and web never drift apart.

Everything in `pdf/` is finished artwork. Everything in `html/` is the editable
master behind it. Change a product on the website, re-run two commands, and the
whole package follows.

---

## 1. What's in the box

| Folder | What it is | Size | Pages | Count |
|---|---|---|---|---|
| `pdf/0-colour-flier/` | **Colour treatment sample** — one product, complete, on a field of its own colour | A4, A5 | 1 | 2 |
| `pdf/6-range-flier/` | **The whole range in one folded piece** — cover, two inner pages, back | folds to A4 / A5 | 2 | 2 |
| `pdf/1-range-poster/` | The whole range on one sheet — wall poster for the showroom, dealer counters, trade stands | A2, A3 | 1 | 2 |
| `pdf/2-product-fliers-A4/` | One product per sheet, full technical detail | A4 | 1 | 22 |
| `pdf/3-product-fliers-A5/` | The hand-out version — same product, the essentials | A5 | 1 | 22 |
| `pdf/4-brochures/` | Tri-fold brochures, printed both sides | A4 landscape | 2 | 5 |
| `pdf/5-price-list/` | Trade and retail price list | A4 | 2 | 1 |
| `pdf/7-colour-collection/` | **The full shade card** — 544 shades in 17 families, one family per page | A4 | 21 | 1 |

**63 documents, 91 pages, 90 MB.** All RGB. Every glyph is embedded as a
vector outline, so nothing depends on a font being installed at the printer.
Median document is 1.1 MB — small enough to send on WhatsApp or email.

### The range flier

`pdf/6-range-flier/` is the whole range in one folded piece — the general-purpose
hand-out. Two sizes, same content:

| File | Flat sheet | Folded |
|---|---|---|
| `...folds-to-A4.pdf` | A3 landscape, 420 × 297 mm | A4, 210 × 297 mm |
| `...folds-to-A5.pdf` | A4 landscape, 297 × 210 mm | A5, 148.5 × 210 mm |

**A half fold, four panels.** Print double-sided, **flip on the SHORT edge**,
then fold the left half over the right with the inside face up.

```
Page 1 (outside)   [ BACK COVER ]  [ FRONT COVER ]
Page 2 (inside)    [ INNER LEFT ]  [ INNER RIGHT ]
```

Both panels are full width — a half fold needs no tuck-in allowance, unlike the
tri-folds. Fold position: the centre of the sheet (210 mm on the A3, 148.5 mm
on the A4).

- **Front cover** — logo and standards mark, title, the eight-colour swatch
  strip, the range description, and five tins across the foot.
- **Inside spread** — all twelve studio-photographed tins, six per panel, split
  into *Walls, inside and out* and *Wood, metal, roofs & road*.
- **Back cover** — about the company, the six lines we have no tin photograph
  for, what you get at the counter, the coverage table (A4 fold only — the A5
  has no room for it), and full contact details.

The A5 fold carries the same structure with less body copy: at 148.5 mm wide
the panels cannot hold the A4's word count at a readable size.

### The colour flier

`pdf/0-colour-flier/` holds a **sample of an alternative treatment**: the same
complete product information as the white A4 and A5 fliers, but on a field of
the product's own colour, with the tin cut-out breaking the edge of that field.

It is drawn for **Weatherguard** as a sample to approve. To try another product,
change one line in `build/build.mjs`:

```js
const COLOUR_SAMPLE = 'weatherguard';   // any slug from products-data.js
```

If the treatment is approved it can be rolled across the whole range the same
way the white fliers are — 22 products x A4 + A5.

Two notes on it. The logo and the standards mark are red-and-blue on transparent
and vanish on a deep ground, so they sit together in a white chip; that is the
same device the price list masthead uses. And on the A5, step 2 of *How to apply*
ends in an ellipsis — the source sentence runs to 176 characters with no clause
break in it, so the alternative would be shortening the label copy itself.

### The colour collection

`pdf/7-colour-collection/` is the full shade card: **544 shades in 17 families,
one family to a page**, generated from `js/colours-data.js` — the same list the
website's colour pages read, so a shade renamed on the site is renamed here at
the next build.

Twenty-one A4 pages: a cover, a page explaining the numbering, seventeen family
pages, a finishes and textures page, and a back page with a write-on selection
table.

Each family page holds thirty-two patches in a four-wide grid, read left to
right, palest first. The code carries the depth — `CP·RD010` is the lightest red
and `CP·RD320` the deepest, in steps of ten — so the same position in any two
families is roughly the same depth. The name and code are printed **under** each
patch rather than over it, which keeps the whole patch available to judge.

**Print this one properly.** It is the piece where colour accuracy is the
product, not a nicety — see *Colour* below.

### The five brochures

| File | Covers |
|---|---|
| `range.pdf` | The company and the full line-up — the general-purpose leave-behind |
| `interior.pdf` | Silk Vinyl, Vinyl Matt, Iris, SuperMatt, Universal Undercoat |
| `exterior.pdf` | Weatherguard, Rocketex, Vinyl Matt, Roof Paint, SuperMatt |
| `wood-metal.pdf` | Enamels, varnishes, primers, floor and road paint, thinners |
| `textures.pdf` | The ten decorative and textured finishes |

---

## 2. Printing it

### Sizes and stock

| Piece | Trim | Suggested stock | Finish |
|---|---|---|---|
| Range poster | A2 420 × 594 mm · A3 297 × 420 mm | 170 gsm gloss or satin art | Matt lamination if it will be handled |
| A4 flier | 210 × 297 mm | 150–170 gsm gloss art | Optional gloss lamination |
| A5 flier | 148 × 210 mm | 150 gsm gloss art | None — these are giveaways |
| Tri-fold brochure | 297 × 210 mm folded to 99 × 210 mm | 150 gsm silk | Matt lamination, then fold |
| Range flier | A3 420 × 297 mm → folds to A4 · **A4 297 × 210 mm → folds to A5** | 150 gsm silk | Matt lamination, then fold |
| Price list | 210 × 297 mm | 100–120 gsm bond | None — it gets written on |
| Colour collection | 210 × 297 mm | 200 gsm silk or matt art | Matt lamination — it is handled constantly |

### Duplex and folding — the brochures

Each brochure PDF is **two pages: page 1 is the outside, page 2 is the inside.**

- Print **double-sided, flipping on the SHORT edge** (landscape sheets).
- Fold: **roll fold** (also called letter fold) — fold the left panel in first,
  then the right panel over it.
- Panel widths are already set for it: the panel that tucks inside is **96 mm**,
  the other two are **100.5 mm**. That difference is deliberate — equal thirds
  bind and buckle at the spine when folded.

Panel order as printed, left to right:

```
Page 1 (outside)   [ tuck-in flap 96 ] [ back cover 100.5 ] [ FRONT COVER 100.5 ]
Page 2 (inside)    [ panel 1 100.5 ]   [ panel 2 100.5 ]    [ panel 3 96 ]
```

Fold positions measured from the left edge of page 1: **96 mm** and **196.5 mm**.

### Bleed

The artwork is supplied at **trim size with no bleed**, because nothing in it
needs any: every coloured element — the head bands, the footer bands, the price
list masthead — runs to the sheet edge as a solid, so a printer can simply
scale up 3 mm or shift the trim without touching a single image or line of type.

If your printer insists on a bleed PDF, tell them: *"trim size supplied, please
add 3 mm bleed by extending the edge colours."* That takes them ten seconds and
costs nothing.

### Colour

Artwork is **RGB**. Kenyan digital presses print RGB PDFs directly. If the job
goes to offset litho the printer will convert to CMYK — ask them to use
**FOGRA39 / ISO Coated v2** and to watch these three brand colours:

| Colour | RGB | Nearest CMYK | Where it appears |
|---|---|---|---|
| Corporate blue | `#1E3A8A` | 96 / 79 / 0 / 15 | Footer bands, headings, rules |
| Wine red | `#8B1E2C` | 22 / 100 / 82 / 15 | Exterior range, accents |
| Mustard gold | `#E8A317` | 6 / 39 / 100 / 0 | Footer labels, small highlights |

The deep blue is the one to check on press — it goes muddy if the black plate
is over-inked.

**The colour collection is the exception to all of the above.** On every other
document colour is decoration; on the shade card it is the content, and a
customer will hold a patch against a wall and expect the paint to match it.

- Print it on a **colour-managed press**, on one stock, in one run. Do not let
  it be reprinted piecemeal — two batches on different paper will not agree, and
  a customer comparing an old card with a new one will be looking at two
  different colours with the same name.
- Ask for a **wet proof** of two or three family pages before the full run, and
  check the pale families (Whites, Greys) and the strong ones (Reds, Oranges).
  Those drift the most.
- The patches are printed ink and the product is paint: they will never match
  exactly. The card says so on the inside front page and the counter should say
  so too — the chart is for finding and naming a shade, and a **brush-out of the
  mixed paint** is what a customer should approve before a wall is committed.

---

## 3. Fonts

**Fraunces** (headings) and **Inter** (everything else), both open-licence
(SIL OFL) — free to use commercially, including on packaging and signage.

The font files live in `assets/fonts/`, so the package regenerates with no
internet connection. In the PDFs the glyphs are embedded as **vector outlines**
rather than as an installable font: they print at full resolution on any device,
need no font installed at the printer, and the text still copies and searches.
Nothing in the package will ever substitute a font on you.

Characters outside these two fonts' Latin range are replaced at build time
rather than left to fall back to a system font — `≤` becomes "up to", `CO₂`
becomes "CO2". One stray glyph is otherwise enough to drag a whole third
typeface into a document.

Minimum type size used anywhere is **6.2 pt** (footer category labels, all-caps
and letterspaced). Body copy is 7–9 pt on fliers and 9.5–10.5 pt on the poster.

---

## 4. Setting the prices

The price list ships **unpriced on purpose** — every pack size shows a ruled
blank to write or type into, so the layout can be approved before the numbers
are decided. Nothing in this package invents a price.

To fill them in, edit **one file**: `build/prices.js`

```js
export const PRICES = {
  'silk-vinyl': { '1L': 800, '4L': 2800, '20L': 14000 },
  //                    ^ numbers only — no commas, no "KSHS"
  'rocketex':   { '5kg': 0, '30kg': null },
  //                     ^ 0 = blank rule to write on
  //                                ^ null = "—", pack not offered
};
```

Then re-generate (see below). `PRICE_GROUPS` in the same file controls the
section order and which products appear.

**The list carries no effective date and no page numbers.** It is reprinted
whenever the numbers move, so a date only ages it on the counter, and page
numbers are furniture on a two-page document nobody files.

**Textured and decorative finishes are not in the list.** They are sold by
weight, applied by hand and quoted per wall, so they are handled by the
decorative-finishes brochure and the trade desk instead. The closing note on
the last page says so. They are still on the range poster, in the range flier
and in their own brochure — only the price list drops them.

**Within a section the photographed tins float to the top** and the six lines
with no print-quality photograph settle at the foot of that section, so the
picture column never breaks up mid-section. Their cards still print the empty
picture panel, because a card that stops 19 mm short of its neighbour breaks
the grid far more visibly than a blank panel does.

---

## 5. Re-generating the package

Needs **Node 22+** and **Microsoft Edge or Chrome** (already on the machine).
Python 3 with Pillow and NumPy is needed only for the artwork step.

```bash
cd client-package

node build/build.mjs      # catalogue + prices -> html/   (about 1 second)
node build/render.mjs     # html/ -> pdf/                 (about 2 minutes)
python build/verify.py    # check the finished PDFs       (a few seconds)
```

Render one thing at a time by passing a filter:

```bash
node build/render.mjs price          # just the price list
node build/render.mjs weatherguard   # both Weatherguard fliers
node build/render.mjs brochures      # all five brochures
```

`build/render.mjs` checks every document before it prints it and reports any
text that overflows its box, any contact band that would cover the content
above it, and any image that failed to load. **A clean run ends with
"No overset text, no missing images."** If it doesn't, the warning names the
file and the box.

`build/verify.py` then checks the **finished PDFs**, which is a different job:
every page is measured against its nominal trim size, every document is checked
for embedded glyphs, and every line the page showed in the browser is looked
for in the PDF's own text.

That last check earns its place. The print engine can drop a whole block that
the DOM lays out perfectly — a box landing on a page boundary is moved to the
next page rather than split, and if nothing follows it, it disappears with no
error anywhere. That is exactly how the A5 range flier lost its entire contact
block, and no measurement taken in the browser could see it. A clean run ends
with three lines all reading as passes.

To proof on screen without generating PDFs, open any file in `html/` in a
browser — the sheets stack vertically with fold guides visible (those guides
are screen-only and never print).

### If the artwork changes

```bash
python build/prep-art.py
```

Trims tin cut-outs to their own edges, rebuilds anything that was downsampled,
reports the true printed resolution of every image, and regenerates the
thumbnail sets used by the poster, price list and brochure rows. Safe to run
repeatedly.

---

## 6. Two things worth knowing

### Six tins need re-photographing

These were only ever supplied at around 220 px wide. They have been resampled
up so they sit consistently beside the rest of the range and don't show pixel
steps on press — but resampling cannot add detail that was never captured, and
they will look softer than the others in print:

| Product | Native size | True resolution at print size |
|---|---|---|
| Turpentine | 200 × 303 | 82 dpi |
| Road Marking Paint | 218 × 286 | 89 dpi |
| Super Gloss | 218 × 286 | 89 dpi |
| Gloss Enamel | 221 × 283 | 91 dpi |
| Clear Varnish | 224 × 286 | 92 dpi |
| Roof Paint | 240 × 287 | 98 dpi |

The other six tins are 650–681 px and print at 266–279 dpi, which is right.
A single afternoon re-shooting these six against white would lift the whole
package. Drop the new files into `assets/img/buckets/` as `<slug>.png`, run
`prep-art.py`, and rebuild.

### Six products have no flier

No print-quality photograph exists for **Metal Primer, Universal Undercoat,
Varnish Stain, Floor Paint, White Spirit** or **Standard Thinner**. Rather than
print a phone snapshot of a tin on a desk, they appear as a text listing —
"Also in the range" — in the relevant brochure, and as normal rows in the price
list. Photograph them and they will pick up fliers automatically on the next
build.

---

## 7. How it fits together

```
client-package/
├── README.md              this file
├── build/
│   ├── build.mjs          all templates — the design lives here
│   ├── lib.mjs            shared helpers: company details, colour, text
│   ├── prices.js          THE PRICE TABLE — edit this
│   ├── render.mjs         HTML -> PDF, with layout checks
│   ├── verify.py          checks the finished PDFs
│   ├── prep-art.py        artwork preparation
│   ├── art-native.json    true resolution of each tin, before resampling
│   └── expected-text.json what each page said, for verify.py
├── assets/
│   ├── css/print.css      the print design system
│   ├── fonts/             Fraunces + Inter (SIL OFL)
│   └── img/               logo, KEBS mark, tins, finishes, projects
├── html/                  generated masters — do not hand-edit
│   ├── fliers/            a4/  a5/  colour/
│   ├── brochures/
│   └── poster-range-*.html · price-list.html
└── pdf/                   finished artwork
```

Product copy, specifications, pack sizes and colours all come from
`js/products-data.js` in the website. It is the single source of truth: correct
a coverage figure there and it corrects itself on the flier, the brochure, the
poster and the price list at the next build.

Company details — address, phone numbers, email, opening hours — live in one
place, `CO` at the top of `build/lib.mjs`. Change them there and every footer
in the package follows.
