// ============================================================
// CLOUD PAINTS — Colour Mix widget (Phase 4)
// Two swatches cycle through a curated paint palette; the
// result bar shows a gradient blend and a creative colour name.
// DOM-only. Gracefully degrades if target nodes are absent.
// ============================================================

(function () {
  'use strict';

  var PALETTE = [
    { name: 'Weatherguard Red', hex: '#b8243a' },
    { name: 'Savanna Gold',     hex: '#e8a317' },
    { name: 'Rift Cobalt',      hex: '#1e3a8a' },
    { name: 'Kilifi Clay',      hex: '#c07551' },
    { name: 'Forest Thatch',    hex: '#166534' },
    { name: 'Mombasa Lime',     hex: '#9ec03a' },
    { name: 'Nairobi Dusk',     hex: '#5a4374' },
    { name: 'Bone Ivory',       hex: '#efe6d2' },
  ];

  // Generate a creative blend name from two colour names
  function blendName(a, b) {
    var aw = a.name.split(' ');
    var bw = b.name.split(' ');
    // first word of A + last word of B
    return aw[0] + ' ' + bw[bw.length - 1];
  }

  function init() {
    var stage = document.querySelector('[data-colormix]');
    if (!stage) return;

    var aIdx = 0, bIdx = 2;
    var aSw    = stage.querySelector('[data-mix-a]');
    var bSw    = stage.querySelector('[data-mix-b]');
    var aName  = stage.querySelector('[data-mix-a-name]');
    var bName  = stage.querySelector('[data-mix-b-name]');
    var aHex   = stage.querySelector('[data-mix-a-hex]');
    var bHex   = stage.querySelector('[data-mix-b-hex]');
    var bar    = document.querySelector('[data-mix-bar]');
    var barA   = bar && bar.querySelector('.a');
    var barB   = bar && bar.querySelector('.b');
    var barBlend = bar && bar.querySelector('.blend-center');
    var resName  = document.querySelector('[data-mix-name]');

    function render() {
      var a = PALETTE[aIdx % PALETTE.length];
      var b = PALETTE[bIdx % PALETTE.length];
      if (aSw)    aSw.style.setProperty('--sw', a.hex);
      if (bSw)    bSw.style.setProperty('--sw', b.hex);
      if (aName)  aName.textContent = a.name;
      if (bName)  bName.textContent = b.name;
      if (aHex)   aHex.textContent  = a.hex.toUpperCase();
      if (bHex)   bHex.textContent  = b.hex.toUpperCase();
      if (barA)   barA.style.background = a.hex;
      if (barB)   barB.style.background = b.hex;
      if (barBlend) barBlend.style.background = 'linear-gradient(90deg, ' + a.hex + ', ' + b.hex + ')';
      if (resName) resName.textContent = blendName(a, b);
    }

    function bump(which) {
      if (which === 'a') aIdx = (aIdx + 1) % PALETTE.length;
      else               bIdx = (bIdx + 1) % PALETTE.length;
      render();
    }

    if (aSw) aSw.addEventListener('click', function () { bump('a'); });
    if (bSw) bSw.addEventListener('click', function () { bump('b'); });

    [aSw, bSw].forEach(function (el, i) {
      if (!el) return;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Cycle paint colour ' + (i === 0 ? 'A' : 'B'));
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          bump(i === 0 ? 'a' : 'b');
        }
      });
    });

    render();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})();
