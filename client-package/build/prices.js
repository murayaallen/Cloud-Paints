// ============================================================
// CLOUD PAINTS — Price list data
// ============================================================
// THIS IS THE ONLY FILE YOU NEED TO EDIT TO UPDATE PRICES.
//
// How to use
//   1. Type the retail price against each pack size below.
//      Numbers only — no commas, no "KSHS". The template adds those.
//        '4L': 2800        ->  prints  2,800 KSHS
//   2. Leave a size as null if that pack is not offered.
//        '20L': null       ->  prints  —
//   3. Leave it as 0 if the pack exists but the price is not yet set.
//        '20L': 0          ->  prints  a blank rule to write on
//   4. Set EFFECTIVE_FROM to the date the list takes effect.
//   5. Re-run:  node build/build.mjs  &&  node build/render.mjs
//
// ---- Why this file no longer points at product slugs -------------------
// It used to hold PRICES keyed by catalogue slug and PRICE_GROUPS listing
// which slug went in which section, and the builder took the pack sizes
// from js/products-data.js. That works only while the price list and the
// catalogue describe the same things, and they no longer do.
//
// The client's price list sells VARIANTS. Weatherguard and Weatherguard
// with Silicone are two lines at two prices; so are Rocktex Tinted and
// Rocktex Plain, Road Marking Yellow and Road Marking White/Black, Roof
// Paint and Roof Paint Economy. The catalogue has one product for each of
// those, because the website sells one product with one datasheet. It also
// carries lines the catalogue has never had — Transil-Stone Guard, NC
// Sanding Sealer, Black Bituminous, Road Marking Thinner — and its own
// sections, which are not the website's sections.
//
// So the price list now states its own rows in its own order. `art` names a
// catalogue slug purely to borrow that product's photograph and its label
// colour; two rows may share one, and a row may have neither. Sizes come
// from the price table below and are not checked against the catalogue,
// because a variant's pack sizes are a fact about the variant.
//
// The list carries no page numbers, by request. It does carry an effective
// date: a price list without one cannot be told apart from the last one on
// the counter, and the trade desk needs to know which sheet a customer is
// holding. Set it blank to print no date at all.
// ============================================================

export const EFFECTIVE_FROM = '01.08.2026';   // blank string prints no date

// Printed as a prefix against every figure — Kshs.15,300 — so it is set
// the way it reads, not in caps.
export const CURRENCY = 'Kshs';

// Trade/dealer note printed at the foot of the last page. Blank to omit.
export const TRADE_NOTE =
  'Prices are recommended retail, inclusive of VAT, and exclude delivery. ' +
  'Dealer, contractor and bulk rates are available on application — ask for the trade desk.';

/* Sections, rows and prices exactly as the client's price list states them.
 *
 *   name    what prints on the label box
 *   art     catalogue slug to borrow a photograph and label colour from,
 *           or null for a line we hold no photograph of — those print the
 *           prices alone, with no picture panel
 *   colour  only where there is no `art` to take a colour from
 *   desc    one line on what the product is for. The range flier prints
 *           it; the price list does not. Taken from the catalogue's own
 *           copy where the product exists there, and written from the
 *           product type where the price list carries a line the
 *           catalogue has never had.
 *   prices  size -> price. 0 prints a rule to write on; null prints a dash
 */
export const PRICE_LIST = [
  {
    title: 'Interior Application',
    rows: [
      { name: 'Silk Vinyl', art: 'silk-vinyl',
        desc: 'Silky low-sheen emulsion for interior walls, easy to wipe clean.',
        prices: { '20L': 13950, '4L': 2750, '1L': 780 } },
      { name: 'Vinyl Matt', art: 'vinyl-matt',
        desc: 'Brilliant long-lasting white with a smooth non-reflective matt finish.',
        prices: { '20L': 11950, '4L': 2350, '1L': 650 } },
      { name: 'SuperMatt Premium Grade', art: 'supermatt',
        desc: 'The smooth matt base coat under decorative top coats, high coverage.',
        prices: { '20L': 4500, '4L': 1000, '1L': 300 } },
    ],
  },
  {
    title: 'Exterior Application',
    rows: [
      { name: 'Weatherguard with Silicone', art: 'weatherguard',
        desc: 'Silicone-fortified exterior finish that repels water and holds colour.',
        prices: { '20L': 16200, '4L': 3100, '1L': 1000 } },
      { name: 'Weatherguard', art: 'weatherguard',
        desc: 'Premium acrylic exterior wall paint built for sun, rain and dust.',
        prices: { '20L': 15300, '4L': 3050, '1L': 850 } },
    ],
  },
  {
    title: 'Interior / External Application',
    rows: [
      // The document prices this 20L at 11,900 and the Interior one at
      // 11,950. Confirmed the same tin at the same price, so both read
      // 11,950 and the two Vinyl Matt rows no longer disagree.
      { name: 'Vinyl Matt', art: 'vinyl-matt',
        desc: 'Brilliant long-lasting white with a smooth non-reflective matt finish.',
        prices: { '20L': 11950, '4L': 2350, '1L': 650 } },
      { name: 'Transil-Stone Guard', art: null, colour: '#5b7080',
        desc: 'Protective coating for stone and rendered walls, inside or out.',
        prices: { '20L': 10400, '4L': 2050, '1L': 575 } },
    ],
  },
  {
    title: 'Textured Finish',
    rows: [
      { name: 'Rocktex Wallmaster Tinted', art: 'rocketex',
        desc: 'Super-premium acrylic textured coating, tinted to your colour.',
        prices: { '30kg': 5000, '10kg': 1300 } },
      { name: 'Rocktex Wallmaster Plain', art: 'rocketex',
        desc: 'The same textured coating supplied plain, for tinting or over-painting.',
        prices: { '30kg': 4600, '10kg': 1200 } },
    ],
  },
  {
    title: 'Roof Paint Premium',
    rows: [
      { name: 'Roof Paint', art: 'roof-paint',
        desc: 'Durable flexible coating for galvanised roofing sheets and steelwork.',
        prices: { '4L': 3200, '1L': 880 } },
      { name: 'Roof Paint Water Based', art: 'roof-paint',
        desc: 'The same roof protection in a low-odour water-based formulation.',
        prices: { '4L': 3045, '1L': 850 } },
    ],
  },
  {
    title: 'Wood Varnishes',
    rows: [
      { name: 'Varnish Stain', art: 'varnish-stain',
        desc: 'Tinted polyurethane varnish that stains and protects timber in one coat.',
        prices: { '4L': 2400, '1L': 650 } },
      { name: 'Clear Varnish', art: 'clear-varnish',
        desc: 'Quick-drying clear varnish for doors, trim, furniture and joinery.',
        prices: { '4L': 2650, '1L': 740 } },
    ],
  },
  {
    title: 'Road Paint',
    rows: [
      { name: 'Road Marking Yellow', art: 'road-marking',
        desc: 'Fast-drying high-opacity yellow for road, car park and floor markings.',
        prices: { '4L': 3500, '1L': 960 } },
      { name: 'Road Marking White / Black', art: 'road-marking',
        desc: 'The same fast-drying marking paint, supplied in white and in black.',
        prices: { '4L': 3400, '1L': 960 } },
    ],
  },
  {
    title: 'Gloss Paints Finish',
    rows: [
      { name: 'Super Gloss Premium', art: 'super-gloss',
        desc: 'Quick-drying high gloss for interior and exterior wood and metal.',
        prices: { '4L': 3000, '1L': 950 } },
    ],
  },
  {
    title: 'Floor Paint Premium',
    rows: [
      { name: 'Floor Paint', art: 'floor-paint',
        desc: 'Heavy-duty coating for industrial and residential concrete floors.',
        prices: { '4L': 2800, '1L': 780 } },
    ],
  },
  {
    title: 'Undercoats',
    rows: [
      { name: 'Universal Undercoat', art: 'universal-undercoat',
        desc: 'All-purpose undercoat giving wood, metal and masonry a smooth base.',
        prices: { '20L': 10290, '4L': 2040, '1L': 550 } },
    ],
  },
  {
    title: 'Wood Finish',
    rows: [
      { name: 'NC Sanding Sealer', art: null, colour: '#7a5c33',
        desc: 'Nitrocellulose sealer that fills wood grain and sands back smooth.',
        prices: { '20L': 10300, '4L': 2050, '1L': 560 } },
    ],
  },
  {
    title: 'Bituminous Paints',
    rows: [
      { name: 'Black Bituminous', art: null, colour: '#1f2124',
        desc: 'Bitumen-based black coating for waterproofing and metal protection.',
        prices: { '4L': 2030, '1L': 600 } },
    ],
  },
  {
    title: 'Thinners',
    rows: [
      { name: 'White Spirit', art: 'white-spirit',
        desc: 'High-purity thinner for oil-based paints and for cleaning equipment.',
        prices: { '5L': 1500, '1L': 300 } },
      { name: 'Standard Thinner', art: 'standard-thinner',
        desc: 'All-round hydrocarbon thinner for enamels and undercoats.',
        prices: { '5L': 1550, '1L': 330 } },
      { name: 'Turpentine', art: 'turpentine',
        desc: 'Pine-derived thinner for oil-based paints, enamels and varnishes.',
        prices: { '5L': 1400, '1L': 290 } },
      // No photograph, and no stand-in: an unlabelled jerrican said nothing
      // about the product that its own name did not already say.
      { name: 'Road Marking Thinner', art: null, colour: '#46566b',
        desc: 'Thinner blended for road marking paint and its spray equipment.',
        prices: { '5L': 2280, '1L': 490 } },
    ],
  },
  {
    title: 'Budget Paints',
    rows: [
      { name: 'Metal Primer Red Oxide', art: 'metal-primer',
        desc: 'Anti-corrosive red oxide primer for gates, grilles and ferrous metal.',
        prices: { '4L': 1140, '1L': 315 } },
      // The client's document says 5L here; confirmed a slip — Gloss Enamel
      // is a 4L tin, as the catalogue and every other document have it. The
      // price is unchanged, only the pack it is against.
      { name: 'Gloss Enamel', art: 'gloss-enamel',
        desc: 'Oil-based gloss enamel for wood, metal and plaster, inside and out.',
        prices: { '4L': 1150, '1L': 314 } },
      { name: 'Iris Plastic Emulsion', art: 'iris-economy',
        desc: 'Economy emulsion for interior walls and ceilings, good hiding power.',
        prices: { '20L': 2150, '4L': 440, '1L': 150 } },
      { name: 'Roof Paint Economy', art: 'roof-paint',
        desc: 'Economy roof coating for galvanised sheets and exposed steelwork.',
        prices: { '4L': 1320, '1L': 360 } },
      { name: 'Floor Paint Economy', art: 'floor-paint',
        desc: 'Economy floor coating for concrete in lighter-traffic areas.',
        prices: { '4L': 1340, '1L': 360 } },
    ],
  },
];
