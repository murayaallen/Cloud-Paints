// ============================================================
// CLOUD PAINTS — Real Walls of Kenya
//
// 1. On phones the section moves up to sit directly under the hero.
//    Colour is the first thing worth showing on a small screen.
// 2. The tiles sweep in across the page, overshoot with a zoom, then
//    settle; each blinks in turn, and finally all of them blink once
//    together.
//
// The tiles carry no data-anim, so they render normally if this never
// runs — the animation is an enhancement, not a dependency.
// ============================================================

(function () {
  'use strict';

  var RUSH = 720;        // per-tile flight
  var STAGGER = 58;      // tight enough to read as one sweep
  var FROM = '64vw';     // travels most of the page width

  var SETTLE_PAUSE = 260; // beat before the blinks start
  var BLINK = 190;        // one tile's blink
  var BLINK_STAGGER = 72; // sequential blink spacing
  var BEFORE_ALL = 340;   // beat before the full blink
  var ALL_BLINK = 300;    // everyone at once

  var MOBILE = '(max-width: 900px)';

  // ---------- 1. mobile placement ----------------------------
  function placement() {
    var walls = document.querySelector('.lp-walls');
    if (!walls) return;

    // Remember where it lives on desktop so the move is reversible.
    var home = walls.nextElementSibling;
    var parent = walls.parentNode;
    var afterHero = document.querySelector('.lp-marquee-wrap') ||
                    document.querySelector('.lp-hero');
    if (!afterHero) return;

    var mq = window.matchMedia(MOBILE);
    var moved = false;

    function apply() {
      if (mq.matches && !moved) {
        afterHero.insertAdjacentElement('afterend', walls);
        moved = true;
      } else if (!mq.matches && moved) {
        if (home && home.parentNode === parent) parent.insertBefore(walls, home);
        else parent.appendChild(walls);
        moved = false;
      }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  // ---------- 2. rush, then blink ----------------------------
  function rush(strip) {
    var tiles = strip.querySelectorAll('.lp-wall');
    if (!tiles.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tiles.forEach(function (el) { el.style.opacity = 1; });
      return;
    }

    var n = tiles.length;

    tiles.forEach(function (el, i) {
      el.style.willChange = 'transform, opacity';
      el.animate([
        { transform: 'translateX(' + FROM + ') scale(.82)', opacity: 0, offset: 0 },
        // arrives and overshoots — the zoom
        { transform: 'translateX(0) scale(1.13)', opacity: 1, offset: .74 },
        // eases back down to rest
        { transform: 'translateX(0) scale(.985)', opacity: 1, offset: .89 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: 1 }
      ], {
        duration: RUSH,
        delay: i * STAGGER,
        easing: 'cubic-bezier(.16,.86,.26,1)',
        fill: 'both'
      });
    });

    // All tiles have landed once the last one finishes its flight.
    var landed = (n - 1) * STAGGER + RUSH;

    // Each tile blinks in turn, left to right.
    var seqStart = landed + SETTLE_PAUSE;
    tiles.forEach(function (el, i) {
      el.animate([
        { opacity: 1, offset: 0 },
        { opacity: .12, offset: .45 },
        { opacity: 1, offset: 1 }
      ], {
        duration: BLINK,
        delay: seqStart + i * BLINK_STAGGER,
        easing: 'steps(1, end)',
        fill: 'none'
      });
    });

    // Then the whole strip blinks once, together.
    var allStart = seqStart + (n - 1) * BLINK_STAGGER + BLINK + BEFORE_ALL;
    tiles.forEach(function (el) {
      el.animate([
        { opacity: 1, offset: 0 },
        { opacity: .08, offset: .4 },
        { opacity: 1, offset: 1 }
      ], {
        duration: ALL_BLINK,
        delay: allStart,
        easing: 'steps(1, end)',
        fill: 'none'
      });
    });

    // Release the compositor layers once everything has finished.
    setTimeout(function () {
      tiles.forEach(function (el) { el.style.willChange = 'auto'; });
    }, allStart + ALL_BLINK + 120);
  }

  function init() {
    placement();

    var strip = document.getElementById('lpWallsStrip');
    if (!strip) return;

    // Hold them out of sight until the sweep starts, but only once we know
    // the script is alive — otherwise a failure would leave a blank strip.
    var tiles = strip.querySelectorAll('.lp-wall');
    tiles.forEach(function (el) { el.style.opacity = '0'; });

    var fired = false;
    function go() {
      if (fired) return;
      fired = true;
      rush(strip);
    }

    if (!('IntersectionObserver' in window)) return go();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        go();
      });
    }, { threshold: 0.28 });
    io.observe(strip);

    // If the strip is already in view on load the observer fires straight
    // away; this only covers the case where it never does.
    setTimeout(go, 9000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
