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

    // Wall overlay — recolour the canvas through the active room's mask.
    // Coalesced to one repaint per frame: the picker fires continuously
    // while dragging and the recolour touches every pixel.
    schedulePaint(hex);

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

  // Per-room pixel cache. Decoding the photo and the mask is the expensive
  // part and neither changes while the user drags the picker, so both are
  // read once per room and only the recolour loop runs per frame.
  var cache = null;   // { w, h, src:Uint8ClampedArray, alpha:Uint8Array, refL, out:ImageData }

  function buildCache() {
    if (!roomReady || !roomImg) return null;
    var w = roomImg.naturalWidth, h = roomImg.naturalHeight;
    if (!w || !h) return null;

    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var cx = c.getContext('2d', { willReadFrequently: true });
    cx.drawImage(roomImg, 0, 0, w, h);
    var src = cx.getImageData(0, 0, w, h);

    var alpha = new Uint8Array(w * h);
    if (maskImg && maskReady) {
      cx.clearRect(0, 0, w, h);
      cx.drawImage(maskImg, 0, 0, w, h);
      var md = cx.getImageData(0, 0, w, h).data;
      for (var i = 0, p = 3; i < alpha.length; i++, p += 4) alpha[i] = md[p];
    }

    // Mean wall luminance — the pivot the target colour is shaded around.
    var sum = 0, wsum = 0;
    for (var j = 0, q = 0; j < alpha.length; j++, q += 4) {
      var a = alpha[j];
      if (!a) continue;
      sum += a * (0.2126 * src.data[q] + 0.7152 * src.data[q + 1] + 0.0722 * src.data[q + 2]);
      wsum += a;
    }

    return {
      w: w, h: h,
      src: src.data,
      alpha: alpha,
      refL: wsum ? (sum / wsum) / 255 : 0.5,
      out: cx.createImageData(w, h),
    };
  }

  function applyRoom(idx) {
    var r = DATA.rooms[idx];
    if (!r) return;
    var img = document.getElementById('vsPreviewImg');
    if (img) { img.src = r.image; img.alt = r.label; }

    roomReady = false;
    maskReady = false;
    cache = null;

    function ready() {
      // Wait for both before caching, else refL is computed with no mask.
      if (!roomReady || (r.mask && !maskReady)) return;
      cache = buildCache();
      paintCanvas(currentHex());
    }

    roomImg = new Image();
    roomImg.onload = function () { roomReady = true; ready(); };
    roomImg.onerror = function () { console.warn('[Visualiser] room photo failed:', r.image); };
    roomImg.src = r.image;

    if (r.mask) {
      maskImg = new Image();
      maskImg.onload = function () { maskReady = true; ready(); };
      maskImg.onerror = function () {
        console.warn('[Visualiser] mask failed:', r.mask);
        maskReady = true; ready();     // fall back to the untouched photo
      };
      maskImg.src = r.mask;
    }
  }

  var paintQueued = false, pendingHex = null, paintRaf = 0, paintTimer = 0;

  // Coalesce repaints to one per frame — the picker fires continuously
  // while dragging and the recolour touches every pixel.
  //
  // A timer races the animation frame and whichever arrives first wins.
  // rAF alone is smoother but is not guaranteed to be serviced (hidden
  // tab, occluded window, headless), and if it never runs the canvas
  // silently stops tracking the picker.
  function schedulePaint(hex) {
    pendingHex = hex;
    if (paintQueued) return;
    paintQueued = true;

    var run = function () {
      if (!paintQueued) return;
      paintQueued = false;
      if (paintRaf) { cancelAnimationFrame(paintRaf); paintRaf = 0; }
      if (paintTimer) { clearTimeout(paintTimer); paintTimer = 0; }
      paintCanvas(pendingHex);
    };

    paintRaf = (window.requestAnimationFrame || function () { return 0; })(run);
    paintTimer = setTimeout(run, 32);
  }

  function paintCanvas(hex) {
    var canvas = document.getElementById('vsPaintCanvas');
    if (!canvas || !roomImg || !roomReady) return;
    var w = roomImg.naturalWidth, h = roomImg.naturalHeight;
    if (!w || !h) return;
    if (canvas.width  !== w) canvas.width  = w;
    if (canvas.height !== h) canvas.height = h;
    var ctx = canvas.getContext('2d');

    // Without a cache yet, show the untouched photo rather than nothing.
    if (!cache) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(roomImg, 0, 0, w, h);
      return;
    }

    // Recolour, per pixel.
    //
    // The old pipeline multiplied a flat fill over the photo. Multiply can
    // only ever darken, so light shades were impossible: asking for white
    // returned the wall unchanged, and half a paint range read as dirty.
    //
    // Instead: keep the photo's shading *relative to the wall's mean*, and
    // re-centre it on the chosen colour's own lightness. A wall lit at
    // refL becomes exactly the target colour; brighter and darker patches
    // keep their offset, so shadows, corners and light falloff survive.
    var src = cache.src, alpha = cache.alpha, out = cache.out, dst = out.data;
    var rgb = hexToRgb(hex) || [255, 255, 255];
    var tr = rgb[0], tg = rgb[1], tb = rgb[2];
    var targetL = (0.2126 * tr + 0.7152 * tg + 0.0722 * tb) / 255;
    var refL = cache.refL;
    var inv = 1 / Math.max(targetL, 0.004);

    for (var i = 0, p = 0; i < alpha.length; i++, p += 4) {
      var a = alpha[i];
      if (a === 0) {
        dst[p] = src[p]; dst[p+1] = src[p+1]; dst[p+2] = src[p+2]; dst[p+3] = 255;
        continue;
      }

      var sr = src[p], sg = src[p+1], sb = src[p+2];
      var L = (0.2126 * sr + 0.7152 * sg + 0.0722 * sb) / 255;
      var d = L - refL;

      var outL = targetL + d;
      if (outL < 0) outL = 0; else if (outL > 1) outL = 1;

      var k = outL * inv;
      var nr = tr * k, ng = tg * k, nb = tb * k;

      // Specular highlights (a gloss hotspot, sun on the wall) should stay
      // bright and neutral rather than take on full chroma, or they read as
      // flat paint. Above the shoulder, lift toward white.
      var hot = (d - 0.22) * 4;
      if (hot > 0) {
        if (hot > 1) hot = 1;
        var lift = d * 255;
        nr += (nr + lift - nr) * hot; ng += (ng + lift - ng) * hot; nb += (nb + lift - nb) * hot;
      }

      if (nr > 255) nr = 255; else if (nr < 0) nr = 0;
      if (ng > 255) ng = 255; else if (ng < 0) ng = 0;
      if (nb > 255) nb = 255; else if (nb < 0) nb = 0;

      if (a === 255) {
        dst[p] = nr; dst[p+1] = ng; dst[p+2] = nb;
      } else {
        var t = a / 255, it = 1 - t;
        dst[p]   = sr * it + nr * t;
        dst[p+1] = sg * it + ng * t;
        dst[p+2] = sb * it + nb * t;
      }
      dst[p+3] = 255;
    }

    ctx.putImageData(out, 0, 0);
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
  // Seed the initial colour from ?hex= in the URL — used when a user
  // clicks "Try it on a wall" on the Colour Collection page. The hex
  // can be passed with or without the leading '#' and in any case.
  function seedFromUrl() {
    try {
      var p = new URLSearchParams(location.search || '');
      var h = (p.get('hex') || '').replace(/^#/, '').trim();
      if (!/^[0-9a-f]{6}$/i.test(h)) return;
      var rgb = hexToRgb(h);
      if (!rgb) return;
      var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
      state.h = hsv.h; state.s = hsv.s; state.v = hsv.v;
    } catch (_) {}
  }

  function init() {
    seedFromUrl();
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
