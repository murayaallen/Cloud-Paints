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
// Sizes must match the product's own size list in js/products-data.js.
// Anything listed here that the product does not stock is ignored.
//
// The list carries no page numbers, by request. It does carry an effective
// date: a price list without one cannot be told apart from the last one on
// the counter, and the trade desk needs to know which sheet a customer is
// holding. Set it blank to print no date at all.
//
// Textured and decorative finishes are NOT in this list. They are sold by
// weight, applied by hand and quoted per wall, so they are handled on the
// decorative-finishes brochure and by the trade desk instead.
// ============================================================

export const EFFECTIVE_FROM = '01.08.2026';   // blank string prints no date

export const CURRENCY = 'KSHS';

// Trade/dealer note printed at the foot of the last page. Blank to omit.
export const TRADE_NOTE =
  'Prices are recommended retail, inclusive of VAT, and exclude delivery. ' +
  'Dealer, contractor and bulk rates are available on application — ask for the trade desk.';

export const PRICES = {

  /* ---- Interior wall paints ---- */
  'silk-vinyl':          { '20L': 0, '4L': 0, '1L': 0 },
  'vinyl-matt':          { '20L': 0, '4L': 0, '1L': 0 },
  'iris-economy':        { '20L': 0, '4L': 0, '1L': 0 },

  /* ---- Primers, sealers & undercoats ---- */
  'supermatt':           { '30kg': 0, '10kg': 0 },
  'universal-undercoat': { '4L': 0, '1L': 0 },
  'metal-primer':        { '5L': 0, '1L': 0 },

  /* ---- Exterior & roof ---- */
  'weatherguard':        { '20L': 0, '4L': 0, '1L': 0 },
  'rocketex':            { '30kg': 0, '5kg': 0 },
  'roof-paint':          { '4L': 0, '1L': 0 },

  /* ---- Wood & metal ---- */
  'gloss-enamel':        { '4L': 0, '1L': 0 },
  'super-gloss':         { '20L': 0, '4L': 0, '1L': 0 },
  'clear-varnish':       { '20L': 0, '4L': 0, '1L': 0 },
  'varnish-stain':       { '5L': 0, '1L': 0 },

  /* ---- Floor & road ---- */
  'floor-paint':         { '4L': 0, '1L': 0 },
  'road-marking':        { '20L': 0, '4L': 0, '1L': 0 },

  /* ---- Solvents & thinners ---- */
  'white-spirit':        { '5L': 0, '1L': 0 },
  'turpentine':          { '5L': 0, '1L': 0 },
  'standard-thinner':    { '5L': 0, '1L': 0 },
};

// Order and grouping of the printed price list. Each group becomes a
// headed section. Slugs not listed here simply do not print.
//
// Within a section the builder floats the photographed tins to the top and
// lets the unphotographed lines settle at the foot, so the picture column
// never breaks up mid-section. Order inside each of those two blocks is
// whatever you write here.
export const PRICE_GROUPS = [
  { title: 'Interior application',
    slugs: ['silk-vinyl', 'vinyl-matt', 'iris-economy'] },

  { title: 'Exterior application',
    slugs: ['weatherguard', 'rocketex', 'roof-paint'] },

  { title: 'Primers, sealers & undercoats',
    slugs: ['supermatt', 'universal-undercoat', 'metal-primer'] },

  { title: 'Wood & metal finishes',
    slugs: ['super-gloss', 'gloss-enamel', 'clear-varnish', 'varnish-stain'] },

  { title: 'Floor & road marking',
    slugs: ['floor-paint', 'road-marking'] },

  { title: 'Solvents & thinners',
    slugs: ['white-spirit', 'turpentine', 'standard-thinner'] },
];
