// ============================================================
// CLOUD PAINTS — Visualiser controller (unlimited colour)
// HSV picker + popular-shades rail + room cycling.
// The factory mixes any colour, so the picker is full-range.
// ============================================================

(function () {
  'use strict';
  if (!window.CLOUD_VISUALISER) return;

  var DATA = window.CLOUD_VISUALISER;
  var state = {
    roomIdx: 0,
    h: 220,  // 0..360
    s: 70,   // 0..100
    v: 50,   // 0..100
    matchedName: 'Rift Cobalt',
  };

  // ----------------------------------------------------------
  // Colour-space conversions
  // ----------------------------------------------------------
  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function hsvToRgb(h, s, v) {
    s /= 100; v /= 100;
    var c = v * s;
    var hh = (h % 360) / 60;
    var x = c * (1 - Math.abs(hh % 2 - 1));
    var r=0, g=0, b=0;
    if      (hh < 1) { r=c; g=x; }
    else if (hh < 2) { r=x; g=c; }
    else if (hh < 3) { g=c; b=x; }
    else if (hh < 4) { g=x; b=c; }
    else if (hh < 5) { r=x; b=c; }
    else             { r=c; b=x; }
    var m = v - c;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var d = max - min, h = 0;
    var s = max === 0 ? 0 : d / max;
    var v = max;
    if (d !== 0) {
      if (max === r)      h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else                h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: h, s: s * 100, v: v * 100 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function (n) {
      var s = n.toString(16); return s.length === 1 ? '0' + s : s;
    }).join('').toUpperCase();
  }

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '').trim();
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }

  function currentHex() {
    var rgb = hsvToRgb(state.h, state.s, state.v);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  }

  // ----------------------------------------------------------
  // Closest quick-pick match (for naming custom colours)
  // ----------------------------------------------------------
  function nearestQuickPick(hex) {
    var rgb = hexToRgb(hex); if (!rgb) return null;
    var best = null, bestD = Infinity;
    DATA.quickPicks.forEach(function (p) {
      var pRgb = hexToRgb(p.hex);
      if (!pRgb) return;
      var d = Math.pow(rgb[0]-pRgb[0],2) + Math.pow(rgb[1]-pRgb[1],2) + Math.pow(rgb[2]-pRgb[2],2);
      if (d < bestD) { bestD = d; best = p; }
    });
    return best;
  }

  // ----------------------------------------------------------
  // Render — push state to all controls + the wall overlay
  // ----------------------------------------------------------
  function render() {
    var hex = currentHex();
    var nearest = nearestQuickPick(hex);
    // Exact name when within tight tolerance, else "Custom Mix"
    var nearestRgb = nearest ? hexToRgb(nearest.hex) : null;
    var thisRgb = hexToRgb(hex);
    var d = nearestRgb ? Math.sqrt(
      Math.pow(thisRgb[0]-nearestRgb[0],2) +
      Math.pow(thisRgb[1]-nearestRgb[1],2) +
      Math.pow(thisRgb[2]-nearestRgb[2],2)
    ) : 999;
    state.matchedName = (d < 12 && nearest) ? nearest.name : 'Custom Mix';

    // Wall overlay — paint the canvas with the current colour through
    // the active room's mask. Uses real pixel alpha so no CSS mask
    // quirks. paintCanvas() is a no-op until the mask Image has loaded.
    paintCanvas(hex);

    // SV canvas hue base
    var svCanvas = document.getElementById('vsSVCanvas');
    if (svCanvas) svCanvas.style.setProperty('--hue-color', 'hsl(' + state.h.toFixed(1) + ', 100%, 50%)');

    // SV cursor
    var svCursor = document.getElementById('vsSVCursor');
    if (svCursor) {
      svCursor.style.left = state.s + '%';
      svCursor.style.top = (100 - state.v) + '%';
      svCursor.style.background = hex;
    }

    // Hue cursor
    var hueCursor = document.getElementById('vsHueCursor');
    if (hueCursor) {
      hueCursor.style.left = (state.h / 360 * 100) + '%';
      hueCursor.style.background = 'hsl(' + state.h.toFixed(1) + ', 100%, 50%)';
    }

    // Hex input
    var hexInput = document.getElementById('vsHexInput');
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;

    // Active card
    var card = document.getElementById('vsActiveCard');
    if (card) {
      var waMsg = 'Hi Cloud Paints, I\'d like to order this colour: ' + state.matchedName + ' (' + hex + ').';
      card.innerHTML =
        '<div class="vs-active-chip" style="background:' + hex + '"></div>' +
        '<div class="vs-active-meta">' +
          '<div class="vs-active-name">' + state.matchedName + '</div>' +
          '<div class="vs-active-code">' + hex + '</div>' +
          '<a class="vs-active-cta" target="_blank" rel="noopener" href="https://wa.me/254741405481?text=' +
            encodeURIComponent(waMsg) + '">Order this colour →</a>' +
        '</div>';
    }

    // Quick-pick active highlight
    document.querySelectorAll('.vs-quick-chip').forEach(function (b) {
      var match = (nearest && b.getAttribute('data-hex') === nearest.hex && d < 12);
      b.classList.toggle('is-active', !!match);
    });
  }

  // ----------------------------------------------------------
  // Drag / click on the SV picker and hue slider
  // ----------------------------------------------------------
  function attachPicker(el, handler) {
    var dragging = false;
    function start(e) {
      dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      handler(e);
    }
    function move(e) { if (dragging) handler(e); }
    function end(e)  { dragging = false; try { el.releasePointerCapture(e.pointerId); } catch (_) {} }
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function pickSV(e) {
    var el = document.getElementById('vsSVCanvas');
    var rect = el.getBoundingClientRect();
    var x = clamp(e.clientX - rect.left, 0, rect.width);
    var y = clamp(e.clientY - rect.top,  0, rect.height);
    state.s = (x / rect.width) * 100;
    state.v = 100 - (y / rect.height) * 100;
    render();
  }
  function pickHue(e) {
    var el = document.getElementById('vsHueSlider');
    var rect = el.getBoundingClientRect();
    var x = clamp(e.clientX - rect.left, 0, rect.width);
    state.h = (x / rect.width) * 360;
    render();
  }

  // ----------------------------------------------------------
  // Hex input + quick-picks + room cycling
  // ----------------------------------------------------------
  function bindHexInput() {
    var inp = document.getElementById('vsHexInput');
    if (!inp) return;
    inp.addEventListener('input', function () {
      var raw = inp.value.trim();
      var rgb = hexToRgb(raw);
      if (!rgb) return;
      var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
      render();
    });
    var copyBtn = document.getElementById('vsHexCopy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        navigator.clipboard && navigator.clipboard.writeText(currentHex());
        copyBtn.textContent = 'Copied';
        setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1400);
      });
    }
  }

  function renderQuickPicks() {
    var grid = document.getElementById('vsQuickGrid');
    if (!grid) return;
    grid.innerHTML = DATA.quickPicks.map(function (p) {
      return (
        '<button class="vs-quick-chip" type="button" data-hex="' + p.hex + '" data-name="' + p.name + '" ' +
          'style="--c:' + p.hex + '" title="' + p.name + ' · ' + p.hex + '">' +
          '<span class="vs-quick-chip-swatch"></span>' +
          '<span class="vs-quick-chip-name">' + p.name + '</span>' +
        '</button>'
      );
    }).join('');
    grid.addEventListener('click', function (e) {
      var b = e.target.closest('.vs-quick-chip');
      if (!b) return;
      var hex = b.getAttribute('data-hex');
      var rgb = hexToRgb(hex); if (!rgb) return;
      var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
      render();
    });
  }

  // Cached room photo + mask image (one set per room) — loaded lazily.
  // The canvas paints the FULL composite: room photo as base, then a
  // colour-multiplied layer clipped to the mask. No CSS blend modes,
  // no mask-image — every pixel is computed in 2D context, so there
  // are no browser quirks to fight.
  var roomImg = null, roomReady = false;
  var maskImg = null, maskReady = false;

  function applyRoom(idx) {
    var r = DATA.rooms[idx];
    if (!r) return;
    var img = document.getElementById('vsPreviewImg');
    if (img) { img.src = r.image; img.alt = r.label; }

    roomReady = false;
    maskReady = false;

    roomImg = new Image();
    roomImg.onload = function () { roomReady = true; paintCanvas(currentHex()); };
    roomImg.onerror = function () { console.warn('[Visualiser] room photo failed:', r.image); };
    roomImg.src = r.image;

    if (r.mask) {
      maskImg = new Image();
      maskImg.onload = function () { maskReady = true; paintCanvas(currentHex()); };
      maskImg.onerror = function () { console.warn('[Visualiser] mask failed:', r.mask); };
      maskImg.src = r.mask;
    }
  }

  function paintCanvas(hex) {
    var canvas = document.getElementById('vsPaintCanvas');
    if (!canvas || !roomImg || !roomReady) return;
    var w = roomImg.naturalWidth, h = roomImg.naturalHeight;
    if (!w || !h) return;
    if (canvas.width  !== w) canvas.width  = w;
    if (canvas.height !== h) canvas.height = h;
    var ctx = canvas.getContext('2d');

    // 1) Base — the room photo, full opacity, no blend mode.
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(roomImg, 0, 0, w, h);

    // 2) Wall colour — build the tint layer on an off-screen canvas:
    //    draw mask (alpha = wall grade), then source-in fill with hex.
    if (maskImg && maskReady) {
      var tint = document.createElement('canvas');
      tint.width = w; tint.height = h;
      var tctx = tint.getContext('2d');
      tctx.drawImage(maskImg, 0, 0, w, h);
      tctx.globalCompositeOperation = 'source-in';
      tctx.fillStyle = hex;
      tctx.fillRect(0, 0, w, h);

      // 3) Multiply that tint back onto the room photo, then layer a
      //    softer 'color' pass for hue transfer that keeps shadows.
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.88;
      ctx.drawImage(tint, 0, 0);
      ctx.globalCompositeOperation = 'color';
      ctx.globalAlpha = 0.45;
      ctx.drawImage(tint, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function renderRooms() {
    var strip = document.getElementById('vsRoomStrip');
    if (!strip) return;
    strip.innerHTML = DATA.rooms.map(function (r, i) {
      var on = i === state.roomIdx ? ' is-active' : '';
      return (
        '<button type="button" class="vs-room-chip' + on + '" data-room="' + i + '" role="tab" aria-selected="' + (i === state.roomIdx) + '">' +
          '<img src="' + r.image + '" alt="' + r.label + '" loading="lazy">' +
          '<span>' + r.label + '</span>' +
        '</button>'
      );
    }).join('');
    strip.addEventListener('click', function (e) {
      var btn = e.target.closest('.vs-room-chip');
      if (!btn) return;
      var i = parseInt(btn.getAttribute('data-room'), 10);
      if (i === state.roomIdx) return;
      state.roomIdx = i;
      applyRoom(i);
      strip.querySelectorAll('.vs-room-chip').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on);
      });
    });
    // Seed the initial room's mask too
    applyRoom(state.roomIdx);
  }

  // ----------------------------------------------------------
  function init() {
    renderRooms();
    renderQuickPicks();
    bindHexInput();
    attachPicker(document.getElementById('vsSVCanvas'),  pickSV);
    attachPicker(document.getElementById('vsHueSlider'), pickHue);
    render();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
