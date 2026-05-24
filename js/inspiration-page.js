// ============================================================
// CLOUD PAINTS — Inspiration page controller
// Filter (room + mood) · masonry render · lightbox.
// ============================================================

(function () {
  'use strict';
  if (!window.CLOUD_INSPIRATION) return;

  var ROOMS = [
    { key: 'all',      label: 'All' },
    { key: 'living',   label: 'Living' },
    { key: 'bedroom',  label: 'Bedroom' },
    { key: 'kitchen',  label: 'Kitchen' },
    { key: 'bathroom', label: 'Bathroom' },
    { key: 'dining',   label: 'Dining' },
    { key: 'hallway',  label: 'Hallway' },
    { key: 'office',   label: 'Office' },
    { key: 'veranda',  label: 'Veranda' },
    { key: 'exterior', label: 'Exterior' },
  ];
  var MOODS = [
    { key: 'all',     label: 'All' },
    { key: 'warm',    label: 'Warm' },
    { key: 'cool',    label: 'Cool' },
    { key: 'neutral', label: 'Neutral' },
    { key: 'bold',    label: 'Bold' },
  ];

  var state = { room: 'all', mood: 'all' };

  function activeList() {
    return window.CLOUD_INSPIRATION.filter(function (p) {
      if (state.room !== 'all' && p.room !== state.room) return false;
      if (state.mood !== 'all' && p.mood !== state.mood) return false;
      return true;
    });
  }

  // Count helpers (skip empty filter groups)
  function roomCount(key) {
    if (key === 'all') return window.CLOUD_INSPIRATION.filter(function (p) { return state.mood === 'all' || p.mood === state.mood; }).length;
    return window.CLOUD_INSPIRATION.filter(function (p) {
      return p.room === key && (state.mood === 'all' || p.mood === state.mood);
    }).length;
  }
  function moodCount(key) {
    if (key === 'all') return window.CLOUD_INSPIRATION.filter(function (p) { return state.room === 'all' || p.room === state.room; }).length;
    return window.CLOUD_INSPIRATION.filter(function (p) {
      return p.mood === key && (state.room === 'all' || p.room === state.room);
    }).length;
  }

  function pillHtml(opt, activeKey, count) {
    var on = opt.key === activeKey ? ' active' : '';
    var disabled = count === 0 && opt.key !== 'all' ? ' is-empty' : '';
    return (
      '<button type="button" class="in-pill' + on + disabled + '" data-key="' + opt.key + '" aria-pressed="' + (opt.key === activeKey) + '">' +
        '<span>' + opt.label + '</span>' +
      '</button>'
    );
  }

  function renderPills() {
    var roomEl = document.getElementById('inRoomPills');
    var moodEl = document.getElementById('inMoodPills');
    if (roomEl) roomEl.innerHTML = ROOMS.map(function (r) { return pillHtml(r, state.room, roomCount(r.key)); }).join('');
    if (moodEl) moodEl.innerHTML = MOODS.map(function (m) { return pillHtml(m, state.mood, moodCount(m.key)); }).join('');
  }

  function tileHtml(p, i) {
    return (
      '<figure class="in-tile in-tile--' + p.aspect + '" data-slug="' + p.slug + '"' +
        ' style="--accent:' + p.accent + ';transition-delay:' + Math.min(i * 50, 600) + 'ms;">' +
        '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy">' +
        '<figcaption>' +
          '<span class="t">' + p.title + '</span>' +
          '<span class="r">' + (p.room === 'exterior' ? 'Exterior' : (p.room.charAt(0).toUpperCase() + p.room.slice(1))) + '</span>' +
        '</figcaption>' +
      '</figure>'
    );
  }

  function renderGrid() {
    var grid = document.getElementById('inGrid');
    var count = document.getElementById('inCount');
    if (!grid) return;

    var list = activeList();
    if (count) count.textContent = '';

    if (!list.length) {
      grid.innerHTML = '<div class="in-empty">No spaces match that combination yet.</div>';
      return;
    }
    grid.innerHTML = list.map(tileHtml).join('');

    // Reveal on enter
    var tiles = grid.querySelectorAll('.in-tile');
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.10 });
      tiles.forEach(function (el) { io.observe(el); });
    } else {
      tiles.forEach(function (el) { el.classList.add('is-in'); });
    }

    // Open lightbox on tap
    tiles.forEach(function (el) {
      el.addEventListener('click', function () { openLightbox(el.getAttribute('data-slug')); });
    });
  }

  // ----------------------------------------------------------
  // Lightbox
  // ----------------------------------------------------------
  function buildLightbox() {
    if (document.getElementById('inLightbox')) return;
    var lb = document.createElement('div');
    lb.id = 'inLightbox';
    lb.className = 'in-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-hidden', 'true');
    lb.innerHTML =
      '<div class="in-lb-backdrop" data-close></div>' +
      '<button class="in-lb-close" type="button" data-close aria-label="Close">' +
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 6l12 12M6 18L18 6"/></svg>' +
      '</button>' +
      '<button class="in-lb-prev" type="button" data-nav="-1" aria-label="Previous">' +
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>' +
      '</button>' +
      '<button class="in-lb-next" type="button" data-nav="1" aria-label="Next">' +
        '<svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>' +
      '</button>' +
      '<figure class="in-lb-figure">' +
        '<img id="inLbImg" src="" alt="">' +
        '<figcaption id="inLbCaption"></figcaption>' +
      '</figure>';
    document.body.appendChild(lb);

    lb.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) return closeLightbox();
      var nav = e.target.closest('[data-nav]');
      if (nav) navLightbox(parseInt(nav.getAttribute('data-nav'), 10));
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') navLightbox(1);
      if (e.key === 'ArrowLeft') navLightbox(-1);
    });
  }

  var lbList = [], lbIndex = 0;

  function openLightbox(slug) {
    buildLightbox();
    lbList = activeList();
    lbIndex = Math.max(0, lbList.findIndex(function (p) { return p.slug === slug; }));
    paintLightbox();
    var lb = document.getElementById('inLightbox');
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function paintLightbox() {
    var p = lbList[lbIndex]; if (!p) return;
    document.getElementById('inLbImg').src = p.image;
    document.getElementById('inLbImg').alt = p.title;
    document.getElementById('inLbCaption').innerHTML =
      '<span class="t">' + p.title + '</span>' +
      '<span class="r">' + (p.room === 'exterior' ? 'Exterior' : (p.room.charAt(0).toUpperCase() + p.room.slice(1))) +
      ' · ' + (p.mood.charAt(0).toUpperCase() + p.mood.slice(1)) + '</span>';
  }
  function navLightbox(dir) {
    if (!lbList.length) return;
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
    paintLightbox();
  }
  function closeLightbox() {
    var lb = document.getElementById('inLightbox');
    if (!lb) return;
    lb.classList.remove('is-open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // ----------------------------------------------------------
  function init() {
    var roomEl = document.getElementById('inRoomPills');
    var moodEl = document.getElementById('inMoodPills');
    renderPills();
    renderGrid();

    var heroCount = document.getElementById('inHeroCount');
    if (heroCount) heroCount.textContent = window.CLOUD_INSPIRATION.length;

    function onPillClick(e) {
      var btn = e.target.closest('.in-pill');
      if (!btn) return;
      var key = btn.getAttribute('data-key');
      var which = e.currentTarget.id === 'inRoomPills' ? 'room' : 'mood';
      if (state[which] === key) return;
      state[which] = key;
      renderPills();
      renderGrid();
    }
    if (roomEl) roomEl.addEventListener('click', onPillClick);
    if (moodEl) moodEl.addEventListener('click', onPillClick);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
