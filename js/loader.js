// ============================================================
// CLOUD PAINTS — Phase 2 Loading Screen
// Full-viewport "paint pour" splash with a three-stage lift +
// red-curtain wipe hand-off to the landing hero.
//
//   0.00s  logo mark fades + scales in
//   0.25s  red drip extends downward (SVG stroke draw)
//   0.55s  three splatter dots pop outward
//   0.60s  CLOUD PAINTS wordmark char-staggers in
//   0.90s  gold progress line sweeps L→R
//   1.50s  splash lifts up, red curtain drops in behind it
//   2.20s  cleanup, emit `loader:done`
//
// Visit cadence:
//   - First visit ever  → full 2.2s sequence, store marker.
//   - Returning session → compressed 0.4s flash + curtain.
//
// Reduced motion: no pour choreography — a static logo + wordmark
// fade then a direct cut to content.
// ============================================================

(function () {
  'use strict';

  var WORDMARK = 'CLOUD  PAINTS';
  var FIRST_VISIT_KEY = 'cp-first-visit-done';
  var SESSION_KEY = 'cp-seen-splash';

  var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Detect how this page was reached — a reload always replays the full splash.
  var navType = 'navigate';
  try {
    var navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length) {
      navType = navEntries[0].type;
    } else if (performance.navigation) {
      navType = performance.navigation.type === 1 ? 'reload' : 'navigate';
    }
  } catch (e) { /* ignore */ }

  // Full sequence on a new tab/window OR a reload; compressed only on
  // in-session link navigations between pages.
  var seenInSession = sessionStorage.getItem(SESSION_KEY) === '1';
  var compressed = seenInSession && navType !== 'reload';

  // ---------- Markup -----------------------------------------
  function wordmarkHtml(text) {
    return text.split('').map(function (ch, i) {
      var c = ch === ' ' ? '\u00A0' : ch;
      // chars 7+ spell "PAINTS" \u2014 colour them red to match the logo
      var cls = i >= 7 ? ' class="cp-wm-red"' : '';
      return '<span' + cls + ' style="--i:' + i + '">' + c + '</span>';
    }).join('');
  }

  var loaderHtml =
    '<div id="cpLoader" aria-hidden="true" role="status">' +
      '<div class="cp-paint" aria-hidden="true">' +
        '<span class="cp-blob b1"></span>' +
        '<span class="cp-blob b2"></span>' +
        '<span class="cp-blob b3"></span>' +
        '<span class="cp-blob b4"></span>' +
        '<span class="cp-blob b5"></span>' +
        '<svg class="cp-splat" viewBox="0 0 200 200" aria-hidden="true">' +
          '<circle cx="100" cy="100" r="54"/>' +
          '<circle cx="34" cy="48" r="13"/>' +
          '<circle cx="168" cy="40" r="10"/>' +
          '<circle cx="176" cy="150" r="16"/>' +
          '<circle cx="40" cy="160" r="12"/>' +
          '<circle cx="14" cy="104" r="7"/>' +
          '<circle cx="190" cy="96" r="6"/>' +
          '<circle cx="104" cy="18" r="8"/>' +
        '</svg>' +
      '</div>' +
      '<div class="cp-stage">' +
        '<img class="cp-mark" src="' + (window.cpUrl ? window.cpUrl('images/logo-mark.webp') : '/images/logo-mark.webp') + '" alt="Cloud Paints" width="1140" height="968">' +
        '<div class="cp-wordmark" aria-label="Cloud Paints">' + wordmarkHtml(WORDMARK) + '</div>' +
        '<div class="cp-progress"><i></i></div>' +
      '</div>' +
    '</div>';

  function inject() {
    document.body.insertAdjacentHTML('afterbegin', loaderHtml);
    document.body.classList.add('cp-loading');
    // real loader is now on screen — drop the CSS pre-cover
    document.body.classList.add('cp-loader-mounted');
  }
  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }

  // ---------- Lock scroll ------------------------------------
  document.documentElement.style.overflow = 'hidden';

  // ---------- Sequence control ------------------------------
  // Full first-visit: choreography is CSS-driven via keyframes;
  // JS just schedules the lift/curtain & cleanup at the end.
  // Compressed/reduced: shorter flash, skip the drip/splash.

  // Trimmed from 5300/4800 — a 5s hold on every new tab and reload
  // made the whole site feel slow; the choreography reads fully by ~2s.
  var FULL_MS = 2900;
  var FULL_LIFT_AT = 2400;
  var COMPRESSED_MS = 800;
  var COMPRESSED_LIFT_AT = 350;
  var REDUCED_MS = 350;

  var domReadyAt = Date.now();

  function markCompressed() {
    var el = document.getElementById('cpLoader');
    if (!el) return;
    el.classList.add('cp-compressed');
    // Skip the drip / splatter / progress for a clean flash
    var drip = el.querySelector('.cp-drip');
    var splash = el.querySelector('.cp-splash');
    var progress = el.querySelector('.cp-progress');
    if (drip) drip.style.display = 'none';
    if (splash) splash.style.display = 'none';
    if (progress) progress.style.display = 'none';
  }

  /* Hold the curtain until the opening line-up can actually be painted.
     The splash exists to cover exactly this: the moment before the hero is
     ready. Lifting it on a timer while the five tins are still decoding is
     how the line-up flew in as empty boxes on a cold cache.
     ART_WAIT_MS is the ceiling — the tins are ~50KB and preloaded in the
     head, so on any normal visit this resolves before the choreography has
     finished and adds nothing at all. On a slow connection the splash holds
     a little longer, which is the right trade: a beat more curtain beats a
     line-up of blank rectangles. */
  var ART_WAIT_MS = 1200;

  function whenArtReady(cb) {
    var fired = false;
    function once() { if (!fired) { fired = true; cb(); } }
    setTimeout(once, ART_WAIT_MS);
    var p = window.CloudHeroArtReady;
    if (p && typeof p.then === 'function') p.then(once, once);
    else once();
  }

  function cleanup() {
    var loader = document.getElementById('cpLoader');
    document.body.classList.remove('cp-loading');
    document.body.classList.add('cp-ready');
    document.documentElement.style.overflow = '';
    window.dispatchEvent(new CustomEvent('loader:done'));
    if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
  }

  function runFull() {
    var elapsed = Date.now() - domReadyAt;
    var holdMs = Math.max(0, FULL_LIFT_AT - elapsed);

    setTimeout(function () {
      whenArtReady(function () {
        var loader = document.getElementById('cpLoader');
        if (loader) loader.classList.add('cp-lift');
        setTimeout(cleanup, FULL_MS - FULL_LIFT_AT);
      });
    }, holdMs);
  }

  function runCompressed() {
    markCompressed();
    var elapsed = Date.now() - domReadyAt;
    var holdMs = Math.max(0, COMPRESSED_LIFT_AT - elapsed);

    setTimeout(function () {
      whenArtReady(function () {
        var loader = document.getElementById('cpLoader');
        if (loader) loader.classList.add('cp-lift');
        setTimeout(cleanup, COMPRESSED_MS - COMPRESSED_LIFT_AT);
      });
    }, holdMs);
  }

  function runReduced() {
    setTimeout(function () {
      var loader = document.getElementById('cpLoader');
      if (loader) loader.classList.add('cp-hide');
      setTimeout(cleanup, 320);
    }, REDUCED_MS);
  }

  function start() {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch (e) { /* quota/private-mode safe */ }

    if (prefersReduce) return runReduced();
    if (compressed) return runCompressed();
    runFull();
  }

  // Start on `load` when that is soon, but never wait on it.
  //
  // This used to be `load` alone, which ties the splash to the LAST byte of
  // the page — and the homepage is 9.5MB on a first visit. On anything
  // slower than an office connection the splash sat there for twenty seconds
  // or more, and the opening line-up finally played to nobody. Which is
  // exactly the report: "the bucket animation isn't happening on first load".
  // It was happening, long after anyone was still watching.
  //
  // So: whichever comes first, `load` or a short beat after the document is
  // parsed. The splash is now bounded by its own choreography rather than by
  // the network.
  var begun = false;
  function begin() {
    if (begun) return;
    begun = true;
    start();
  }
  if (document.readyState === 'complete') {
    begin();
  } else {
    window.addEventListener('load', begin);
    var afterParse = function () { setTimeout(begin, 900); };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', afterParse, { once: true });
    } else {
      afterParse();
    }
  }

})();
