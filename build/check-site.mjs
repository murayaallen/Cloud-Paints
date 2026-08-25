// CLOUD PAINTS — site check
// ============================================================
//   node build/serve.mjs 8322 &            (in another shell)
//   node build/check-site.mjs 8322
//   node build/check-site.mjs 8323 Cloud-Paints   (mounted in a subfolder)
//
// Loads every canonical URL in sitemap.xml in a real browser, under the
// production Content-Security-Policy that serve.mjs applies, and reports
// what a visitor would actually hit:
//
//   · console errors and page exceptions
//   · requests that failed or 404'd, including CSP refusals
//   · images that resolved but decoded to nothing
//   · horizontal overflow at 390 / 820 / 1440 px
//   · missing or duplicated title, description or canonical
//   · internal links, requested rather than assumed
//
// Why a browser and not a fetch loop: half of these faults only exist once
// scripts run. A link can answer 200 while the image it points at is
// blocked by the CSP, and a page can be perfect until a phone viewport
// pushes one element past the fold.
//
// Node 22+ (uses the global WebSocket — no dependencies).
// ============================================================

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2]) || 8322;
const MOUNT = (process.argv[3] || '').replace(/^\/+|\/+$/g, '');
const BASE = `http://127.0.0.1:${PORT}` + (MOUNT ? '/' + MOUNT : '');

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(p => fs.existsSync(p));
if (!EDGE) { console.error('No Edge or Chrome found.'); process.exit(1); }

const VIEWPORTS = [[390, 844], [820, 1180], [1440, 900]];

/* ---------- the pages to check ---------------------------------------- */
function pages() {
  const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  // sitemap carries production URLs; keep only the path and re-base it
  return locs.map(u => {
    const p = u.replace(/^https?:\/\/[^/]+/, '');
    return BASE + (p === '/' ? '/' : p);
  });
}

/* ---------- devtools plumbing ------------------------------------------ */
let seq = 0;
function rpc(ws, method, params = {}, sessionId) {
  const id = ++seq;
  return new Promise((res, rej) => {
    const on = ev => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.id !== id) return;
      ws.removeEventListener('message', on);
      m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result);
    };
    ws.addEventListener('message', on);
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- run --------------------------------------------------------- */
const profile = path.join(os.tmpdir(), `cp-check-${process.pid}`);
const dbg = 9500 + (process.pid % 300);
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--disable-extensions', `--remote-debugging-port=${dbg}`, `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });

const problems = [];
const note = (page, kind, detail) => problems.push({ page, kind, detail });
let ws;

try {
  let version;
  for (let i = 0; i < 120; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${dbg}/json/version`)).json(); break; }
    catch { await sleep(200); }
  }
  if (!version) throw new Error('browser did not start');

  ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', () => rej(new Error('could not attach')), { once: true });
  });

  // is the server up?
  try {
    const r = await fetch(BASE + '/');
    if (!r.ok) throw new Error('status ' + r.status);
  } catch (e) {
    throw new Error(`nothing serving at ${BASE} — start it with:  node build/serve.mjs ${PORT}${MOUNT ? ' ' + MOUNT : ''}`);
  }

  const { targetId } = await rpc(ws, 'Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await rpc(ws, 'Target.attachToTarget', { targetId, flatten: true });
  for (const d of ['Page', 'Runtime', 'Network', 'Log']) await rpc(ws, d + '.enable', {}, sessionId);

  // Per-page collectors, refilled on each navigation.
  let consoleErrors = [], failed = [], statuses = new Map();
  ws.addEventListener('message', ev => {
    let m; try { m = JSON.parse(ev.data); } catch { return; }
    if (m.sessionId !== sessionId) return;
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      consoleErrors.push((d.exception && d.exception.description || d.text || 'exception').split('\n')[0]);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 160));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleErrors.push(m.params.entry.text.slice(0, 160));
    }
    if (m.method === 'Network.loadingFailed') {
      failed.push(`${m.params.errorText}${m.params.blockedReason ? ' (' + m.params.blockedReason + ')' : ''}`);
    }
    if (m.method === 'Network.responseReceived') {
      statuses.set(m.params.response.url, m.params.response.status);
    }
  });

  const list = pages();
  console.log(`Cloud Paints — checking ${list.length} pages at ${BASE}\n`);

  const seenLinks = new Set();
  const meta = [];
  let n = 0;

  for (const url of list) {
    consoleErrors = []; failed = []; statuses = new Map();

    await rpc(ws, 'Emulation.setDeviceMetricsOverride',
      { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);
    await rpc(ws, 'Page.navigate', { url }, sessionId);

    const r = await rpc(ws, 'Runtime.evaluate', {
      expression: `(async () => {
        await new Promise(r => document.readyState === 'complete'
          ? r() : addEventListener('load', r, { once: true }));
        await new Promise(r => setTimeout(r, 450));
        const imgs = [...document.images];
        const broken = imgs.filter(i => i.currentSrc && !i.naturalWidth)
                           .map(i => i.currentSrc).slice(0, 6);
        const m = s => (document.querySelector(s) || {}).content
                    || (document.querySelector(s) || {}).href || '';
        return JSON.stringify({
          title: (document.title || '').trim(),
          desc: m('meta[name="description"]'),
          canonical: m('link[rel=canonical]'),
          titles: document.querySelectorAll('title').length,
          canons: document.querySelectorAll('link[rel=canonical]').length,
          imgs: imgs.length, broken,
          links: [...document.querySelectorAll('a[href]')]
            .map(a => a.href)
            .filter(h => h.startsWith(location.origin))
            .filter(h => !h.includes('#') || h.split('#')[0] !== location.href.split('#')[0]),
        });
      })()`, awaitPromise: true, returnByValue: true,
    }, sessionId);

    const info = JSON.parse(r.result.value);
    const rel = url.replace(BASE, '') || '/';

    // status of the page itself
    const own = statuses.get(url) ?? statuses.get(url + '/') ?? 200;
    if (own >= 400) note(rel, 'status', `page returned ${own}`);

    for (const e of [...new Set(consoleErrors)].slice(0, 4)) note(rel, 'console', e);
    for (const f of [...new Set(failed)].slice(0, 4)) note(rel, 'request', f);
    for (const b of info.broken) note(rel, 'image', 'decoded to nothing: ' + b.replace(BASE, ''));
    for (const [u, s] of statuses) if (s >= 400) note(rel, 'request', `${s} ${u.replace(BASE, '')}`);

    if (!info.title) note(rel, 'meta', 'no <title>');
    if (!info.desc) note(rel, 'meta', 'no meta description');
    if (!info.canonical) note(rel, 'meta', 'no canonical');
    if (info.titles > 1) note(rel, 'meta', `${info.titles} <title> elements`);
    if (info.canons > 1) note(rel, 'meta', `${info.canons} canonicals`);
    meta.push({ rel, title: info.title, desc: info.desc });

    info.links.forEach(l => seenLinks.add(l.split('#')[0]));

    // overflow at each viewport
    for (const [w, h] of VIEWPORTS) {
      await rpc(ws, 'Emulation.setDeviceMetricsOverride',
        { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 }, sessionId);
      const o = await rpc(ws, 'Runtime.evaluate', {
        expression: `(async () => { await new Promise(r => setTimeout(r, 220));
          const d = document.documentElement;
          const over = d.scrollWidth - d.clientWidth;
          if (over <= 1) return '';
          const wide = [...document.querySelectorAll('body *')].find(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.right > d.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
          });
          return over + 'px' + (wide ? ' — ' + wide.tagName.toLowerCase() +
            (wide.className && typeof wide.className === 'string'
              ? '.' + wide.className.trim().split(/\\s+/)[0] : '') : '');
        })()`, awaitPromise: true, returnByValue: true,
      }, sessionId);
      if (o.result.value) note(rel, 'overflow', `${w}px wide: overflows by ${o.result.value}`);
    }

    process.stdout.write(`\r  ${++n}/${list.length}  ${rel.padEnd(46)}`);
  }

  // every internal link actually requested
  console.log(`\n\n  following ${seenLinks.size} internal links…`);
  let dead = 0;
  for (const l of seenLinks) {
    try {
      const res = await fetch(l, { redirect: 'follow' });
      if (!res.ok) { note(l.replace(BASE, ''), 'link', `returns ${res.status}`); dead++; }
    } catch (e) { note(l.replace(BASE, ''), 'link', 'request failed: ' + e.message); dead++; }
  }

  // duplicate titles and descriptions
  for (const field of ['title', 'desc']) {
    const seen = new Map();
    for (const m of meta) {
      if (!m[field]) continue;
      if (seen.has(m[field])) note(m.rel, 'meta', `${field} duplicates ${seen.get(m[field])}`);
      else seen.set(m[field], m.rel);
    }
  }

  /* ---------- report --------------------------------------------------- */
  console.log('');
  const byKind = {};
  for (const p of problems) (byKind[p.kind] ||= []).push(p);
  const kinds = ['status', 'console', 'request', 'image', 'link', 'overflow', 'meta'];
  const labels = {
    status: 'page status', console: 'console errors', request: 'failed requests',
    image: 'broken images', link: 'dead internal links', overflow: 'horizontal overflow',
    meta: 'titles, descriptions, canonicals',
  };

  console.log(`${list.length} pages · ${seenLinks.size} internal links · ${VIEWPORTS.length} viewports\n`);
  for (const k of kinds) {
    const rows = byKind[k] || [];
    if (!rows.length) { console.log(`  ${labels[k].padEnd(34)} clean`); continue; }
    console.log(`  ${labels[k].padEnd(34)} ${rows.length} PROBLEM(S)`);
    for (const r of rows.slice(0, 10)) console.log(`      ! ${r.page}  —  ${r.detail}`);
    if (rows.length > 10) console.log(`      … and ${rows.length - 10} more`);
  }
  console.log('');
  process.exitCode = problems.length ? 1 : 0;

} catch (err) {
  console.error('\n' + err.message);
  process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  edge.kill();
  await sleep(400);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
