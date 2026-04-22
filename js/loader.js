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
  // Full sequence on every new tab/window load; compressed only on in-session page navigations
  var seenInSession = sessionStorage.getItem(SESSION_KEY) === '1';
  var compressed = seenInSession;

  // ---------- Markup -----------------------------------------
  function wordmarkHtml(text) {
    return text.split('').map(function (ch, i) {
      var c = ch === ' ' ? '\u00A0' : ch;
      return '<span style="--i:' + i + '">' + c + '</span>';
    }).join('');
  }

  var loaderHtml =
    '<div id="cpLoader" aria-hidden="true" role="status">' +
      '<div class="cp-stage">' +
        '<img class="cp-mark" src="images/logo.png" alt="Cloud Paints" width="96" height="96">' +
        '<div class="cp-wordmark" aria-label="Cloud Paints">' + wordmarkHtml(WORDMARK) + '</div>' +
        '<div class="cp-progress"><i></i></div>' +
      '</div>' +
    '</div>';

  function inject() {
    document.body.insertAdjacentHTML('afterbegin', loaderHtml);
    document.body.classList.add('cp-loading');
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

  var FULL_MS = 3400;
  var FULL_LIFT_AT = 2900;
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
