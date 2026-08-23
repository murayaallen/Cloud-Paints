// ============================================================
// CLOUD PAINTS — Hero intro flash
// The whole range bounces in once, left to right, then clears
// and hands the stage to the normal hero rotation.
//
// Deliberately carries no product names: twelve labels arriving
// at once read as noise. Naming belongs to the slides, where
// products come one at a time.
//
// Runs after `loader:done` and emits `hero:intro-done` when the
// stage is clear. hero-slides.js waits on that before starting,
// with its own fallback so the rotation can never be stranded.
// ============================================================

(function () {
  'use strict';

  var RANGE = [
    { s: 'weatherguard',  c: '#d92843' },
    { s: 'silk-vinyl',    c: '#ec4899' },
    { s: 'vinyl-matt',    c: '#3b5bdb' },
    { s: 'supermatt',     c: '#d92843' },
    { s: 'iris-economy',  c: '#fbbf24' },
    { s: 'rocketex',      c: '#3b5bdb' },
    { s: 'gloss-enamel',  c: '#1e3a8a' },
    { s: 'super-gloss',   c: '#3b5bdb' },
    { s: 'roof-paint',    c: '#d92843' },
    { s: 'road-marking',  c: '#4a5568' },
    { s: 'clear-varnish', c: '#d69e2e' },
    { s: 'turpentine',    c: '#d1d5db' }
  ];

  var OUT  = 'cubic-bezier(.2,.9,.3,1.32)';
  var SOFT = 'cubic-bezier(.25,.8,.35,1)';
  var FALL = 'cubic-bezier(.5,0,.9,.4)';
  var STAGGER = 46, FLY = 560, GAP_WIDE = 58, GAP_TIGHT = 34;

  var done = false;

  function finish(layer) {
    if (done) return;
    done = true;
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    window.dispatchEvent(new CustomEvent('hero:intro-done'));
  }

  function run() {
    var pour = document.querySelector('.lp-pour');
    // Reduced motion, or no stage to play on: hand straight over.
    if (!pour || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return finish(null);
    }

    var hero = document.querySelector('.lp-hero');
    if (hero) hero.classList.add('intro-running');

    var layer = document.createElement('div');
    layer.className = 'lp-intro';
    layer.setAttribute('aria-hidden', 'true');
    pour.appendChild(layer);

    var gap = window.innerWidth < 780 ? GAP_TIGHT : GAP_WIDE;
    var n = RANGE.length;
    var x0 = -(n - 1) * gap / 2;

    var items = RANGE.map(function (p) {
      var el = document.createElement('div');
      el.className = 'lp-intro-it';
      el.style.setProperty('--c', p.c);
      el.innerHTML =
        '<span class="lp-intro-pool"></span>' +
        '<span class="lp-intro-ring"></span>' +
        '<img src="images/buckets/intro/' + p.s + '.webp" alt="">';
      layer.appendChild(el);
      return el;
    });

    function tx(x) { return 'translateX(calc(-50% + ' + x + 'px))'; }

    items.forEach(function (el, i) {
      var x = x0 + i * gap, d = i * STAGGER;

      el.animate([
        { transform: tx(x + 420) + ' translateY(-16px) scale(.88) rotate(9deg)', opacity: 0 },
        { transform: tx(x) + ' translateY(-18px) scale(1.08) rotate(-2deg)', opacity: 1, offset: .68 },
        { transform: tx(x) + ' translateY(0) scale(1) rotate(0)', opacity: 1 }
      ], { duration: FLY, delay: d, easing: OUT, fill: 'both' });

      el.querySelector('img').animate([
        { transform: 'scale(1,1)' },
        { transform: 'scale(1.1,.88)', offset: .55 },
        { transform: 'scale(.97,1.04)', offset: .78 },
        { transform: 'scale(1,1)' }
      ], { duration: 300, delay: d + 400, easing: SOFT, fill: 'both' });

      el.querySelector('.lp-intro-pool').animate([
        { opacity: 0, transform: 'translateX(-50%) scale(.4)' },
        { opacity: .9, transform: 'translateX(-50%) scale(1.15)', offset: .35 },
        { opacity: .45, transform: 'translateX(-50%) scale(1)' }
      ], { duration: 480, delay: d + 390, easing: SOFT, fill: 'both' });

      el.querySelector('.lp-intro-ring').animate([
        { opacity: .8, transform: 'scale(.5)' },
        { opacity: 0, transform: 'scale(7,3.4)' }
      ], { duration: 520, delay: d + 410, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'both' });
    });

    var settled = (n - 1) * STAGGER + FLY;

    var sheen = document.createElement('span');
    sheen.className = 'lp-intro-sheen';
    layer.appendChild(sheen);
    sheen.animate([
      { transform: 'translateX(-40%) skewX(-12deg)', opacity: 0 },
      { opacity: .85, offset: .35 },
      { transform: 'translateX(330%) skewX(-12deg)', opacity: 0 }
    ], { duration: 700, delay: settled - 60, easing: 'cubic-bezier(.3,0,.4,1)', fill: 'both' });

    // Clean hand-off: the whole row drops away, *then* the first slide
    // arrives. No tin is carried over into the rotation.
    var clearAt = settled + 380;
    var lastOut = 0;

    setTimeout(function () {
      items.forEach(function (el, i) {
        var x = x0 + i * gap, d = (n - i) * 14;
        lastOut = Math.max(lastOut, d + 320);
        el.animate([
          { transform: tx(x), opacity: 1 },
          { transform: tx(x) + ' translateY(150px) scale(.8)', opacity: 0 }
        ], { duration: 320, delay: d, easing: FALL, fill: 'both' });
      });

      setTimeout(function () {
        if (hero) hero.classList.remove('intro-running');
        finish(layer);
      }, lastOut + 40);
    }, clearAt);

    // Belt and braces — never strand the rotation if a frame is dropped.
    setTimeout(function () {
      if (hero) hero.classList.remove('intro-running');
      finish(layer);
    }, clearAt + 1400);
  }

  function boot() {
    // Give the tins a moment to decode so the first ones do not pop in blank.
    var pending = RANGE.length;
    var started = false;
    function go() {
      if (started) return;
      started = true;
      run();
    }
    RANGE.forEach(function (p) {
      var im = new Image();
      im.onload = im.onerror = function () { if (--pending === 0) go(); };
      im.src = 'images/buckets/intro/' + p.s + '.webp';
    });
    setTimeout(go, 600);   // do not wait on a slow connection
  }

  if (document.body.classList.contains('cp-ready')) boot();
  else window.addEventListener('loader:done', boot, { once: true });
})();
