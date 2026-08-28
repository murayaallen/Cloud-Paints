// ============================================================
// CLOUD PAINTS — print package: HTML → PDF
// ============================================================
// Drives one headless Edge over the DevTools protocol and prints
// every master in html/ to pdf/. One browser for the whole run:
// launching Edge per document costs ~13s each, which turns a
// two-minute build into a quarter of an hour.
//
//   node build/render.mjs            all documents
//   node build/render.mjs price      only paths matching "price"
//
// Node 22+ (uses the global WebSocket — no dependencies).
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { ROOT } from './lib.mjs';

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));

if (!EDGE) {
  console.error('No Edge or Chrome found. Install one, or open the HTML in html/ and print to PDF by hand.');
  process.exit(1);
}

const PORT = 9223 + (process.pid % 200);
const filter = process.argv[2] || '';

/* Where each master lands. Grouping the PDFs by what they are beats one
   flat folder of sixty files when somebody has to find the A5 flier for
   Weatherguard at a print counter. */
const ROUTES = [
  { from: 'html/poster-range-a2.html', to: '1-range-poster/cloud-paints-range-A2.pdf' },
  { from: 'html/poster-range-a3.html', to: '1-range-poster/cloud-paints-range-A3.pdf' },
  { dir:  'html/fliers/colour', to: '0-colour-flier' },
  { dir:  'html/fliers/a4', to: '2-product-fliers-A4' },
  { dir:  'html/fliers/a5', to: '3-product-fliers-A5' },
  { from: 'html/range-flier-a4.html', to: '6-range-flier/cloud-paints-range-flier-folds-to-A4.pdf' },
  { from: 'html/range-flier-a5.html', to: '6-range-flier/cloud-paints-range-flier-folds-to-A5.pdf' },
  { from: 'html/range-sheet-a4.html', to: '6-range-flier/cloud-paints-range-A4-2page.pdf' },
  { dir:  'html/brochures', to: '4-brochures' },
  { from: 'html/price-list.html', to: '5-price-list/cloud-paints-price-list.pdf' },
  { from: 'html/colour-collection.html', to: '7-colour-collection/cloud-paints-colour-collection.pdf' },
];

function jobs() {
  const out = [];
  for (const r of ROUTES) {
    if (r.from) { out.push({ src: r.from, dst: r.to }); continue; }
    for (const f of fs.readdirSync(path.join(ROOT, r.dir)).filter(f => f.endsWith('.html')).sort()) {
      out.push({ src: `${r.dir}/${f}`, dst: `${r.to}/${f.replace(/\.html$/, '.pdf')}` });
    }
  }
  return out.filter(j => !filter || j.src.includes(filter) || j.dst.includes(filter));
}

/* ---------- DevTools plumbing ------------------------------------------- */
let seq = 0;
function rpc(ws, method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const onMsg = ev => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id !== id) return;
      ws.removeEventListener('message', onMsg);
      m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result);
    };
    ws.addEventListener('message', onMsg);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(fn, timeout, label) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await fn()) return true;
    await sleep(120);
  }
  throw new Error(`timed out waiting for ${label}`);
}

/* ---------- run ---------------------------------------------------------- */
const profile = path.join(os.tmpdir(), `cp-print-${process.pid}`);

const edge = spawn(EDGE, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--allow-file-access-from-files',   // local @font-face over file://
  '--font-render-hinting=none',       // geometry matches the CSS, not the screen
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

let ws;
try {
  // The debugging port is not up the instant the process is.
  let version;
  await waitFor(async () => {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      version = await r.json();
      return true;
    } catch { return false; }
  }, 30000, 'the browser to start');

  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('could not attach to the browser')), { once: true });
  });

  const { targetId } = await rpc(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await rpc(ws, 'Target.attachToTarget', { targetId, flatten: true });
  await rpc(ws, 'Page.enable', {}, sessionId);
  await rpc(ws, 'Runtime.enable', {}, sessionId);

  const list = jobs();
  console.log(`Cloud Paints — rendering ${list.length} document${list.length === 1 ? '' : 's'}\n`);

  let n = 0, bytes = 0;
  var warnings = [];
  const expected = {};
  for (const job of list) {
    const src = path.join(ROOT, job.src);
    const url = 'file:///' + src.replace(/\\/g, '/');

    await rpc(ws, 'Page.navigate', { url }, sessionId);

    /* Wait on the things that actually decide whether the PDF is right:
       every font face resolved and every image decoded. load alone fires
       while images are still coming in, which silently prints blank tins. */
    const ready = await rpc(ws, 'Runtime.evaluate', {
      expression: `(async () => {
        await new Promise(r => document.readyState === 'complete'
          ? r() : addEventListener('load', r, { once: true }));
        await document.fonts.ready;
        const imgs = [...document.images];
        await Promise.all(imgs.map(i => i.complete
          ? Promise.resolve() : new Promise(r => { i.onload = i.onerror = r; })));
        const broken = imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));

        /* Overset check. A .sheet is a fixed-height box with overflow hidden,
           so copy that runs long is silently guillotined rather than throwing.
           Measure every sheet and every column inside it against its box. */
        const over = [];
        document.querySelectorAll('.sheet').forEach((s, i) => {
          const boxes = [s, ...s.querySelectorAll('.pad, .pnl, .pbody, .gcols, .hero-copy, .col-1, .col-2, .col-3, .c-body, .c-copy')];
          boxes.forEach(b => {
            const spill = b.scrollHeight - b.clientHeight;
            if (spill > 2) over.push({ page: i + 1, el: b.className.split(' ')[0] || b.tagName, spill });
          });
        });
        /* Collision check. The contact band is positioned against the
           bottom edge, outside the padded column, so if it grows taller
           than the space reserved for it nothing overflows — it simply
           covers the content. That is invisible to the overset test. */
        document.querySelectorAll('.sheet').forEach((s, i) => {
          const pad = s.querySelector('.pad, .c-body');
          const ft = s.querySelector('.foot');
          if (!pad || !ft) return;
          const bite = pad.getBoundingClientRect().bottom - ft.getBoundingClientRect().top;
          if (bite > 2) over.push({ page: i + 1, el: 'foot-overlaps-content', spill: Math.round(bite) });
        });

        /* What the page actually says, per sheet. The print engine can
           drop a whole block the DOM lays out correctly: a box that lands on
           a page boundary is moved to the next page rather than split, and if
           nothing follows it, it simply disappears. No DOM measurement sees
           that, so the text is recorded here and compared against the finished
           PDF by build/verify.py. */
        const said = [...document.querySelectorAll('.sheet')]
          .map(el => el.innerText);

        return JSON.stringify({ imgs: imgs.length, broken, over, said });
      })()`,
      awaitPromise: true, returnByValue: true,
    }, sessionId);

    const info = JSON.parse(ready.result.value);
    expected[job.dst] = info.said;
    if (info.broken.length) {
      warnings.push(`${job.src}: ${info.broken.length} image(s) failed to load — ${info.broken[0]}`);
    }
    for (const o of info.over) {
      warnings.push(`${job.src}: page ${o.page} .${o.el} overflows by ${o.spill}px — content is being clipped`);
    }

    const { data } = await rpc(ws, 'Page.printToPDF', {
      printBackground: true,
      preferCSSPageSize: true,      // @page size wins, so A2 stays A2
      marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
      transferMode: 'ReturnAsBase64',
    }, sessionId);

    const out = path.join(ROOT, 'pdf', job.dst);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const buf = Buffer.from(data, 'base64');
    fs.writeFileSync(out, buf);
    bytes += buf.length;
    n++;
    process.stdout.write(`\r  ${String(n).padStart(2)}/${list.length}  ${job.dst.padEnd(52)}`);
  }

  console.log(`\n\n  ${n} PDFs · ${(bytes / 1048576).toFixed(1)} MB → client-package/pdf/`);

  const manifest = path.join(ROOT, 'build', 'expected-text.json');
  let merged = {};
  if (fs.existsSync(manifest)) {
    try { merged = JSON.parse(fs.readFileSync(manifest, 'utf8')); } catch {}
  }
  Object.assign(merged, expected);   // a filtered run updates, never replaces
  fs.writeFileSync(manifest, JSON.stringify(merged, null, 1), 'utf8');
  if (warnings.length) {
    console.log(`\n  ${warnings.length} layout warning${warnings.length === 1 ? '' : 's'}:`);
    warnings.forEach(w => console.log(`    ! ${w}`));
  } else {
    console.log('  No overset text, no missing images.');
  }
} catch (err) {
  console.error('\nRender failed:', err.message);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  try { await fetch(`http://127.0.0.1:${PORT}/json/close`).catch(() => {}); } catch {}
  edge.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
