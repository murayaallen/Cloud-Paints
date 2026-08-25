// ============================================================
// CLOUD PAINTS — Why cards, rolled on
// Each card is covered by its accent colour, which rolls on from
// the left and off to the right, leaving the content behind. The
// numeral stamps as its card is uncovered.
//
// Runs once, when the section arrives. Nothing here loops.
// ============================================================

(function () {
  'use strict';

  var ON = 340, HOLD = 70, OFF = 400, STAGGER = 140;
  var SOFT = 'cubic-bezier(.25,.8,.35,1)';

  function paint(section) {
    var cards = section.querySelectorAll('.lp-why-card');
    if (!cards.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cards.forEach(function (c) { c.classList.add('painted'); });
      return;
    }

    section.classList.add('is-painting');

    cards.forEach(function (card, i) {
      var layer = card.querySelector('.lp-why-paint');
      var delay = i * STAGGER;
      if (!layer) { card.classList.add('painted'); return; }

      // roll on from the left
      layer.animate(
        [{ transform: 'scaleX(0)', transformOrigin: 'left center' },
         { transform: 'scaleX(1)', transformOrigin: 'left center' }],
        { duration: ON, delay: delay, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });

      // then off to the right, uncovering the card
      layer.animate(
        [{ transform: 'scaleX(1)', transformOrigin: 'right center' },
         { transform: 'scaleX(0)', transformOrigin: 'right center' }],
        { duration: OFF, delay: delay + ON + HOLD, easing: 'cubic-bezier(.5,0,.25,1)', fill: 'both' });

      // content appears under the departing roller
      var revealAt = delay + ON + HOLD + OFF * 0.35;
      setTimeout(function () { card.classList.add('painted'); }, revealAt);

      var num = card.querySelector('.lp-why-num');
      if (num) {
        num.animate(
          [{ transform: 'scale(1.5)', opacity: 0 },
           { transform: 'scale(.94)', opacity: 1, offset: .7 },
           { transform: 'scale(1)', opacity: 1 }],
          { duration: 420, delay: revealAt, easing: SOFT, fill: 'both' });
      }
      var head = card.querySelector('.lp-why-lead');
      if (head) {
        head.animate(
          [{ transform: 'translateY(12px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, delay: revealAt + 60, easing: SOFT, fill: 'both' });
      }
      var body = card.querySelector('p');
      if (body) {
        body.animate(
          [{ transform: 'translateY(10px)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, delay: revealAt + 130, easing: SOFT, fill: 'both' });
      }
    });
  }

  function init() {
    var section = document.querySelector('.lp-why');
    if (!section) return;

    var fired = false;
    function go() { if (fired) return; fired = true; paint(section); }

    if (!('IntersectionObserver' in window)) return go();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.disconnect();
        go();
      });
    }, { threshold: 0.22 });
    io.observe(section);

    setTimeout(go, 12000);   // never leave the cards blank
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
