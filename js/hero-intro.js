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

  // The five main lines — the products with real printed labels. The full
  // range flashing past was too many objects to read at this size.
  var RANGE = [
    { s: 'weatherguard', c: '#d92843' },
    { s: 'silk-vinyl',   c: '#ec4899' },
    { s: 'vinyl-matt',   c: '#3b5bdb' },
    { s: 'supermatt',    c: '#d92843' },
    { s: 'iris-economy', c: '#fbbf24' }
  ];

  var OUT  = 'cubic-bezier(.2,.9,.3,1.32)';
  var SOFT = 'cubic-bezier(.25,.8,.35,1)';
  var FALL = 'cubic-bezier(.5,0,.9,.4)';
  var STAGGER = 105, FLY = 700, GAP_WIDE = 108, GAP_TIGHT = 62;

  var done = false, cleared = false, exposed = null;

  function finish() {
    if (done) return;
    done = true;
    window.dispatchEvent(new CustomEvent('hero:intro-done'));
  }

  function run() {
    var pour = document.querySelector('.lp-pour');
    if (!pour) return finish();

    // Reduced motion used to skip this entirely, which threw the content
    // away along with the movement: anyone with Reduce Motion on — a normal
    // OS setting, not an edge case — got an empty stage where the range
    // should be. The preference is about motion, so the line-up is still
    // built and still held; it simply arrives in place instead of flying in,
    // and leaves on a fade instead of a fall.
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var hero = document.querySelector('.lp-hero');
    if (hero) hero.classList.add('intro-running');

    var layer = document.createElement('div');
    layer.className = 'lp-intro';
    layer.setAttribute('aria-hidden', 'true');
    pour.appendChild(layer);

    var n = RANGE.length;
    var gap = window.innerWidth < 780 ? GAP_TIGHT : GAP_WIDE;
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

    // Fit the row to the column. The tins are different widths and the
    // column is fluid, so a fixed gap overflows at some sizes and leaves a
    // gappy row at others — measure, then divide up what is actually there.
    function fit() {
      var avail = (pour.clientWidth || 520) * 0.94;
      var widest = 0;
      items.forEach(function (el) {
        var w = el.getBoundingClientRect().width;
        if (w > widest) widest = w;
      });
      if (!widest) widest = 120;
      var room = avail - widest;
      var maxGap = window.innerWidth < 780 ? GAP_TIGHT : GAP_WIDE;
      gap = Math.max(18, Math.min(maxGap, room / (n - 1)));
      x0 = -(n - 1) * gap / 2;
    }
    fit();

    items.forEach(function (el, i) {
      var x = x0 + i * gap, d = i * STAGGER;

      if (still) {
        // Final resting state, drawn directly. No flight, no squash, no
        // pool, no ring — every one of those is motion.
        el.style.transform = tx(x);
        el.style.opacity = '1';
        return;
      }

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
      ], { duration: 340, delay: d + 505, easing: SOFT, fill: 'both' });

      el.querySelector('.lp-intro-pool').animate([
        { opacity: 0, transform: 'translateX(-50%) scale(.4)' },
        { opacity: .9, transform: 'translateX(-50%) scale(1.15)', offset: .35 },
        { opacity: .45, transform: 'translateX(-50%) scale(1)' }
      ], { duration: 500, delay: d + 490, easing: SOFT, fill: 'both' });

      el.querySelector('.lp-intro-ring').animate([
        { opacity: .8, transform: 'scale(.5)' },
        { opacity: 0, transform: 'scale(7,3.4)' }
      ], { duration: 560, delay: d + 505, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'both' });
    });

    var settled = still ? 0 : (n - 1) * STAGGER + FLY;

    // The line-up *is* the brand stage now — the logo lockup it replaced
    // used to hold this slot. So it stays put once landed, and only clears
    // when the rotation leaves slide 0 for the first product.
    exposed = {
      clear: function () {
        if (cleared) return;
        cleared = true;
        items.forEach(function (el, i) {
          var x = x0 + i * gap;
          if (still) {
            // A fade is a change of opacity, not of position — it is the one
            // exit that reduced motion still allows.
            el.animate([{ opacity: 1 }, { opacity: 0 }],
              { duration: 260, easing: SOFT, fill: 'both' });
            return;
          }
          el.animate([
            { transform: tx(x), opacity: 1 },
            { transform: tx(x) + ' translateY(150px) scale(.8)', opacity: 0 }
          ], { duration: 420, delay: (n - i) * 34, easing: FALL, fill: 'both' });
        });
        setTimeout(function () {
          if (hero) hero.classList.remove('intro-running');
          if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
        }, still ? 300 : 420 + n * 34 + 60);
      }
    };
    window.CloudHeroIntro = exposed;

    // Landed and holding — the rotation may start its clock now.
    setTimeout(function () { finish(null); }, settled + 200);
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
