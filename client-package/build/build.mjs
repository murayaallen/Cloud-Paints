// ============================================================
// CLOUD PAINTS — print package builder
// ============================================================
// Generates every HTML master in html/ from the website's own
// product catalogue. Nothing here is hand-maintained: change a
// product on the website, re-run this, and the print collateral
// follows.
//
//   node build/build.mjs
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, CO, loadProducts, esc, clean, trim, firstSentence, sentences,
  assets, heroImage, thumbImage, appliedImage, isTexture,
  head, tail, mast, foot, footCompact, footLine, accentVars, write, tint, readable,
} from './lib.mjs';
import { PRICES, PRICE_GROUPS, CURRENCY, TRADE_NOTE } from './prices.js';

const P = loadProducts();
const bySlug = Object.fromEntries(P.map(p => [p.slug, p]));
const made = [];

/* Products we hold a print-quality photograph for. The rest appear in the
   range tables and price list but get no flier — a phone snapshot of a tin
   on a desk would undercut the whole package. */
const withArt = P.filter(p => heroImage(p, 0));
const paints  = withArt.filter(p => !isTexture(p));
const textures= withArt.filter(p =>  isTexture(p));

/* ---------- shared fragments -------------------------------------------- */

const safetyLine = p =>
  clean([p.safety?.lead, p.safety?.voc].filter(Boolean).join(' · ')) ||
  'Water-based · lead-free · low odour';

const specRows = (p, max) => Object.entries(p.specs || {}).slice(0, max)
  .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(trim(v, 52))}</td></tr>`).join('');

const packChips = p => (p.sizes || [])
  .map((s, i) => `<span class="pack${i === 0 ? '' : ''}">${esc(s)}</span>`).join('');

/* The hero visual. A tin is a cut-out that floats; a texture is a render
   that wants an edge, so each gets its own treatment rather than one
   compromise frame that suits neither. */
function heroArt(p, depth, w) {
  const src = heroImage(p, depth);
  if (!src) return '';
  if (isTexture(p)) {
    return `<div class="hero-tex" style="width:${w}"><img src="${src}" alt="${esc(p.name)} finish"></div>`;
  }
  return `<div class="hero-tin" style="width:${w}"><img src="${src}" alt="${esc(p.name)} — ${esc(p.sizes?.[1] || '4L')} pack"></div>`;
}

/* ============================================================
   1. A4 PRODUCT FLIER — single-sided poster, one product
   ============================================================ */
const A4_CSS = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; --pad:14mm; }
.pad   { inset: 14mm 14mm 22mm; display:flex; flex-direction:column;
         justify-content:space-between; }

.hero      { display:flex; gap:9mm; margin-top:6mm; align-items:center; }
.hero-copy { flex:1; min-width:0; padding-top:1mm; }
.hero-tin  { height:79mm; flex:none; display:flex; align-items:center; justify-content:center; }
.hero-tin img { max-width:100%; max-height:100%; width:auto; height:auto; }
.hero-tex  { border-radius:2mm; overflow:hidden; border:.3mm solid var(--rule); }
.hero-tex img { width:100%; height:78mm; object-fit:cover; }

.h1 { font:400 36pt/0.97 var(--serif); letter-spacing:-.018em; margin:2.5mm 0 3mm; }
.h1 .sub { display:block; font-size:22pt; color:var(--ink-2); }

.cols { display:flex; gap:8mm; margin-top:7mm; }
.col-1 { width:60mm; } .col-2 { width:56mm; } .col-3 { flex:1; }

.surf { margin-top:4mm; padding-top:3mm; border-top:.25mm solid var(--rule-2); }
.surf .k { font:600 6.6pt/1.3 var(--sans); letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:1.4mm; }
.surf .v { font:400 7.6pt/1.42 var(--sans); color:var(--ink-2); }

/* How to apply — three steps across, the questions a painter asks in order */
.apply { padding-top:2mm; }
.steps { display:flex; gap:7mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:5mm; height:5mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6.6pt/5.2mm var(--sans); margin-bottom:1.8mm; }
.step h4 { font:600 7.6pt/1.2 var(--sans); color:var(--ink); margin-bottom:1.2mm; }
.step p  { font:400 6.9pt/1.4 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:3mm; padding-top:2.4mm; border-top:.25mm solid var(--rule-2);
                  font:400 6.7pt/1.38 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:6mm; margin-top:6mm;
       padding:4.4mm 5mm; background:var(--cream); border-radius:1.6mm; }
.buy .k { font:700 6.6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:2.2mm; }
`;

function flierA4(p) {
  const d = 3;
  const art = heroArt(p, d, isTexture(p) ? '58mm' : '62mm');
  const [n1, ...n2] = p.name.split(' with ');
  const ap = p.application || {};
  return head(`${p.name} — Cloud Paints`, d, A4_CSS) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="band"></div>
  <div class="pad">
    ${mast(d, { grade: p.grade, logoW: '18mm' })}

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${esc(p.cat_label)}</span>
        <h1 class="h1">${esc(n1)}${n2.length ? `<span class="sub">with ${esc(n2.join(' with '))}</span>` : ''}</h1>
        <p class="tagline">${esc(clean(p.tagline))}</p>
        <p class="body mt-2">${esc(trim(p.short, 420))}</p>
      </div>
      ${art}
    </section>

    <section class="cols">
      <div class="col-1">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, 5).map(f => `<li>${esc(trim(f, 70))}</li>`).join('')}
        </ul>
      </div>

      <div class="col-2">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, 6)}</table>
      </div>

      <div class="col-3">
        <div class="slab">Where to use it</div>
        <ul class="dots">
          ${(p.uses || []).slice(0, 4).map(u => `<li>${esc(trim(u.split('—')[0], 54))}</li>`).join('')}
        </ul>
        ${(p.surfaces || []).length ? `
        <div class="surf">
          <div class="k">Suitable surfaces</div>
          <div class="v">${esc(trim((p.surfaces || []).join(' · '), 96))}</div>
        </div>` : ''}
      </div>
    </section>

    <section class="apply">
      <div class="slab">How to apply</div>
      <div class="steps">
        <div class="step">
          <span class="n">1</span>
          <h4>Prepare the surface</h4>
          <p>${esc(sentences(ap.prep, 200))}</p>
        </div>
        <div class="step">
          <span class="n">2</span>
          <h4>Prime or undercoat</h4>
          <p>${esc(sentences(ap.new_surface, 200))}</p>
        </div>
        <div class="step">
          <span class="n">3</span>
          <h4>Apply the finish</h4>
          <p>${esc(sentences(ap.method, 200))}</p>
        </div>
      </div>
      <div class="cleanup"><strong>Previously painted:</strong> ${esc(sentences(ap.previously_painted, 140))}
        &nbsp;·&nbsp; <strong>Clean-up:</strong> ${esc(sentences(ap.cleanup, 90))}</div>
    </section>

    <section class="buy">
      <div>
        <div class="k">Available in</div>
        <div class="packs">${packChips(p)}</div>
      </div>
      <div class="grow">
        <div class="k">Safety &amp; storage</div>
        <div class="fine">${esc(safetyLine(p))}. ${esc(sentences(p.safety?.storage || '', 130))} Keep out of reach of children.</div>
      </div>
    </section>
  </div>
  ${foot()}
</div>` + tail;
}

/* ============================================================
   2. A5 PRODUCT FLIER — the hand-out version
   ============================================================ */
const A5_CSS = `
@page { size: 148mm 210mm; margin: 0; }
.sheet { --sheet-w:148mm; --sheet-h:210mm; --pad:11mm; }
.pad   { inset: 11mm 11mm 19mm; display:flex; flex-direction:column;
         justify-content:space-between; }

.hero      { display:flex; gap:6mm; margin-top:5mm; }
.hero-copy { flex:1; min-width:0; }
.hero-tin  { height:54mm; flex:none; display:flex; align-items:center; justify-content:center; }
.hero-tin img { max-width:100%; max-height:100%; width:auto; height:auto; }
.hero-tex  { border-radius:1.6mm; overflow:hidden; border:.3mm solid var(--rule); }
.hero-tex img { width:100%; height:62mm; object-fit:cover; }

.h1 { font:400 24pt/0.99 var(--serif); letter-spacing:-.015em; margin:2mm 0 2mm; }
.tagline { font-size:9.5pt; }

.cols { display:flex; gap:6mm; margin-top:6mm; flex:1; }
.cols .a { width:56mm; } .cols .b { flex:1; }
.ticks li { font-size:7.6pt; margin-bottom:1.5mm; }
.specs th { font-size:6.4pt; } .specs td { font-size:7.4pt; }
.specs th, .specs td { padding:1.3mm 0; }

.buy { margin-top:5mm; padding:3.4mm 4mm; background:var(--cream); border-radius:1.4mm; }
.buy .k { font:700 6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:1.8mm; }
.pack { font-size:7.2pt; padding:1.7mm 2.4mm 1.5mm; }
`;

function flierA5(p) {
  const d = 3;
  return head(`${p.name} — Cloud Paints (A5)`, d, A5_CSS) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="band" style="--band-h:4.5mm"></div>
  <div class="pad">
    ${mast(d, { tag: p.cat_label, logoW: '21mm' })}

    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">${esc(p.grade)}</span>
        <h1 class="h1">${esc(p.name)}</h1>
        <p class="tagline">${esc(trim(p.tagline, 58))}</p>
        <p class="body-sm mt-1">${esc(trim(p.short, 210))}</p>
      </div>
      ${heroArt(p, d, isTexture(p) ? '40mm' : '46mm')}
    </section>

    <section class="cols">
      <div class="a">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, 6).map(f => `<li>${esc(trim(f, 58))}</li>`).join('')}
        </ul>
      </div>
      <div class="b">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, 6)}</table>
      </div>
    </section>

    <section class="buy">
      <div class="k">Available in</div>
      <div class="packs">${packChips(p)}</div>
      <div class="fine mt-1">${esc(safetyLine(p))} · Keep out of reach of children.</div>
    </section>
  </div>
  ${footCompact()}
</div>` + tail;
}

/* ============================================================
   2b. COLOUR PRODUCT FLIER — A4 and A5
   ------------------------------------------------------------
   The same complete information as the white fliers, on a field
   of the product's own colour.

   The tin does the work here. Every cut-out is a transparent PNG,
   so it sits directly on the colour with no box around it and
   breaks the edge of the field at the bottom — which is what stops
   the page reading as two stacked rectangles.

   The logo and the standards mark are red-and-blue on transparent
   and disappear on a deep ground, so both sit in white chips. That
   is a deliberate device, not a patch: it reads as a label on the
   colour, and it is how the price list masthead already works.
   ============================================================ */
const COLOUR_CSS = `
.sheet { position:relative; }

/* the colour field, and the tin that breaks out of it */
.field { position:absolute; left:0; right:0; top:0; background:var(--accent); }
.field-pad { position:absolute; inset:0; padding:var(--fpad); }

.chip { background:#fff; border-radius:1.8mm; padding:2.6mm 3mm; display:inline-flex;
        align-items:center; gap:3mm; }
.chip img { display:block; }
.chip-rule { width:.3mm; align-self:stretch; background:var(--rule); margin:1mm 0; }
.chip .kebs { height:var(--kebsh); width:auto; }

.c-mast { display:flex; align-items:flex-start; justify-content:space-between; gap:6mm; }
.c-grade { font:600 6.4pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
           color:#fff; border:.3mm solid rgba(255,255,255,.5); border-radius:1mm;
           padding:2.2mm 3.2mm 2mm; }

.c-eyebrow { font:600 7pt/1.2 var(--sans); letter-spacing:.17em; text-transform:uppercase;
             color:var(--gold); }
.c-name { font:400 var(--namesize)/0.97 var(--serif); letter-spacing:-.018em; color:#fff; }
.c-name .sub { display:block; font-size:var(--subsize); color:rgba(255,255,255,.72); }
.c-tag  { font:400 italic var(--tagsize)/1.3 var(--serif); color:var(--gold); }
.c-desc { font:400 var(--descsize)/1.5 var(--sans); color:rgba(255,255,255,.9); }

.c-tin { position:absolute; z-index:2; }
.c-tin img { width:100%; height:auto; }

/* the white half */
.c-body { position:absolute; left:0; right:0; padding:0 var(--fpad); }

.slab { color:var(--accent); border-bottom-color:var(--accent); }
.ticks li::before { border-color:var(--accent); }
.dots li::before  { background:var(--accent); }
`;

/** Shared content for the lower half — identical information to the white
 *  flier, so "colour version" never means "less of the product data". */
function colourBody(p, d, opts) {
  const ap = p.application || {};
  return `
    <section class="cols">
      <div class="col-1">
        <div class="slab">Key features</div>
        <ul class="ticks">
          ${(p.features || []).slice(0, opts.feat).map(f => `<li>${esc(trim(f, opts.featLen))}</li>`).join('')}
        </ul>
      </div>
      <div class="col-2">
        <div class="slab">Technical data</div>
        <table class="specs">${specRows(p, opts.specs)}</table>
      </div>
      <div class="col-3">
        <div class="slab">Where to use it</div>
        <ul class="dots">
          ${(p.uses || []).slice(0, opts.uses).map(u => `<li>${esc(trim(u.split('—')[0], 54))}</li>`).join('')}
        </ul>
        ${(p.surfaces || []).length ? `
        <div class="surf">
          <div class="k">Suitable surfaces</div>
          <div class="v">${esc(trim((p.surfaces || []).join(' · '), 96))}</div>
        </div>` : ''}
      </div>
    </section>

    <section class="apply">
      <div class="slab">How to apply</div>
      <div class="steps">
        <div class="step"><span class="n">1</span><h4>Prepare the surface</h4>
          <p>${esc(sentences(ap.prep, opts.step))}</p></div>
        <div class="step"><span class="n">2</span><h4>Prime or undercoat</h4>
          <p>${esc(sentences(ap.new_surface, opts.step))}</p></div>
        <div class="step"><span class="n">3</span><h4>Apply the finish</h4>
          <p>${esc(sentences(ap.method, opts.step))}</p></div>
      </div>
      ${opts.cleanup === false ? '' : `<div class="cleanup"><strong>Previously painted:</strong> ${esc(sentences(ap.previously_painted, 140))}
        &nbsp;·&nbsp; <strong>Clean-up:</strong> ${esc(sentences(ap.cleanup, 90))}</div>`}
    </section>

    <section class="buy">
      <div>
        <div class="k">Available in</div>
        <div class="packs">${packChips(p)}</div>
      </div>
      <div class="grow">
        <div class="k">Safety &amp; storage</div>
        <div class="fine">${esc(safetyLine(p))}. ${esc(sentences(p.safety?.storage || '', 130))} Keep out of reach of children.${
          opts.cleanup === false ? ' <strong>Clean-up:</strong> ' + esc(sentences(ap.cleanup, 90)) : ''}</div>
      </div>
    </section>`;
}

function flierColourA4(p) {
  const d = 3;
  const a = assets(d);
  const [n1, ...n2] = p.name.split(' with ');
  const css = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; --pad:14mm; --fpad:14mm; --kebsh:14mm;
         --namesize:36pt; --subsize:22pt; --tagsize:12pt; --descsize:9.4pt; }
.field  { height:104mm; }
.c-mast .chip > img:first-child { width:18mm; }
.c-copy { position:absolute; left:14mm; top:45mm; width:116mm; height:55mm; overflow:hidden; }
.c-tin  { right:14mm; top:40mm; width:64mm; }   /* 82mm tall — clears the field by 18mm */
.c-body { top:128mm; bottom:19mm; }

.cols { display:flex; gap:8mm; }
.col-1 { width:60mm; } .col-2 { width:56mm; } .col-3 { flex:1; }
.surf { margin-top:4mm; padding-top:3mm; border-top:.25mm solid var(--rule-2); }
.surf .k { font:600 6.6pt/1.3 var(--sans); letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); margin-bottom:1.4mm; }
.surf .v { font:400 7.6pt/1.42 var(--sans); color:var(--ink-2); }

.apply { padding-top:7mm; }
.steps { display:flex; gap:7mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:5mm; height:5mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6.6pt/5.2mm var(--sans); margin-bottom:1.8mm; }
.step h4 { font:600 7.6pt/1.2 var(--sans); color:var(--ink); margin-bottom:1.2mm; }
.step p  { font:400 6.9pt/1.4 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:3mm; padding-top:2.4mm; border-top:.25mm solid var(--rule-2);
                  font:400 6.7pt/1.38 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:6mm; margin-top:7mm;
       padding:4.4mm 5mm; background:var(--cream); border-radius:1.6mm; }
.buy .k { font:700 6.6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:2.2mm; }
` + COLOUR_CSS;

  return head(`${p.name} — Cloud Paints (colour A4)`, d, css) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="field"></div>

  <div class="field-pad">
    <header class="c-mast">
      <span class="chip">
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
        <span class="chip-rule"></span>
        <img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
      </span>
      <span class="c-grade">${esc(p.grade)}</span>
    </header>
  </div>

  <div class="c-copy">
    <span class="c-eyebrow">${esc(p.cat_label)}</span>
    <h1 class="c-name mt-1">${esc(n1)}${n2.length ? `<span class="sub">with ${esc(n2.join(' with '))}</span>` : ''}</h1>
    <p class="c-tag mt-1">${esc(clean(p.tagline))}</p>
    <p class="c-desc mt-2">${esc(trim(p.short, 300))}</p>
  </div>

  <div class="c-tin"><img src="${heroImage(p, d)}" alt="${esc(p.name)} — ${esc(p.sizes?.[1] || '4L')} pack"></div>

  <div class="c-body">
    ${colourBody(p, d, { feat: 5, featLen: 70, specs: 6, uses: 4, step: 205 })}
  </div>

  ${foot()}
</div>` + tail;
}

function flierColourA5(p) {
  const d = 3;
  const a = assets(d);
  const css = `
@page { size: 148mm 210mm; margin: 0; }
.sheet { --sheet-w:148mm; --sheet-h:210mm; --pad:11mm; --fpad:11mm; --kebsh:10.5mm;
         --namesize:21pt; --subsize:14pt; --tagsize:9pt; --descsize:7.4pt; }
.field  { height:78mm; }
.c-mast .chip > img:first-child { width:14mm; }
.c-copy { position:absolute; left:11mm; top:33mm; width:80mm; height:42mm; overflow:hidden; }
.c-tin  { right:10mm; top:29mm; width:46mm; }   /* 60mm tall — clears the field by 11mm */
.c-body { top:94mm; bottom:17mm; }

.cols { display:flex; gap:6mm; }
.col-1 { width:56mm; } .col-2 { flex:1; } .col-3 { display:none; }
.ticks li { font-size:7.4pt; margin-bottom:1.4mm; }
.specs th { font-size:6.4pt; } .specs td { font-size:7.4pt; }
.specs th, .specs td { padding:1.3mm 0; }

.apply { padding-top:2mm; }
.steps { display:flex; gap:5mm; }
.step  { flex:1; }
.step .n { display:inline-block; width:4.4mm; height:4.4mm; border-radius:50%;
           background:var(--accent); color:#fff; text-align:center;
           font:600 6pt/4.6mm var(--sans); margin-bottom:1.4mm; }
.step h4 { font:600 6.8pt/1.2 var(--sans); color:var(--ink); margin-bottom:1mm; }
.step p  { font:400 6.2pt/1.38 var(--sans); color:var(--ink-2); }
.apply .cleanup { margin-top:2.4mm; padding-top:2mm; border-top:.25mm solid var(--rule-2);
                  font:400 6pt/1.35 var(--sans); color:var(--ink-3); }

.buy { display:flex; align-items:center; gap:5mm; margin-top:3mm;
       padding:3.2mm 4mm; background:var(--cream); border-radius:1.4mm; }
.buy .k { font:700 6pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
          color:var(--ink-3); margin-bottom:1.8mm; }
.pack { font-size:7.2pt; padding:1.7mm 2.4mm 1.5mm; }
` + COLOUR_CSS;

  return head(`${p.name} — Cloud Paints (colour A5)`, d, css) + `
<div class="sheet" style="${accentVars(p.primary)}">
  <div class="field"></div>

  <div class="field-pad">
    <header class="c-mast">
      <span class="chip" style="padding:2mm 2.4mm">
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
        <span class="chip-rule"></span>
        <img class="kebs kebs--sm" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
      </span>
      <span class="c-grade">${esc(p.grade)}</span>
    </header>
  </div>

  <div class="c-copy">
    <span class="c-eyebrow">${esc(p.cat_label)}</span>
    <h1 class="c-name mt-1">${esc(p.name)}</h1>
    <p class="c-tag mt-1">${esc(trim(clean(p.tagline), 58))}</p>
    <p class="c-desc mt-1">${esc(sentences(p.short, 170))}</p>
  </div>

  <div class="c-tin"><img src="${heroImage(p, d)}" alt="${esc(p.name)}"></div>

  <div class="c-body">
    ${colourBody(p, d, { feat: 4, featLen: 68, specs: 5, uses: 0, step: 130, cleanup: false })}
  </div>

  ${footCompact()}
</div>` + tail;
}

/* ============================================================
   3. RANGE POSTER — the whole line-up on one sheet
   Drawn at A3 and scaled to A2 and A4. All three are √2 sheets,
   so one artwork serves every size with no reflow.
   ============================================================ */
const POSTER_CSS = `
.sheet { --sheet-w:297mm; --sheet-h:420mm; --pad:15mm; }
.pad   { inset:15mm 15mm 26mm; display:flex; flex-direction:column; }

.p-head { display:flex; justify-content:space-between; align-items:flex-end;
          padding-bottom:6mm; border-bottom:.8mm solid var(--blue); }
.p-title { font:400 34pt/1 var(--serif); letter-spacing:-.02em; color:var(--blue-deep); }
.p-title em { font-style:italic; color:var(--red); }
.p-sub { font:400 9.5pt/1.4 var(--sans); color:var(--ink-2); max-width:132mm; margin-top:2.5mm; }

.sec-h { display:flex; align-items:baseline; gap:4mm; margin:5mm 0 4mm; }
.sec-h h2 { font:400 17pt/1 var(--serif); color:var(--ink); }
.sec-h .n { font:600 7pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase; color:var(--ink-3); }
.sec-h .ln { flex:1; height:.25mm; background:var(--rule); }

.grid  { display:grid; grid-template-columns:repeat(4,1fr); gap:5mm; }
.tgrid { display:grid; grid-template-columns:repeat(5,1fr); gap:4mm; }

.tcard { border:.3mm solid var(--rule-2); border-radius:1.6mm; overflow:hidden; background:var(--paper); }
.tcard img { width:100%; height:32mm; object-fit:cover; }
.tcard .t { padding:2.6mm 3mm 3mm; }
.tcard .nm { font:400 8.6pt/1.15 var(--serif); color:var(--ink); }
.tcard .cat{ font:600 5.6pt/1.3 var(--sans); letter-spacing:.1em; text-transform:uppercase;
             color:var(--ink-3); margin-top:1.2mm; }

.pcard-note { height:7.6mm; overflow:hidden; }
.p-note { margin-top:auto; padding-top:4mm; display:flex; gap:8mm; align-items:flex-end; }
.p-note .kb { display:flex; align-items:center; gap:3mm; }
.p-note .kb .fine { max-width:64mm; }
`;

function rangePoster(size) {
  const d = 1;
  const a = assets(d);
  // A3 is the drawing size; the others are exact √2 steps from it.
  const page = { A2: '420mm 594mm', A3: '297mm 420mm', A4: '210mm 297mm' }[size];
  const zoom = { A2: 1.41421, A3: 1, A4: 0.70711 }[size];

  const card = p => `
    <div class="pcard pcard-top" style="${accentVars(p.primary)}--pcard-img-h:26mm;">
      <div class="pcard-img"><img src="${thumbImage(p, d)}" alt="${esc(p.name)}"></div>
      <div class="pcard-cat">${esc(p.cat_label)}</div>
      <div class="pcard-name">${esc(p.name)}</div>
      <div class="pcard-note">${esc(trim(clean(p.tagline), 90))}</div>
      <div class="pcard-sizes">${esc((p.sizes || []).join(' · '))}</div>
    </div>`;

  const tcard = p => `
    <div class="tcard">
      <img src="${thumbImage(p, d)}" alt="${esc(p.name)}">
      <div class="t">
        <div class="nm">${esc(p.name.replace(/^Cloud /, ''))}</div>
        <div class="cat">${esc((p.sizes || []).join(' · '))}</div>
      </div>
    </div>`;

  return head(`Cloud Paints — the range (${size})`, d,
    `@page { size:${page}; margin:0; }\nbody { zoom:${zoom}; }\n` + POSTER_CSS) + `
<div class="sheet">
  <div class="pad">
    <header class="p-head">
      <div>
        <span class="eyebrow" style="color:var(--red)">Cloudsent Decor Ltd · Nairobi</span>
        <h1 class="p-title mt-1">The <em>Cloud Paints</em> range</h1>
        <p class="p-sub">Paints, coatings and decorative finishes manufactured in Nairobi
          for Kenyan walls, weather and light. Every tin below is made at our Industrial
          Area plant and available in the pack sizes shown.</p>
      </div>
      <img src="${a}/img/brand/logo.png" style="width:30mm" alt="Cloud Paints">
    </header>

    <div class="sec-h"><h2>The paint range</h2><span class="n">${paints.length} lines</span><span class="ln"></span></div>
    <div class="grid">${paints.map(card).join('')}</div>

    <div class="sec-h"><h2>Decorative &amp; textured finishes</h2><span class="n">${textures.length} finishes</span><span class="ln"></span></div>
    <div class="tgrid">${textures.map(tcard).join('')}</div>

    <div class="p-note">
      <div class="kb">
        <img class="kebs" style="width:11mm" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <div class="fine">Manufactured to the Kenya Bureau of Standards
          Standardisation Mark. Colour matching and tinting available in store.</div>
      </div>
      <div class="grow"></div>
    </div>
  </div>
  ${foot()}
</div>` + tail;
}

/* ============================================================
   4. TRI-FOLD BROCHURE — A4 landscape, two sides
   ------------------------------------------------------------
   Roll fold: the right-hand panel folds in first, then the left
   folds over it. That makes the tucked panel narrower — 96mm
   against 100.5mm — so it does not bind at the spine.

     Side 1 (outside) : [ tuck-in flap ] [ back cover ] [ FRONT COVER ]
     Side 2 (inside)  : [ panel 1 ] [ panel 2 ] [ panel 3 = back of flap ]

   Panel widths mirror between the two sides because the sheet is
   turned over on its vertical axis.
   ============================================================ */
const TRI_CSS = `
@page { size: 297mm 210mm; margin: 0; }
.sheet { --sheet-w:297mm; --sheet-h:210mm; }
.fold { display:flex; width:297mm; height:210mm; }
.pnl  { position:relative; padding:11mm 9mm; display:flex; flex-direction:column; overflow:hidden; }
.pnl--narrow { width:96mm; }
.pnl--wide   { width:100.5mm; }
@media screen { .pnl + .pnl { border-left:.15mm dashed #e6e2d8; } }  /* proofing aid, screen only */

.cover { padding:0; }
.cover-art { height:96mm; overflow:hidden; position:relative; }
.cover-art img { width:100%; height:100%; object-fit:cover; }
.cover-body { flex:1; padding:9mm 9mm 0; display:flex; flex-direction:column; }
.cover h1 { font:400 26pt/1.02 var(--serif); letter-spacing:-.015em; margin:3mm 0 3mm; }
.cover h1 em { font-style:italic; color:var(--accent); }

.bar { height:5mm; background:var(--accent); }

.pnl h2 { font:400 15pt/1.08 var(--serif); letter-spacing:-.01em; margin-bottom:3mm; }
.pnl h3 { font:400 11pt/1.1 var(--serif); }

.item { padding:4mm 0; border-bottom:.25mm solid var(--rule-2); display:flex; gap:4mm; }
.item:last-child { border-bottom:0; }
.item-img { width:17mm; flex:none; display:flex; align-items:flex-start; justify-content:center; }
.item-img img { width:100%; }
.item-img.tex img { border-radius:1mm; height:24mm; object-fit:cover; }
.item-b { flex:1; min-width:0; }
.item-cat { font:600 5.8pt/1.2 var(--sans); letter-spacing:.11em; text-transform:uppercase; color:var(--accent); }
.item-nm  { font:400 10.5pt/1.12 var(--serif); margin:.8mm 0 1.4mm; }
.item-tx  { font:400 7.2pt/1.4 var(--sans); color:var(--ink-2); }
.item-sz  { font:500 6.4pt/1 var(--sans); color:var(--ink-3); letter-spacing:.05em; margin-top:1.6mm; }
.item-feat { margin:2mm 0 0; }
.item-feat li { font-size:6.8pt; margin-bottom:1mm; }
.item-spec { font:500 6.3pt/1.35 var(--sans); color:var(--ink-3); margin-top:2mm;
             padding-top:1.6mm; border-top:.25mm solid var(--rule-2); }

.also { margin-top:5mm; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.also .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
           color:var(--ink-3); margin-bottom:2.4mm; }
.also-r { font:400 7.2pt/1.35 var(--sans); color:var(--ink-2); margin-bottom:1.6mm; }
.also-r b { font-weight:600; color:var(--ink); }
.also-r span { display:block; font-size:6.3pt; color:var(--ink-3); }

.cover-calc { margin-top:5mm; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.cover-calc .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
                 color:var(--ink-3); margin-bottom:2.6mm; }
.calc { width:100%; border-collapse:collapse; }
.calc th { font:600 5.9pt/1.2 var(--sans); letter-spacing:.1em; text-transform:uppercase;
           color:var(--ink-3); text-align:left; padding:0 0 1.6mm; }
.calc th:last-child, .calc td:last-child { text-align:right; }
.calc td { font:400 7.2pt/1.3 var(--sans); color:var(--ink-2);
           padding:1.6mm 0; border-top:.25mm solid var(--rule-2);
           font-variant-numeric:tabular-nums; }
.calc td b { font-weight:600; color:var(--accent); }

.cbox { background:var(--cream); border-radius:1.6mm; padding:4.5mm; margin-top:4mm; }
.pnl .grow { flex:1; }
.cbox .k { font:700 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase; color:var(--ink-3); margin-bottom:2mm; }
.cbox .v { font:400 7.6pt/1.5 var(--sans); color:var(--ink); }
.cbox .v b { font-weight:600; }

.stat { display:flex; gap:5mm; margin:4mm 0; }
.stat div { flex:1; }
.stat .n { font:400 17pt/1 var(--serif); color:var(--accent); }
.stat .l { font:500 6.2pt/1.25 var(--sans); letter-spacing:.08em; text-transform:uppercase; color:var(--ink-3); margin-top:1.2mm; }
`;

/** One product row inside a brochure panel.
 *
 *  Two densities. A brochure covering eleven products needs every row to be
 *  compact; one covering five has three panels to fill and a compact row
 *  leaves the bottom half of each panel empty. The extra room goes to the
 *  things a buyer actually asks — what it does well, and how far a litre
 *  goes — rather than to bigger type. */
function briefItem(p, d, roomy) {
  const src = thumbImage(p, d);
  const spec = p.specs || {};
  const quick = ['Coverage', 'Touch dry', 'Finish']
    .filter(k => spec[k]).map(k => `${k}: ${trim(spec[k], 40)}`).join('  ·  ');
  return `
  <div class="item">
    <div class="item-img${isTexture(p) ? ' tex' : ''}">${src ? `<img src="${src}" alt="${esc(p.name)}">` : ''}</div>
    <div class="item-b" style="${accentVars(p.primary)}">
      <div class="item-cat">${esc(p.cat_label)}</div>
      <div class="item-nm">${esc(p.name)}</div>
      <div class="item-tx">${esc(roomy ? sentences(p.short, 240) : firstSentence(p.short, 118))}</div>
      ${roomy && (p.features || []).length ? `
      <ul class="ticks ticks--tight item-feat">
        ${p.features.slice(0, 3).map(f => `<li>${esc(trim(f, 54))}</li>`).join('')}
      </ul>` : ''}
      ${roomy && quick ? `<div class="item-spec">${esc(quick)}</div>` : ''}
      <div class="item-sz">${esc((p.sizes || []).join(' · '))}</div>
    </div>
  </div>`;
}

/** Products with no print-quality photograph still belong in the brochure —
 *  they just do not get a picture slot that would sit empty. */
function alsoList(list) {
  if (!list.length) return '';
  return `
  <div class="also">
    <div class="k">Also in the range</div>
    ${list.map(p => `<div class="also-r"><b>${esc(p.name)}</b>
      <span>${esc(p.cat_label)} · ${esc((p.sizes || []).join(' · '))}</span></div>`).join('')}
  </div>`;
}

/** How much paint to buy.
 *  The question every counter gets asked, answered from the range's own
 *  10–12 m² per litre. Deliberately rounded up: sending someone home half a
 *  litre short costs them a second trip and a batch that may not match. */
function coverageBlock() {
  const rows = [
    ['Small bedroom', '~20 m²', '4 L'],
    ['Large bedroom', '~40 m²', '8 L'],
    ['Living room', '~60 m²', '11 L'],
    ['Small house, inside', '~100 m²', '18 L'],
  ];
  return `
  <div class="cover-calc">
    <div class="k">How much will you need?</div>
    <table class="calc">
      <tr><th></th><th>Wall area</th><th>Two coats</th></tr>
      ${rows.map(([a, b, c]) =>
        `<tr><td>${esc(a)}</td><td>${esc(b)}</td><td><b>${esc(c)}</b></td></tr>`).join('')}
    </table>
    <div class="fine mt-1">Based on 10–12 m² per litre on a smooth, primed surface.
      Textured, porous or previously unpainted walls take more — bring your
      measurements and we will work it out with you.</div>
  </div>`;
}

/** Spread the products across three panels by how much room each actually
 *  has. Panel 1 loses height to the section introduction and panel 3 to the
 *  coverage table, so an equal split leaves the last panel half empty. */
function allot(n, caps) {
  const total = caps.reduce((a, b) => a + b, 0);
  const exact = caps.map(c => n * c / total);
  const base = exact.map(Math.floor);
  let left = n - base.reduce((a, b) => a + b, 0);
  // largest remainder takes what rounding left over
  exact.map((e, i) => [e - base[i], i]).sort((x, y) => y[0] - x[0])
    .forEach(([, i]) => { if (left > 0) { base[i]++; left--; } });
  return base;
}

function brochure(cfg) {
  const d = 2;
  const a = assets(d);
  const all = cfg.slugs.map(s => bySlug[s]).filter(Boolean);
  // Only products we can show go in the picture rows; the rest are listed.
  const items = all.filter(p => heroImage(p, d));
  const noArt = all.filter(p => !heroImage(p, d));
  const roomy = items.length <= 8;

  const calcPanel = noArt.length > 3 ? 1 : 2;
  const sizes = allot(items.length, [150, 188, Math.max(40, 100 - noArt.length * 8)]);
  const chunks = [];
  let at = 0;
  for (const s of sizes) { chunks.push(items.slice(at, at + s)); at += s; }

  const backCover = `
    <div class="pnl pnl--wide">
      <img src="${a}/img/brand/logo.png" style="width:30mm" alt="Cloud Paints" class="mb-3">
      <h2>Come and see the <em style="font-style:italic;color:var(--accent)">colour.</em></h2>
      <p class="body-sm mb-3">Bring a photograph, a fabric or a paint chip to the Industrial
        Area counter and we will match it, mix it and tell you honestly how much you need.</p>

      <div class="cbox" style="margin-top:0">
        <div class="k">Talk to us</div>
        <div class="v">
          <b>${esc(CO.phones[0])}</b> · WhatsApp<br>
          ${esc(CO.phones[1])}<br>${esc(CO.phones[2])}<br>
          ${esc(CO.email)}
        </div>
      </div>

      <div class="cbox">
        <div class="k">Find us</div>
        <div class="v">
          <b>${esc(CO.street)}</b><br>
          ${esc(CO.area)}<br>${esc(CO.box)}<br>
          <span class="fine">${esc(CO.hours)}</span>
        </div>
      </div>

      <div class="grow"></div>
      <div class="row mt-3" style="align-items:center;gap:4mm">
        <img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        <div class="fine">Manufactured in Nairobi by ${esc(CO.legal)} to the
          Kenya Bureau of Standards Standardisation Mark.</div>
      </div>
      <div class="fine mt-2" style="color:var(--accent);font-weight:600">${esc(CO.web)}</div>
    </div>`;

  const frontCover = `
    <div class="pnl pnl--wide cover">
      <div class="cover-art"><img src="${a}/img/${cfg.cover}" alt=""></div>
      <div class="bar"></div>
      <div class="cover-body">
        <img src="${a}/img/brand/logo.png" style="width:34mm" alt="Cloud Paints">
        <h1 class="mt-2">${cfg.title}</h1>
        <p class="body-sm">${esc(cfg.kicker)}</p>
        <div class="grow"></div>
        <div class="fine mb-3">${esc(CO.legal)} · ${esc(CO.web)}</div>
      </div>
    </div>`;

  const flapOut = `
    <div class="pnl pnl--narrow">
      <span class="eyebrow">Why Cloud Paints</span>
      <h2 class="mt-1">Made here, for <em style="font-style:italic;color:var(--accent)">here.</em></h2>
      <p class="body-sm mb-2">${esc(cfg.flap)}</p>

      <div class="stat">
        <div><div class="n">2018</div><div class="l">Manufacturing<br>since</div></div>
        <div><div class="n">${P.length}</div><div class="l">Products<br>in the range</div></div>
      </div>

      <ul class="ticks ticks--tight mt-1">
        <li>Mixed and tinted to your colour at the counter</li>
        <li>Trade and contractor rates for stockists and painters</li>
        <li>Technical datasheets for every line</li>
        <li>Delivery across Nairobi and upcountry</li>
      </ul>

      <div class="grow"></div>
      <div class="cbox">
        <div class="k">Order or enquire</div>
        <div class="v"><b>${esc(CO.whatsapp)}</b><br>${esc(CO.email)}</div>
      </div>
    </div>`;

  const insidePanel = (list, i) => `
    <div class="pnl ${i === 2 ? 'pnl--narrow' : 'pnl--wide'}">
      ${i === 0 ? `<span class="eyebrow">${esc(cfg.eyebrow)}</span>
        <h2 class="mt-1 mb-2">${cfg.insideTitle}</h2>
        <p class="body-sm mb-2">${esc(cfg.intro)}</p>` : ''}
      ${list.map(p => briefItem(p, d, roomy)).join('')}
      ${i === 2 ? alsoList(noArt) : ''}
      ${i === calcPanel ? coverageBlock() : ''}
      ${i === 2 ? `<div class="cbox">
        <div class="k">Not sure which?</div>
        <div class="v">Tell us the surface and where it is — inside, outside,
          wood, metal or roof — and we will tell you exactly what to buy and how much.
          <br><b>${esc(CO.whatsapp)}</b></div>
      </div>` : ''}
    </div>`;

  // Both sides in one document: page 1 prints on the front of the sheet,
  // page 2 on the back. Duplex, flip on the SHORT edge.
  return head(`Cloud Paints — ${cfg.name} brochure`, d,
    `${TRI_CSS}\n.sheet{${accentVars(cfg.accent)}}`) + `
<!-- PAGE 1 · OUTSIDE — left to right: tuck-in flap | back cover | front cover -->
<div class="sheet"><div class="fold">${flapOut}${backCover}${frontCover}</div></div>

<!-- PAGE 2 · INSIDE — left to right: panel 1 | panel 2 | panel 3 (backs the flap) -->
<div class="sheet"><div class="fold">
  ${insidePanel(chunks[0], 0)}${insidePanel(chunks[1], 1)}${insidePanel(chunks[2], 2)}
</div></div>` + tail;
}

/* ============================================================
   4b. RANGE FLIER — folded once, four panels
   ------------------------------------------------------------
   A half fold, not a tri-fold: four panels, which is what
   "cover, two inner sheets, back" describes.

     Page 1 (outside) :  [ BACK COVER ] [ FRONT COVER ]
     Page 2 (inside)  :  [ INNER LEFT ] [ INNER RIGHT ]

   Fold left half over right with the inside face up. The panel
   behind the front cover is the inner left, so nothing on the
   spread is interrupted by the fold. A half fold needs no
   tuck-in allowance, so all four panels are full width.

   Two sizes, both from this one template: an A3 sheet that folds
   to A4, and an A4 sheet that folds to A5. Type and spacing are
   tokenised per size rather than scaled, so the small one stays
   readable instead of becoming a 70% photocopy.
   ============================================================ */
const RANGE_SIZES = {
  A4: { sheet: '420mm 297mm', w: '420mm', h: '297mm', panel: '210mm', k: 1,
        frame: '8mm', pad: '17mm',
        logo: '30mm', kebs: '19mm', h1: '42pt', kick: '10.5pt', strap: '12.5pt',
        sw: '7mm', lineH: '78mm', tinH: '46mm', tinGap: '3mm', rowIn: '4mm', rowUp: '26mm',
        footFs: '7.4pt',
        ipH2: '19pt', gridGap: '7mm 6mm', cellImg: '46mm',
        nm: '11pt', tx: '7.2pt', sz: '6.6pt', txLen: 260,
        bcH3: '17pt', bcV: '7.6pt', restB: '8pt', restS: '6.6pt', aboutFs: '8.2pt',
        secGap: '8mm', calc: true, aboutParas: 2, ticks: 5, noteLen: 300 },
  A5: { sheet: '297mm 210mm', w: '297mm', h: '210mm', panel: '148.5mm', k: 0.707,
        frame: '5.5mm', pad: '12mm',
        logo: '21mm', kebs: '13mm', h1: '27pt', kick: '7.6pt', strap: '9pt',
        sw: '5mm', lineH: '55mm', tinH: '30mm', tinGap: '2mm', rowIn: '3mm', rowUp: '22mm',
        footFs: '6pt',
        ipH2: '13.5pt', gridGap: '5mm 4mm', cellImg: '29mm',
        nm: '8.6pt', tx: '6.2pt', sz: '5.8pt', txLen: 96,
        bcH3: '12pt', bcV: '6.2pt', restB: '6.6pt', restS: '5.6pt', aboutFs: '6.4pt',
        secGap: '4mm', calc: false, aboutParas: 2, ticks: 5, noteLen: 140, cellImg2: '29mm' },
};

/* The eight paint colours the website mixes its decorative fields from.
   On the cover they become a swatch strip — the most direct way for a paint
   company to say "we make colour" without writing the sentence. */
const SWATCHES = ['#d92843', '#e8a317', '#1e3a8a', '#166534',
                  '#6e3122', '#84cc16', '#5a4374', '#d6b884'];

const rangeCss = z => `
@page { size: ${z.sheet}; margin: 0; }
.sheet { --sheet-w:${z.w}; --sheet-h:${z.h}; --k:${z.k}; }
.fold { display:flex; width:${z.w}; height:${z.h}; }
.pnl  { position:relative; width:${z.panel}; height:${z.h}; overflow:hidden; }
@media screen { .pnl + .pnl { border-left:.15mm dashed rgba(0,0,0,.25); } }

/* A hairline frame on every panel, inset from the trim. It gives the piece a
   held edge when it is folded, and it is what stops four full-bleed panels
   reading as four unrelated sheets. */
.frame { position:absolute; inset:${z.frame}; border:.3mm solid var(--fr, var(--rule));
         z-index:4; pointer-events:none; }

/* ---- cover ---- */
.cover { background:var(--blue-deep); color:#fff; --fr:rgba(255,255,255,.32); }

/* Shapes, in the brand palette, sized off one multiplier so the small fold
   keeps the same composition rather than a different one. */
.cover i { position:absolute; display:block; }
.sh-ring { width:calc(168mm * var(--k)); height:calc(168mm * var(--k));
           right:calc(-58mm * var(--k)); top:calc(-52mm * var(--k));
           border-radius:50%; border:calc(11mm * var(--k)) solid rgba(232,163,23,.16); }
.sh-band { left:calc(-24mm * var(--k)); right:calc(-24mm * var(--k));
           height:calc(30mm * var(--k)); bottom:calc(74mm * var(--k));
           background:rgba(139,30,44,.5); transform:rotate(-5.5deg); }
.sh-blob { width:calc(48mm * var(--k)); height:calc(48mm * var(--k));
           left:calc(-16mm * var(--k)); bottom:calc(104mm * var(--k));
           border-radius:50%; background:rgba(37,71,184,.45); }
.sh-bar  { right:0; width:calc(3.4mm * var(--k)); top:0; bottom:0;
           background:linear-gradient(180deg,var(--red-glow),var(--gold) 55%,var(--blue-2)); }

.cover-in { position:absolute; inset:${z.pad} ${z.pad} 0; z-index:2;
            display:flex; flex-direction:column; }
.cover .chip { background:#fff; border-radius:2mm; padding:3mm 3.4mm;
               display:inline-flex; align-items:center; gap:3.4mm; align-self:flex-start; }
.cover .chip > img:first-child { width:${z.logo}; }
.cover .chip .kebs { height:${z.kebs}; width:auto; }
.cover .chip-rule { width:.3mm; align-self:stretch; background:var(--rule); margin:1.5mm 0; }

.swatch { display:flex; gap:1.2mm; }
.swatch i { position:static; width:${z.sw}; height:calc(${z.sw} * .62); border-radius:.8mm; }

.cover h1 { font:400 ${z.h1}/0.98 var(--serif); letter-spacing:-.02em; color:#fff; }
.cover h1 em { font-style:italic; color:var(--gold-2, #ffc93d); }
.cover .kick { font:400 ${z.kick}/1.55 var(--sans); color:rgba(255,255,255,.86); }
.cover .strap { font:400 italic ${z.strap}/1.3 var(--serif); color:var(--gold); }
.cover .rule-g { height:.8mm; width:calc(34mm * var(--k)); background:var(--gold); }

.cover-line { position:absolute; left:0; right:0; bottom:0;
              height:${z.lineH}; z-index:2; }
.cover-line .row { position:absolute; left:${z.rowIn}; right:${z.rowIn}; bottom:${z.rowUp};
                   display:flex; align-items:flex-end; justify-content:center; gap:${z.tinGap}; }
.cover-line img { height:${z.tinH}; width:auto; flex:none; }

.cover-foot { position:absolute; left:${z.frame}; right:${z.frame}; bottom:${z.frame};
              background:rgba(0,0,0,.34); padding:3.4mm 5mm; display:flex;
              justify-content:space-between; gap:5mm;
              font:500 ${z.footFs}/1.4 var(--sans); color:rgba(255,255,255,.92); z-index:5; }
.cover-foot b { color:var(--gold); font-weight:600; letter-spacing:.1em;
                text-transform:uppercase; font-size:calc(${z.footFs} * .88); }

/* ---- inner panels ---- */
.ip { position:absolute; inset:${z.pad}; display:flex; flex-direction:column; }
.ip-head { display:flex; align-items:baseline; gap:4mm; padding-bottom:3mm;
           border-bottom:.8mm solid var(--accent); margin-bottom:5mm; }
.ip-head h2 { font:400 ${z.ipH2}/1 var(--serif); color:var(--ink); letter-spacing:-.01em; }
.ip-head .n { font:600 6.8pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
              color:var(--ink-3); margin-left:auto; }
.ip-note { font:400 ${z.tx}/1.5 var(--sans); color:var(--ink-2); margin-bottom:5mm; }

.pgrid { display:grid; grid-template-columns:1fr 1fr; gap:${z.gridGap}; flex:1; }
.pcell { display:flex; flex-direction:column; }
.pcell-img { height:${z.cellImg}; display:flex; align-items:flex-end; justify-content:center;
             margin-bottom:3mm; }
.pcell-img img { max-height:100%; width:auto; }
.pcell .cat { font:600 5.8pt/1.25 var(--sans); letter-spacing:.11em; text-transform:uppercase;
              color:var(--pc); }
.pcell .nm  { font:400 ${z.nm}/1.1 var(--serif); color:var(--ink); margin:1mm 0 1.6mm; }
.pcell .tx  { font:400 ${z.tx}/1.42 var(--sans); color:var(--ink-2); flex:1; }
.pcell .sz  { font:500 ${z.sz}/1 var(--sans); color:var(--ink-3); letter-spacing:.05em;
              margin-top:2.4mm; padding-top:2mm; border-top:.25mm solid var(--rule-2);
              font-variant-numeric:tabular-nums; }

/* ---- back cover ---- */
.bc { position:absolute; inset:${z.pad}; display:flex; flex-direction:column; }
.bc .mt-4 { margin-top:${z.secGap}; }
.bc-h { font:700 7pt/1 var(--sans); letter-spacing:.15em; text-transform:uppercase;
        color:var(--blue); padding-bottom:2.4mm; border-bottom:.3mm solid var(--rule);
        margin-bottom:4mm; }

.about { font:400 ${z.aboutFs}/1.6 var(--sans); color:var(--ink-2); }
.about b { color:var(--ink); font-weight:600; }
.about + .about { margin-top:2.6mm; }

.also2 { display:grid; grid-template-columns:1fr 1fr; gap:2.6mm 6mm; }
.also2 .r b { font:600 ${z.restB}/1.2 var(--sans); color:var(--ink); display:block; }
.also2 .r span { font:400 ${z.restS}/1.3 var(--sans); color:var(--ink-3); }

.bc-ticks li { font:400 ${z.aboutFs}/1.4 var(--sans); color:var(--ink-2); margin-bottom:1.8mm; }
.bc-ticks li::before { border-color:var(--blue); }

.bc-calc { margin-top:${z.secGap}; }
.bc-calc .cover-calc { margin-top:0; padding-top:3.5mm; border-top:.5mm solid var(--rule); }
.bc-calc .cover-calc .k { font:700 ${z.restS}/1 var(--sans); letter-spacing:.14em;
        text-transform:uppercase; color:var(--ink-3); margin-bottom:2.6mm; }
.bc-calc .calc { width:100%; border-collapse:collapse; }
.bc-calc .calc th { font:600 ${z.restS}/1.2 var(--sans); letter-spacing:.1em;
        text-transform:uppercase; color:var(--ink-3); text-align:left; padding:0 0 1.6mm; }
.bc-calc .calc th:last-child, .bc-calc .calc td:last-child { text-align:right; }
.bc-calc .calc td { font:400 ${z.bcV}/1.3 var(--sans); color:var(--ink-2);
        padding:1.5mm 0; border-top:.25mm solid var(--rule-2); font-variant-numeric:tabular-nums; }
.bc-calc .calc td b { font-weight:600; color:var(--blue); }
.bc-calc .fine { margin-top:2mm; }

/* the contact block sits inside the frame rather than bleeding past it */
.bc-contact { margin-top:auto; background:var(--blue-deep); color:#fff;
              border-radius:1.6mm; padding:5.5mm 6mm 6mm; }
.bc-contact h3 { font:400 ${z.bcH3}/1.1 var(--serif); color:#fff; margin-bottom:4mm; }
.bc-contact h3 em { font-style:italic; color:var(--gold); }
.bc-grid { display:grid; grid-template-columns:1fr 1fr; gap:4.5mm 7mm; }
.bc-grid .k { font:600 6.2pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
              color:var(--gold); margin-bottom:1.6mm; }
.bc-grid .v { font:400 ${z.bcV}/1.45 var(--sans); color:rgba(255,255,255,.88); }
.bc-grid .v b { color:#fff; font-weight:600; }
`;

function rangeFlier(size) {
  const d = 1;
  const a = assets(d);
  const z = RANGE_SIZES[size];

  // The twelve studio tins, split so each inner panel holds one clear idea.
  const WALLS = ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'supermatt', 'weatherguard', 'rocketex'];
  const TRADE = ['super-gloss', 'gloss-enamel', 'clear-varnish', 'roof-paint', 'road-marking', 'turpentine'];
  const shown = new Set([...WALLS, ...TRADE]);

  // Everything tinned that has no studio photograph, listed rather than shown.
  const rest = P.filter(p => !isTexture(p) && !shown.has(p.slug));

  const cell = slug => {
    const p = bySlug[slug];
    return `
    <div class="pcell" style="--pc:${readable(p.primary)}">
      <div class="pcell-img"><img src="${heroImage(p, d)}" alt="${esc(p.name)}"></div>
      <div class="cat">${esc(p.cat_label)}</div>
      <div class="nm">${esc(p.name)}</div>
      <div class="tx">${esc(sentences(p.short, z.txLen))}</div>
      <div class="sz">${esc((p.sizes || []).join(' · '))}</div>
    </div>`;
  };

  const innerPanel = (title, note, slugs, accent) => `
    <div class="pnl" style="${accentVars(accent)}">
      <div class="frame"></div>
      <div class="ip">
        <div class="ip-head">
          <h2>${title}</h2>
          <span class="n">${slugs.length} lines</span>
        </div>
        <p class="ip-note">${esc(sentences(note, z.noteLen))}</p>
        <div class="pgrid">${slugs.map(cell).join('')}</div>
      </div>
    </div>`;

  const frontCover = `
    <div class="pnl cover">
      <i class="sh-ring"></i>
      <i class="sh-blob"></i>
      <i class="sh-band"></i>
      <i class="sh-bar"></i>
      <div class="frame"></div>

      <div class="cover-in">
        <span class="chip">
          <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
          <span class="chip-rule"></span>
          <img class="kebs" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
        </span>
        <div class="rule-g mt-3"></div>
        <h1 class="mt-2">The complete<br><em>Cloud Paints</em> range</h1>
        <div class="swatch mt-2">
          ${SWATCHES.map(c => `<i style="background:${c}"></i>`).join('')}
        </div>
        <p class="kick mt-2">Paints, coatings and decorative finishes manufactured in
          Industrial Area, Nairobi. Eighteen tinned lines and ten hand-applied finishes,
          made for Kenyan walls, Kenyan weather and Kenyan light — from the primer that
          goes on first to the topcoat everybody sees.</p>
        <p class="kick mt-1">Every tin is mixed and tinted to your colour at our counter,
          carries the KEBS Standardisation Mark, and comes with a technical datasheet.
          Trade rates for stockists, painters and contractors.</p>
        <p class="strap mt-2">${esc(CO.strap)}</p>
      </div>

      <div class="cover-line">
        <div class="row">
          ${['silk-vinyl', 'weatherguard', 'vinyl-matt', 'supermatt', 'rocketex']
            .map(s => `<img src="${heroImage(bySlug[s], d)}" alt="">`).join('')}
        </div>
      </div>

      <div class="cover-foot">
        <span><b>Manufactured by</b><br>${esc(CO.legal)} · ${esc(CO.area)}</span>
        <span style="text-align:right"><b>Find us</b><br>${esc(CO.web)} · ${esc(CO.phones[0])}</span>
      </div>
    </div>`;

  const backCover = `
    <div class="pnl" style="${accentVars('#1e3a8a')}">
      <div class="frame"></div>
      <div class="bc">
        <div class="bc-h">About Cloud Paints</div>
        <p class="about"><b>Cloud Paints is the flagship brand of Cloudsent Decor Ltd</b>,
          a Nairobi manufacturer of decorative paints, coatings and solvents. We spent a
          decade in home décor, interior planning and gypsum fitting before we started
          making the paint ourselves — customer after customer asked where we sourced it,
          and whether they could buy the same quality for their own projects.</p>
        ${z.aboutParas > 1 ? `<p class="about">So we built the plant. Everything is manufactured at Industrial
          Area, Nairobi, to the Kenya Bureau of Standards Standardisation Mark, and we
          know what Kenyan sun, rain and dust do to a wall because we have spent years
          repainting them. Bring a photograph, a fabric or a paint chip to the counter
          and we will match it, mix it, and tell you honestly how much you need.</p>` : ''}

        <div class="bc-h mt-4">Also in the range</div>
        <div class="also2">
          ${rest.map(p => `<div class="r"><b>${esc(p.name)}</b>
            <span>${esc(p.cat_label)} · ${esc((p.sizes || []).join(' · '))}</span></div>`).join('')}
        </div>

        <div class="bc-h mt-4">What you get at the counter</div>
        <ul class="ticks ticks--tight bc-ticks">
          <li>Mixed and tinted to your colour while you wait</li>
          <li>Trade and contractor rates for stockists and painters</li>
          <li>A technical datasheet for every line in the range</li>
          ${z.ticks > 3 ? `<li>Delivery across Nairobi and upcountry</li>
          <li>Colour matching from a photograph, a fabric or a chip</li>` : ''}
        </ul>

        ${z.calc ? `<div class="bc-calc">${coverageBlock()}</div>` : ''}

        <div class="bc-contact">
          <h3>Come and see the <em>colour.</em></h3>
          <div class="bc-grid">
            <div>
              <div class="k">Call or WhatsApp</div>
              <div class="v"><b>${esc(CO.phones[0])}</b><br>${esc(CO.phones[1])}<br>${esc(CO.phones[2])}</div>
            </div>
            <div>
              <div class="k">Visit the counter</div>
              <div class="v"><b>${esc(CO.street)}</b><br>${esc(CO.area)}<br>${esc(CO.box)}</div>
            </div>
            <div>
              <div class="k">Email</div>
              <div class="v">${esc(CO.email)}<br>${esc(CO.web)}</div>
            </div>
            <div>
              <div class="k">Opening hours</div>
              <div class="v">${esc(CO.hours)}<br>Sunday &amp; public holidays closed</div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  return head(`Cloud Paints — the complete range (folds to ${size})`, d, rangeCss(z)) + `
<!-- PAGE 1 · OUTSIDE — left to right: back cover | front cover -->
<div class="sheet"><div class="fold">${backCover}${frontCover}</div></div>

<!-- PAGE 2 · INSIDE — left to right: inner left | inner right -->
<div class="sheet"><div class="fold">
  ${innerPanel('Walls, inside and out',
    'Sheen is the decision most people get wrong. Silk lifts colour and wipes clean; matt hides an uneven wall and calms a bright room. Weatherguard and Rocketex take the weather outside, and SuperMatt is the base that makes any of them last.',
    WALLS, '#1e3a8a')}
  ${innerPanel('Wood, metal, roofs &amp; road',
    'Doors, frames, grilles, gates, balustrades, roofs and car parks all take a beating. These are the hard-drying finishes for them — and the thinner that keeps the brushes usable afterwards.',
    TRADE, '#8b1e2c')}
</div></div>` + tail;
}

/* ============================================================
   5. PRICE LIST — A4, paginated
   ------------------------------------------------------------
   Cards are a fixed height, so pages are packed here rather than
   left to the browser: that keeps a group heading from stranding
   at the foot of a page with no rows under it.
   ============================================================ */
const PRICE_CSS = `
@page { size: 210mm 297mm; margin: 0; }
.sheet { --sheet-w:210mm; --sheet-h:297mm; }

/* ---- The frame -------------------------------------------------------
   A double keyline — a half-millimetre navy rule with a gold hairline set
   just inside it — is the cheapest mark of quality available on a press:
   both colours are already on the sheet, and it needs no lamination, no
   die and no second pass. Everything on the page lives inside it, so a
   trim that wanders half a millimetre never makes the layout look
   crooked. The masthead and the signature bar run the full width of the
   frame and the gold hairline crosses both, which ties the three together
   instead of stacking three separate boxes. */
.pinner { position:absolute; inset:8mm; border:.5mm solid var(--blue-deep);
          display:flex; flex-direction:column; overflow:hidden; }
.pinner::after { content:''; position:absolute; inset:1.3mm; z-index:3;
                 border:.2mm solid var(--gold); pointer-events:none; }

/* ---- Masthead, page one ---------------------------------------------- */
.ph { height:44mm; flex:none; background:var(--blue-deep); color:#fff;
      padding:0 9mm; display:flex; justify-content:space-between;
      align-items:center; gap:8mm; }
.ph .eyebrow { color:var(--gold); }
.ph h1 { font:400 33pt/1 var(--serif); letter-spacing:-.015em; color:#fff; margin-top:2.6mm; }
.ph .cur { display:flex; align-items:center; gap:3mm; margin-top:3.6mm;
           font:600 6.8pt/1 var(--sans); letter-spacing:.14em;
           text-transform:uppercase; color:#c8d0e6; }
.ph .cur::before { content:''; width:12mm; height:.35mm; background:var(--gold); flex:none; }
.ph-mark { display:flex; align-items:center; gap:4.5mm; flex:none; }
.ph-mark .lg { width:33mm; background:#fff; padding:2.4mm; border-radius:1.2mm; }
.ph-mark .kb { width:12.5mm; background:#fff; padding:1.2mm; border-radius:1mm; }

/* ---- Running head, every page after the first ------------------------- */
.prh { height:18mm; flex:none; display:flex; justify-content:space-between;
       align-items:center; padding:0 9mm; border-bottom:.3mm solid var(--rule); }
.prh .b { font:600 7.2pt/1 var(--sans); letter-spacing:.16em;
          text-transform:uppercase; color:var(--ink-3); }
.prh img { height:12mm; width:auto; }   /* by height — the 18mm head clips a logo set by width */

.pbody { flex:1; min-height:0; overflow:hidden; padding:6mm 9mm 0; }

/* ---- Section heading -------------------------------------------------- */
.grp { margin-bottom:8mm; }
.grp:last-child { margin-bottom:0; }
.gh { display:flex; align-items:center; gap:2.8mm; margin:0 0 5.5mm; }
.gh .sq { width:1.9mm; height:1.9mm; background:var(--gold); flex:none; }
.gh .t { font:700 8.4pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
         color:var(--blue-deep); white-space:nowrap; }
.gh .ln { flex:1; height:.25mm; background:var(--rule); }

.cards { display:grid; grid-template-columns:1fr 1fr; gap:4mm 5mm; }

/* ---- One product ------------------------------------------------------
   Ruled on all four sides and divided between pack sizes. The list ships
   unpriced, so every cell has to read as a field waiting for a number
   rather than as something the printer dropped — which is exactly what an
   open, borderless cell with a blank in it looks like. The writing rule
   runs the full width of its cell for the same reason: a short rule
   floating in a wide cell reads as decoration, a full one as a field. */
.pc { border:.3mm solid var(--rule); border-radius:1.2mm; overflow:hidden;
      display:flex; min-height:24mm; }
.pc-b { flex:1; min-width:0; display:flex; flex-direction:column; }
.pc-h { background:var(--accent); color:#fff; padding:2.9mm 3mm 2.7mm;
        font:600 8.4pt/1.15 var(--sans); letter-spacing:.005em;
        display:flex; align-items:baseline; gap:2.2mm; }
.pc-h .n { font:600 6.2pt/1 var(--sans); color:var(--gold); flex:none;
           letter-spacing:.06em; font-variant-numeric:tabular-nums; }
.pc-h .nm { min-width:0; }
.pc-sizes { display:flex; flex:1; }
.pc-sz { flex:1; min-width:0; padding:3mm 3mm 2.8mm; border-right:.25mm solid var(--rule-2); }
.pc-sz:last-child { border-right:0; }
.pc-sz .s { font:600 6.6pt/1 var(--sans); letter-spacing:.1em; text-transform:uppercase;
            color:var(--ink-2); font-variant-numeric:tabular-nums; }
.pc-sz .p { font:600 9.5pt/1 var(--sans); color:var(--ink); margin-top:2.3mm;
            font-variant-numeric:tabular-nums; white-space:nowrap; }
.pc-sz .p small { font-weight:500; font-size:6pt; color:var(--ink-3); letter-spacing:.06em; }
.pc-sz .p.na { color:var(--ink-3); font-weight:500; }
.pc-sz .p.tbc { display:block; height:4mm; border-bottom:.3mm solid var(--ink-3); }

/* The picture column is drawn whether or not there is a photograph to put
   in it. Six lines have none, and a card that simply stops 19mm short of
   its neighbour breaks the grid far more visibly than an empty panel. */
.pc-img { width:19mm; flex:none; background:var(--cream);
          border-left:.3mm solid var(--rule-2);
          display:flex; align-items:center; justify-content:center; padding:2mm; }
.pc-img img { max-height:19mm; width:auto; max-width:100%; object-fit:contain; }
.pc-img--none { background:var(--cream-2); }

/* ---- Closing note ----------------------------------------------------- */
.pnote { margin-top:2mm; background:var(--cream);
         border:.3mm solid var(--rule); border-top:.9mm solid var(--gold);
         padding:4.4mm 5mm; }
.pnote .h { font:700 7pt/1 var(--sans); letter-spacing:.14em; text-transform:uppercase;
            color:var(--blue-deep); margin-bottom:2.8mm; }
.pnote p { font:400 7.2pt/1.5 var(--sans); color:var(--ink-2); }
.pnote p + p { margin-top:1.9mm; }
.pnote b { color:var(--ink); font-weight:600; }

/* ---- Signature bar, every page ---------------------------------------- */
/* One line, both halves, on every page. Nowrap because a second line here
   would be clipped by the frame rather than pushing anything down. */
.psig { height:11mm; flex:none; background:var(--blue-deep); color:#fff;
        padding:0 9mm; display:flex; align-items:center;
        justify-content:space-between; gap:6mm;
        font:500 6.6pt/1.3 var(--sans); letter-spacing:.04em; white-space:nowrap; }
.psig .r { color:var(--gold); }
`;

function priceCards(d) {
  // Build every card once, tagged with the group it belongs to.
  return PRICE_GROUPS.map(g => {
    const rows = g.slugs.map(slug => {
      const p = bySlug[slug];
      if (!p) return null;
      const table = PRICES[slug] || {};
      // Only sizes the product actually stocks, in the catalogue's order.
      const sizes = (p.sizes || []).filter(s => s in table);
      return { p, sizes, table, src: thumbImage(p, d) };
    }).filter(Boolean);
    /* Photographed tins first, the rest at the foot of their own section.
       Scattered through the grid, an empty picture panel reads as artwork
       that failed to load; collected at the bottom it reads as a deliberate
       sub-list. Two passes rather than a comparator, so the order written
       in prices.js survives inside each block. */
    return { title: g.title,
             rows: [...rows.filter(r => r.src), ...rows.filter(r => !r.src)] };
  }).filter(g => g.rows.length);
}

function priceCardHTML(entry, n) {
  const { p, sizes, table, src } = entry;
  const cell = s => {
    const v = table[s];
    if (v === null || v === undefined)
      return `<div class="pc-sz"><div class="s">${esc(s)}</div><div class="p na">—</div></div>`;
    if (!v)
      return `<div class="pc-sz"><div class="s">${esc(s)}</div><div class="p tbc"></div></div>`;
    return `<div class="pc-sz"><div class="s">${esc(s)}</div>`
         + `<div class="p">${v.toLocaleString('en-KE')} <small>${esc(CURRENCY)}</small></div></div>`;
  };
  return `
  <div class="pc" style="${accentVars(p.primary)}">
    <div class="pc-b">
      <div class="pc-h"><span class="n">${String(n).padStart(2, '0')}</span><span class="nm">${esc(p.name.toUpperCase())}</span></div>
      <div class="pc-sizes">${sizes.map(cell).join('')}</div>
    </div>
    ${src ? `<div class="pc-img"><img src="${src}" alt=""></div>`
          : `<div class="pc-img pc-img--none"></div>`}
  </div>`;
}

function priceList() {
  const d = 1;
  const a = assets(d);
  const groups = priceCards(d);

  /* --- pagination -------------------------------------------------------
     Measured from the CSS above rather than guessed. Inside the 8mm frame
     there is 281mm of height; the masthead takes 44 and the running head 18,
     the signature bar takes 11 on every page, and the body opens with 6mm of
     air — so a first page has 220mm to fill and every page after it 246mm.
     A card is 24mm and sits in a 4mm gutter, a section heading with its
     margin costs 9mm, and one section is separated from the next by 8mm.
     The closing note needs 40mm wherever it lands.

     The gap is charged between sections rather than after each one, because
     the last section on a page has its bottom margin collapsed away — count
     it and the page loses a card row it had room for.

     Packing here rather than letting the browser flow it is what stops a
     section heading stranding at the foot of a page, and render.mjs measures
     every .pbody afterwards, so if these numbers ever drift the build says
     so rather than clipping in silence. */
  const ROW = 29, HEAD = 9, GAP = 8, NOTE = 40;
  const cap = i => (i === 0 ? 220 : 246);

  const cost = g => HEAD + Math.ceil(g.rows.length / 2) * ROW;

  const pages = [];
  let page = [], used = 0;
  for (const g of groups) {
    const add = cost(g) + (page.length ? GAP : 0);
    if (page.length && used + add > cap(pages.length)) {
      pages.push(page); page = [g]; used = cost(g);
    } else {
      page.push(g); used += add;
    }
  }
  if (page.length) pages.push(page);

  // The note goes on the last page only if it fits; otherwise it gets its own.
  if (used + NOTE > cap(pages.length - 1)) pages.push([]);

  let n = 0;
  const sheets = pages.map((groupsOnPage, i) => {
    const isFirst = i === 0;
    const isLast  = i === pages.length - 1;

    /* No effective date and no page numbers, by request. The list is
       reprinted whenever the numbers move, so a date only ages it on the
       counter, and "page 2 of 2" is furniture on a document nobody files. */
    const header = isFirst ? `
      <div class="ph">
        <div>
          <span class="eyebrow">${esc(CO.legal)} · Nairobi</span>
          <h1>Price List</h1>
          <div class="cur">All prices in Kenya Shillings</div>
        </div>
        <div class="ph-mark">
          <img class="kb" src="${a}/img/brand/kebs.png" alt="KEBS Standardisation Mark">
          <img class="lg" src="${a}/img/brand/logo.png" alt="Cloud Paints">
        </div>
      </div>` : `
      <div class="prh">
        <span class="b">Cloud Paints · Price list · Recommended retail</span>
        <img src="${a}/img/brand/logo.png" alt="Cloud Paints">
      </div>`;

    const body = groupsOnPage.map(g => `
      <div class="grp">
        <div class="gh"><span class="sq"></span><span class="t">${esc(g.title)}</span><span class="ln"></span></div>
        <div class="cards">${g.rows.map(r => priceCardHTML(r, ++n)).join('')}</div>
      </div>`).join('');

    const note = isLast ? `
      <div class="pnote">
        <div class="h">Terms and the counter</div>
        <p>${esc(TRADE_NOTE)}</p>
        <p><b>Colour tinting</b> is available at the Industrial Area counter on all
           emulsions and enamels. Tinted shades may carry a surcharge depending on
           the colourant used.</p>
        <p><b>Textured and decorative finishes</b> are quoted separately. They are
           sold by weight and applied by hand, so the figure depends on the wall —
           bring your measurements and ask for the decorative desk.</p>
        <p><b>${esc(CO.legal)}</b> · ${esc(CO.street)}, ${esc(CO.area)} ·
           ${esc(CO.box)} · ${esc(CO.phones[0])} · ${esc(CO.phones[1])} ·
           ${esc(CO.email)}</p>
      </div>` : '';

    return `
<div class="sheet">
  <div class="pinner">
    ${header}
    <div class="pbody">${body}${note}</div>
    <div class="psig">
      <span>${esc(CO.legal)} · ${esc(CO.area)}</span>
      <span class="r">${esc(CO.phones[0])} · ${esc(CO.email)} · ${esc(CO.web)}</span>
    </div>
  </div>
</div>`;
  }).join('\n');

  return head('Cloud Paints — Price List', d, PRICE_CSS) + sheets + tail;
}

/* ============================================================
   6. Build
   ============================================================ */
console.log('Cloud Paints — building print masters\n');

for (const p of withArt) {
  made.push(write(`html/fliers/a4/${p.slug}.html`, flierA4(p)));
  made.push(write(`html/fliers/a5/${p.slug}.html`, flierA5(p)));
}
console.log(`  fliers        ${withArt.length} products × A4 + A5 = ${withArt.length * 2} sheets`);

/* Colour flier — one product, both sizes, as a sample to approve before the
   treatment is rolled across the range. Change the slug to try another. */
const COLOUR_SAMPLE = 'weatherguard';
const cs = bySlug[COLOUR_SAMPLE];
made.push(write(`html/fliers/colour/${cs.slug}-a4.html`, flierColourA4(cs)));
made.push(write(`html/fliers/colour/${cs.slug}-a5.html`, flierColourA5(cs)));
console.log(`  colour flier  ${cs.name} — A4 + A5`);

for (const s of ['A4', 'A5']) made.push(write(`html/range-flier-${s.toLowerCase()}.html`, rangeFlier(s)));
console.log(`  range flier   folds to A4 · folds to A5`);

for (const s of ['A2', 'A3']) made.push(write(`html/poster-range-${s.toLowerCase()}.html`, rangePoster(s)));
console.log(`  range poster  A2 · A3`);

const BROCHURES = [
  {
    name: 'range', accent: '#1e3a8a',
    title: 'The <em>Cloud Paints</em> range',
    kicker: 'Paints, coatings and decorative finishes made in Nairobi.',
    eyebrow: 'The full range',
    insideTitle: 'One manufacturer, wall to roof.',
    intro: 'From the primer that goes on first to the finish everybody sees — every coat on the building can come from the same plant, mixed to the same standard.',
    flap: 'Cloud Paints is manufactured in Industrial Area, Nairobi by Cloudsent Decor Ltd — a decade in home décor and interiors before we started making the paint ourselves. We know what Kenyan sun, rain and dust do to a wall, because we have been repainting them.',
    cover: 'projects/cloud-red-roof-residence.jpg',
    slugs: ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'weatherguard', 'rocketex',
            'roof-paint', 'supermatt', 'super-gloss', 'gloss-enamel', 'clear-varnish',
            'road-marking', 'turpentine'],
  },
  {
    name: 'interior', accent: '#6b1f6e',
    title: 'Interior <em>walls</em> &amp; ceilings',
    kicker: 'Silk, matt and economy emulsions for rooms people live in.',
    eyebrow: 'Interior emulsions',
    insideTitle: 'The right sheen for the room.',
    intro: 'Sheen is the decision most people get wrong. Silk lifts colour and wipes clean; matt hides an uneven wall and calms a bright room. Here is how the three lines differ.',
    flap: 'Every interior emulsion we make is water-based, lead-free and low odour, so a room can be lived in again quickly. All three lines tint to the same colour card at our counter.',
    cover: 'applied/vinyl-matt-applied.jpg',
    slugs: ['silk-vinyl', 'vinyl-matt', 'iris-economy', 'supermatt', 'universal-undercoat'],
  },
  {
    name: 'exterior', accent: '#8b1e2c',
    title: 'Exterior <em>protection</em>',
    kicker: 'Weatherguard, textured masonry coatings and roof paint.',
    eyebrow: 'Exterior & roof',
    insideTitle: 'The coat that takes the weather.',
    intro: 'An exterior wall in Kenya takes hard sun, hard rain and dust, often in the same week. These are the coatings built for that, and the primer that should go under them.',
    flap: 'Coastal and lakeside buildings weather faster than upcountry ones. If you are painting in Mombasa, Kilifi, Diani or Kisumu, tell us — it changes what we recommend and how many coats you need.',
    cover: 'applied/weatherguard-applied.jpg',
    slugs: ['weatherguard', 'rocketex', 'vinyl-matt', 'roof-paint', 'supermatt'],
  },
  {
    name: 'wood-metal', accent: '#0f1f5c',
    title: 'Wood, <em>metal</em> &amp; floors',
    kicker: 'Enamels, varnishes, primers and the thinners that go with them.',
    eyebrow: 'Wood, metal & floors',
    insideTitle: 'Gloss that stays glossy.',
    intro: 'Doors, window frames, grilles, gates, balustrades and floors all take a beating. These are the hard-drying finishes for them — and the primers that make them last.',
    flap: 'Enamel work lives or dies on preparation. Bare metal wants a metal primer, bare wood wants a sanding seal, and both want the surface dry. Ask us and we will walk you through it.',
    cover: 'applied/clear-varnish-applied.jpg',
    slugs: ['super-gloss', 'gloss-enamel', 'clear-varnish', 'varnish-stain',
            'metal-primer', 'universal-undercoat', 'floor-paint', 'road-marking',
            'turpentine', 'white-spirit', 'standard-thinner'],
  },
  {
    name: 'textures', accent: '#7a6b5c',
    title: 'Decorative <em>finishes</em>',
    kicker: 'Stone, concrete, marble and metallic textures applied by hand.',
    eyebrow: 'Textured & decorative',
    insideTitle: 'Where a flat wall was.',
    intro: 'A textured finish does what paint cannot: it gives a wall depth, shadow and a surface worth touching. Each of these is applied by hand, so the wall is never quite the same twice.',
    flap: 'Textured finishes are sold by weight or volume and applied with a trowel, roller or sponge depending on the effect. Coverage varies with how heavily it is laid on — bring your wall measurements and we will work it out with you.',
    cover: 'textures/finish-cloud-venetian-marble.jpg',
    slugs: textures.map(t => t.slug),
  },
];

for (const b of BROCHURES) made.push(write(`html/brochures/${b.name}.html`, brochure(b)));
console.log(`  brochures     ${BROCHURES.length} tri-folds, 2 sides each`);

made.push(write('html/price-list.html', priceList()));
console.log(`  price list    1 document`);

const skipped = P.filter(p => !heroImage(p, 0)).map(p => p.name);
console.log(`\n  ${made.length} HTML masters written to client-package/html/`);
if (skipped.length) {
  console.log(`\n  No print-quality photograph — no individual flier generated:`);
  skipped.forEach(s => console.log(`    · ${s}`));
  console.log(`  These still appear in the range tables and the price list.`);
}
