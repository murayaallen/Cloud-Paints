// ============================================================
// CLOUD PAINTS — section order on a phone
// ============================================================
// The landing page runs hero → why → about → walls → products on a
// wide screen, where the argument has room to build before the range
// arrives. On a phone that puts the two things a visitor actually came
// for — what we sell, and what it looks like on a real wall — four
// scrolls down.
//
// So on phones those two are hoisted to sit directly under the hero,
// in that order:
//
//     hero → products → Real Walls of Kenya → why → about → …
//
// Why a DOM move and not CSS `order`: these sections are direct
// children of <body>, and making body a flex container to reorder them
// would disturb the header, footer and cart drawer that partials.js
// injects alongside them.
//
// The move is exact and reversible. Each hoisted section leaves a
// comment node behind in its original position, so putting it back is
// a matter of returning it to its own marker rather than recalculating
// a sibling that may itself have moved. Crossing the breakpoint in
// either direction restores the right order.
// ============================================================

(function () {
  'use strict';

  var MOBILE = '(max-width: 900px)';

  // Listed in the order they should appear beneath the hero.
  var HOIST = ['#products', '.lp-walls'];

  function init() {
    // The marquee is a sibling that follows the hero section, so this
    // is the last node of the opening block — not something inside it.
    var anchor = document.querySelector('.lp-marquee-wrap') ||
                 document.querySelector('.lp-hero');
    if (!anchor) return;

    var items = [];
    HOIST.forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el || !el.parentNode) return;
      var mark = document.createComment(' mobile-order home: ' + sel + ' ');
      el.parentNode.insertBefore(mark, el);
      items.push({ el: el, mark: mark });
    });
    if (!items.length) return;

    var mq = window.matchMedia(MOBILE);
    var moved = false;

    function apply() {
      if (mq.matches && !moved) {
        var after = anchor;
        items.forEach(function (it) {
          after.insertAdjacentElement('afterend', it.el);
          after = it.el;          // keep the listed order, not reversed
        });
        moved = true;
      } else if (!mq.matches && moved) {
        items.forEach(function (it) {
          if (it.mark.parentNode) it.mark.parentNode.insertBefore(it.el, it.mark);
        });
        moved = false;
      }
    }

    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
