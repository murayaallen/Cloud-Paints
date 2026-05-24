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
        '<img class="cp-mark" src="images/logo-mark.png" alt="Cloud Paints" width="1140" height="968">' +
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

  var FULL_MS = 5300;
  var FULL_LIFT_AT = 4800;
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
      var loader = document.getElementById('cpLoader');
      if (loader) loader.classList.add('cp-lift');
      setTimeout(cleanup, FULL_MS - FULL_LIFT_AT);
    }, holdMs);
  }

  function runCompressed() {
    markCompressed();
    var elapsed = Date.now() - domReadyAt;
    var holdMs = Math.max(0, COMPRESSED_LIFT_AT - elapsed);

    setTimeout(function () {
      var loader = document.getElementById('cpLoader');
      if (loader) loader.classList.add('cp-lift');
      setTimeout(cleanup, COMPRESSED_MS - COMPRESSED_LIFT_AT);
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

  // Fire after resources load so motion.js boots on a settled page
  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start);
  }

})();
