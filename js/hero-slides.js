// ============================================================
// CLOUD PAINTS — Hero product slideshow
// Cycles bucket PNGs while recolouring the pour column,
// drips and splatters to match each product.
// ============================================================

(function () {
  'use strict';

  var SLIDES = [
    { src: 'images/buckets/hero/weatherguard.png', color: '#d92843', name: 'Weatherguard' },
    { src: 'images/buckets/hero/silk-vinyl.png',   color: '#9b2ca8', name: 'Silk Vinyl' },
    { src: 'images/buckets/hero/super-gloss.png',  color: '#2547b8', name: 'Super Gloss' },
    { src: 'images/buckets/hero/rocketex.png',     color: '#1f4088', name: 'Rocketex Wallmaster' },
    { src: 'images/buckets/hero/gloss-enamel.png', color: '#1a56db', name: 'Gloss Enamel' },
    { src: 'images/buckets/hero/road-marking.png', color: '#d97706', name: 'Road Marking' },
    { src: 'images/buckets/hero/clear-varnish.png',color: '#b45309', name: 'Clear Varnish' },
    { src: 'images/buckets/hero/turpentine.png',   color: '#4b6a8a', name: 'Turpentine' },
    { src: 'images/buckets/hero/mockup-b.png',     color: '#c4870a', name: 'Premium Emulsion' },
    { src: 'images/buckets/hero/mockup-c.png',     color: '#166534', name: 'Exterior Paint' },
  ];

  var INTERVAL_MS  = 4500;   // time each slide shows
  var FADE_MS      = 700;    // crossfade duration (must match CSS transition)
  var PRELOAD_MS   = 600;    // start preloading next slide before switch

  var current = 0;
  var timer   = null;
  var busy    = false;

  // ---------- DOM refs (populated on DOMContentLoaded) ----------
  var pour, pourCol, imgA, imgB;

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return r + ',' + g + ',' + b;
  }

  function applyColor(color) {
    if (!pour) return;
    // CSS variable drives gradient + drip + splat via @property transition
    pour.style.setProperty('--hero-color', color);
    // Box-shadow glow can't animate via @property, set directly
    if (pourCol) {
      pourCol.style.boxShadow = '0 0 60px rgba(' + hexToRgb(color) + ',0.45)';
    }
  }

  function switchTo(index, instant) {
    if (busy && !instant) return;
    busy = true;

    var slide    = SLIDES[index];
    var inactive = imgA.classList.contains('hs-active') ? imgB : imgA;
    var active   = imgA.classList.contains('hs-active') ? imgA : imgB;

    // Preload then crossfade
    inactive.src = slide.src;
    function doSwitch() {
      applyColor(slide.color);
      inactive.classList.add('hs-active');
      active.classList.remove('hs-active');
      setTimeout(function () { busy = false; }, FADE_MS + 50);
    }

    if (inactive.complete && inactive.naturalWidth > 0) {
      doSwitch();
    } else {
      inactive.onload  = doSwitch;
      inactive.onerror = doSwitch; // still switch even if image fails
    }
  }

  function next() {
    current = (current + 1) % SLIDES.length;
    switchTo(current);
  }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, INTERVAL_MS);
  }

  // ---------- Preload all slide images silently ----------
  function preloadAll() {
    SLIDES.forEach(function (s, i) {
      if (i === 0) return; // already loaded as imgA src
      var img = new Image();
      img.src = s.src;
    });
  }

  // ---------- Boot ----------
  function init() {
    pour    = document.querySelector('.lp-pour');
    pourCol = document.querySelector('.lp-pour-col');
    var bucket = document.querySelector('.lp-hero-bucket');
    if (!pour || !bucket) return;

    // Find the existing two imgs
    var imgs = bucket.querySelectorAll('img');
    imgA = imgs[0];
    imgB = imgs[1];
    if (!imgA || !imgB) return;

    // Set initial state
    imgA.classList.add('hs-active');
    applyColor(SLIDES[0].color);

    // Wait for loader before starting
    function startSlides() {
      preloadAll();
      setTimeout(startTimer, INTERVAL_MS); // first switch after one full interval
    }

    if (document.body.classList.contains('cp-ready')) {
      startSlides();
    } else {
      window.addEventListener('loader:done', startSlides, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
