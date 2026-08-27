// ============================================================
// CLOUD PAINTS — print package: shared helpers
// ============================================================
// Loads the website's product catalogue as the single source of
// truth, then supplies the small utilities every template needs:
// colour handling, text cleaning and the repeated page furniture.
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = path.resolve(ROOT, '..');

/* ---------- 1. Company ---------------------------------------------------
   One place for anything that appears in a footer. If the client moves
   premises or adds a line, it changes here and every document follows. */
export const CO = {
  brand:   'Cloud Paints',
  legal:   'Cloudsent Decor Ltd',
  strap:   'Buy it… Paint it… Love it..!',
  street:  '10 Rangwe Road, off Lunga Lunga Road',
  area:    'Industrial Area, Nairobi',
  box:     'P.O. Box 44192–00100',
  phones:  ['+254 741 405 481', '+254 788 866 620', '+254 727 779 085'],
  whatsapp:'+254 741 405 481',
  /* Both lines take WhatsApp. Kept separate from `phones` because the
     order differs — the second WhatsApp line is the third phone. */
  whatsapps:['0741 405 481', '0727 779 085'],
  /* One handle on all three networks, which is worth saying once
     rather than printing three times. */
  social:  { handle:'cloudpaintskenya', on:['Instagram', 'Facebook', 'X'] },
  email:   'info@cloudpaints.co.ke',
  web:     'www.cloudpaints.co.ke',
  hours:   'Mon–Fri 08:00–18:00 · Sat 09:00–16:00',
};

/* ---------- 2. Catalogue -------------------------------------------------
   products-data.js is a browser script that assigns to window. Running it
   in a vm with a stub window gets the array without duplicating any copy. */
export function loadProducts() {
  const src = fs.readFileSync(path.join(SITE, 'js', 'products-data.js'), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'products-data.js' });
  return ctx.window.CLOUD_PRODUCTS;
}

/* The colour collection is a second browser script beside the product
   catalogue, loaded the same way. 17 families of 32 shades, each with a
   Cloud Paints code, a name and a hex value. The shade card is generated
   from it, so a colour renamed on the website is renamed on the chart. */
export function loadColours() {
  const src = fs.readFileSync(path.join(SITE, 'js', 'colours-data.js'), 'utf8');
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'colours-data.js' });
  return ctx.window.CLOUD_COLOURS;
}

/* ---------- 3. Text ------------------------------------------------------ */
export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* The website's feature lists open several bullets with an emoji. Emoji
   render as flat monochrome glyphs in a PDF — or as tofu if the press RIP
   lacks the font — so they are stripped for print. */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0E}\u{FE0F}\u{200D}]/gu;

/* Characters outside the Latin subsets our two fonts ship with. One of these
   in a spec value is enough to make the renderer reach past Fraunces and Inter
   for a single glyph and embed a whole third font to draw it — which is how a
   Segoe UI "≤" ended up in the SuperMatt flier. Spelling them out is also
   plainer English on a printed page than a mathematical symbol. */
const SUBSTITUTE = [
  [/≤\s*/g, 'up to '],     // ≤
  [/≥\s*/g, 'at least '],  // ≥
  [/≠/g, 'not '],          // ≠
  [/₂/g, '2'],             // ₂  — CO₂ becomes CO2
  [/₁/g, '1'],
  [/×/g, 'x'],             // ×
  [/′/g, "'"],             // ′
];

export function clean(s) {
  let t = String(s || '').replace(EMOJI, '');
  for (const [re, to] of SUBSTITUTE) t = t.replace(re, to);
  return t.replace(/\s{2,}/g, ' ').trim();
}

/* Sentence-length guard. Print columns are narrow and an overset line is
   the most common way a generated layout goes wrong, so copy that would
   overflow is cut at a word boundary rather than mid-word. */
export function trim(s, max) {
  s = clean(s);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.—-]$/, '') + '…';
}

/* First sentence only — used where a card has room for one line. */
export function firstSentence(s, max = 120) {
  const t = clean(s);
  const m = t.match(/^[^.]+\./);
  return trim(m ? m[0] : t, max);
}

/* Whole sentences up to a budget.
   trim() cuts at a word and leaves an ellipsis, which is honest but reads as
   unfinished in a printed instruction — "…must be sanded…" looks like the
   flier was cut off at the press. Taking complete sentences instead means the
   panel always ends on a full stop; the reader gets less, never a fragment. */
export function sentences(s, max) {
  const t = clean(s);
  if (t.length <= max) return t;
  const parts = t.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!parts) return trim(t, max);
  let out = '';
  for (const p of parts) {
    if ((out + p).trim().length > max) break;
    out += p;
  }
  return out.trim() || trim(parts[0], max);
}

/* ---------- 4. Colour ----------------------------------------------------
   Product accents come from the website, where several sit on dark
   backgrounds. In print they land on white and some are far too pale to
   carry white text or read as a rule, so they are darkened until they
   clear a contrast floor. Nothing is invented — only adjusted. */
function hex2rgb(h) {
  const s = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16));
}
function rgb2hex(r) {
  return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, '0')).join('');
}
function lum([r, g, b]) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Darken toward black until the colour holds white text (~4.5:1). */
export function readable(hex) {
  let rgb = hex2rgb(hex);
  let guard = 0;
  while (lum(rgb) > 0.175 && guard++ < 40) rgb = rgb.map(v => v * 0.93);
  return rgb2hex(rgb);
}

/** Tint toward white — panel fills and soft rules. amount 0..1 = how white. */
export function tint(hex, amount) {
  const rgb = hex2rgb(hex).map(v => v + (255 - v) * amount);
  return rgb2hex(rgb);
}

/* ---------- 5. Assets ----------------------------------------------------
   Every template lives at a different depth under html/, so asset paths are
   built from a per-template prefix rather than hard-coded. */
export function assets(depth) { return '../'.repeat(depth) + 'assets'; }

const BUCKET_DIR = path.join(ROOT, 'assets', 'img', 'buckets');
const TEX_DIR    = path.join(ROOT, 'assets', 'img', 'textures');
const APPLIED_DIR= path.join(ROOT, 'assets', 'img', 'applied');

const has = (dir, f) => fs.existsSync(path.join(dir, f));

/** The hero image for a product: studio cut-out, or finish render for a
 *  texture. Returns null when we have no print-quality photograph — the
 *  templates then skip that product rather than print a weak image. */
export function heroImage(p, depth) {
  const a = assets(depth);
  if (has(BUCKET_DIR, p.slug + '.png')) return `${a}/img/buckets/${p.slug}.png`;
  if (has(TEX_DIR, 'finish-' + p.slug + '.jpg')) return `${a}/img/textures/finish-${p.slug}.jpg`;
  if (has(TEX_DIR, p.slug + '.jpg')) return `${a}/img/textures/${p.slug}.jpg`;
  return null;
}
export function isTexture(p) { return p.cat === 'texture'; }

/** The same image at thumbnail size, for the poster grid, the price list and
 *  the brochure rows — all of which draw a tin about 26mm tall. The renderer
 *  embeds whatever it is handed, so pointing these at the full-size file made
 *  the price list carry 28 print-resolution tins to draw 28 thumbnails.
 *  Falls back to the full-size image if prep-art.py has not been run. */
export function thumbImage(p, depth) {
  const a = assets(depth);
  if (fs.existsSync(path.join(BUCKET_DIR, 'sm', p.slug + '.png')))
    return `${a}/img/buckets/sm/${p.slug}.png`;
  if (fs.existsSync(path.join(TEX_DIR, 'sm', 'finish-' + p.slug + '.jpg')))
    return `${a}/img/textures/sm/finish-${p.slug}.jpg`;
  if (fs.existsSync(path.join(TEX_DIR, 'sm', p.slug + '.jpg')))
    return `${a}/img/textures/sm/${p.slug}.jpg`;
  return heroImage(p, depth);
}

/** Optional in-situ photograph, where one exists. */
export function appliedImage(p, depth) {
  const a = assets(depth);
  for (const f of [`${p.slug}-applied.jpg`, `${p.slug}-applied-portrait.jpg`]) {
    if (has(APPLIED_DIR, f)) return `${a}/img/applied/${f}`;
  }
  return null;
}

/* ---------- 6. Page furniture -------------------------------------------- */

/** Document head. Fonts and the design system are local files, so the
 *  package renders identically with no network connection. */
export function head(title, depth, extraCss = '') {
  const a = assets(depth);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${a}/css/print.css">
${extraCss ? `<style>\n${extraCss}\n</style>` : ''}
</head>
<body>`;
}

export const tail = `</body>\n</html>\n`;

/** Masthead: logo one side, standards mark and classification the other. */
export function mast(depth, { tag = '', grade = '', logoW = '26mm', kebs = true } = {}) {
  const a = assets(depth);
  return `
<header class="mast">
  <img class="mast-logo" style="width:${logoW}" src="${a}/img/brand/logo.png" alt="Cloud Paints">
  <div class="mast-right">
    ${grade ? `<span class="tag tag--grade">${esc(grade)}</span>` : ''}
    ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}
    ${kebs ? `<img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">` : ''}
  </div>
</header>`;
}

/** Full contact footer — the band that makes a flier actionable.
 *  A4 and wider only: below about 180mm the three columns wrap and the band
 *  grows past the space the page reserved for it. Narrow sheets take
 *  footCompact() instead, which is two lines whatever the width. */
export function foot() {
  return `
<footer class="foot">
  <div class="foot-items">
    <div class="foot-item"><strong>Call or WhatsApp</strong>${esc(CO.phones[0])}<br>${esc(CO.phones[1])}</div>
    <div class="foot-item"><strong>Email</strong>${esc(CO.email)}</div>
    <div class="foot-item"><strong>Visit</strong>${esc(CO.street)}<br>${esc(CO.area)}</div>
  </div>
  <div class="foot-brand">${esc(CO.web)}<span>${esc(CO.legal)}</span></div>
</footer>`;
}

/** Two fixed lines — for A5 and anything else too narrow for the full band. */
export function footCompact() {
  return `
<footer class="foot foot--slim">
  <div class="foot-lines">
    <div>${esc(CO.phones[0])} &nbsp;·&nbsp; ${esc(CO.phones[1])} &nbsp;·&nbsp; ${esc(CO.email)}</div>
    <div>${esc(CO.street)}, ${esc(CO.area)}</div>
  </div>
  <div class="foot-brand">${esc(CO.web)}<span>${esc(CO.legal)}</span></div>
</footer>`;
}

/** Single-line footer for narrow panels. */
export function footLine() {
  return `<div class="fine">${esc(CO.legal)} · ${esc(CO.street)}, ${esc(CO.area)} · `
       + `${esc(CO.phones[0])} · ${esc(CO.email)} · ${esc(CO.web)}</div>`;
}

/** Black or white, whichever is legible on the given ground.
 *  readable() solves the same problem the other way round — it darkens a
 *  colour until white type holds on it. That is right for an accent whose
 *  exact value does not matter, and wrong for a tin's own label colour:
 *  darkening Road Marking's yellow until white type passes turns it olive,
 *  which is the one thing the label box must not do. So the colour stays
 *  put and the type moves instead. */
export function inkOn(hex) {
  const L = lum(hex2rgb(hex));
  const onWhite = 1.05 / (L + 0.05);
  const onInk = (L + 0.05) / (lum(hex2rgb('#12142b')) + 0.05);
  return onWhite >= onInk ? '#ffffff' : '#12142b';
}

/** Accent custom properties for a product or category colour. */
export function accentVars(hex) {
  const a = readable(hex);
  return `--accent:${a};--accent-soft:${tint(a, 0.92)};`;
}

/* ---------- 7. Output ---------------------------------------------------- */
export function write(rel, html) {
  const out = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html, 'utf8');
  return rel;
}
