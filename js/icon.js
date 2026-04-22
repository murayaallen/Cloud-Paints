// ============================================================
// CLOUD PAINTS — Icon helper (inline SVG, no external sprite)
// Usage: icon('roller')  ·  icon('cart', 20, 'nav-icon')
// All paths are inlined so icons render on file:// and any server.
// ============================================================

(function () {
  'use strict';

  var ICONS = {
    // Navigation / UI
    'menu':         '<path d="M4 7h16M4 12h16M4 17h16"/>',
    'close':        '<path d="M6 6l12 12M18 6L6 18"/>',
    'search':       '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    'chevron-right':'<path d="M9 6l6 6-6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'arrow-right':  '<path d="M4 12h16M14 6l6 6-6 6"/>',
    'arrow-up-right':'<path d="M6 18L18 6M8 6h10v10"/>',
    'sun':          '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    'moon':         '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"/>',
    'cart':         '<path d="M3 4h2.2l1.3 2M6.5 6h14l-2.2 8.5a1.5 1.5 0 0 1-1.5 1.1H9.2a1.5 1.5 0 0 1-1.5-1.1L5.5 4"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
    'plus':         '<path d="M12 5v14M5 12h14"/>',
    'minus':        '<path d="M5 12h14"/>',
    'trash':        '<path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M6 7l1 12.2A1.8 1.8 0 0 0 8.8 21h6.4a1.8 1.8 0 0 0 1.8-1.8L18 7M10 11v6M14 11v6"/>',
    'check':        '<path d="M5 12.5l4.5 4.5L19 7"/>',
    // Product / paint domain
    'roller':       '<rect x="3" y="4" width="16" height="5" rx="1.2"/><path d="M19 6.5h2M11 9v3M8.5 12h5a1 1 0 0 1 1 1v1.5"/><path d="M10 14.5h4l-.5 6a1 1 0 0 1-1 .9h-1a1 1 0 0 1-1-.9l-.5-6z"/>',
    'brush':        '<path d="M14.5 3.5l6 6-6.2 6.2a2 2 0 0 1-2.8 0l-3.2-3.2a2 2 0 0 1 0-2.8L14.5 3.5z"/><path d="M7.8 14.2l-3 3a2.3 2.3 0 0 0 3.3 3.3l3-3"/><path d="M5.5 20.5l-.9.9"/>',
    'spray':        '<rect x="8" y="8" width="8" height="13" rx="1.5"/><path d="M10 8V5h4v3M12 5V3"/><path d="M18 5h2M18 7.5h2.5M18 10h2M8 13h8M8 16.5h8"/>',
    'bucket':       '<path d="M4.5 7h15l-1.3 12.5a1.5 1.5 0 0 1-1.5 1.5H7.3a1.5 1.5 0 0 1-1.5-1.5L4.5 7z"/><path d="M4 7c0-1.5 3.6-2.5 8-2.5s8 1 8 2.5"/><path d="M7 3.5c1-.8 3-1.5 5-1.5s4 .7 5 1.5"/>',
    'drip':         '<path d="M12 3c0 5-5 7-5 11a5 5 0 0 0 10 0c0-4-5-6-5-11z"/>',
    'swatch':       '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    'palette':      '<path d="M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2s-.5-2 .5-2.5H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/><circle cx="17" cy="12" r="1"/>',
    'paint-chip':   '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 16.5h4"/>',
    'wall':         '<rect x="3" y="4" width="18" height="16"/><path d="M3 9h10M13 4v5M3 14.5h6M9 9v5.5M9 14.5v5.5M13 9v5.5M13 14.5h8M17 14.5V20"/>',
    'coverage':     '<rect x="3.5" y="3.5" width="17" height="17" rx="1"/><path d="M7 7h3M7 11h6M7 15h9"/>',
    // Specs
    'clock':        '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2.2"/>',
    'layers':       '<path d="M12 3l9 4.5-9 4.5-9-4.5 9-4.5z"/><path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5"/>',
    'droplet':      '<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/><path d="M9.5 14.5a3 3 0 0 0 2.5 2.5"/>',
    'thermometer':  '<path d="M14 4.5a2 2 0 0 0-4 0v10a4 4 0 1 0 4 0v-10z"/><path d="M12 9v6"/><circle cx="12" cy="17.5" r="1.2"/>',
    'shield':       '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2.2 2.2L15 10.5"/>',
    'leaf':         '<path d="M4 20c0-8 6-14 16-14 0 10-6 16-14 16-1 0-2-1-2-2z"/><path d="M4 20L14 10"/>',
    'flame':        '<path d="M12 3c0 4-4 5.5-4 10a6 6 0 0 0 12 0c0-3-2-4.5-3.5-6.5C13 9 14 5 12 3z"/><path d="M11.5 14a2.5 2.5 0 0 0 1.5 4"/>',
    // Social / contact
    'whatsapp':     '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.5l-4.5 1z"/><path d="M9 9.5c.3-.5.6-.6 1-.5.3.1.6.8 1 1.8.2.4 0 .7-.3 1-.3.3-.3.5-.1.8A5 5 0 0 0 13 15c.3.2.6.2.9-.1l.6-.7c.3-.3.5-.3.8-.1l1.7.9c.3.2.4.4.3.7-.2.8-1 1.5-1.8 1.6-.6.1-1.4.2-4-1a8.5 8.5 0 0 1-3.5-3.3c-.6-.9-.7-1.8-.7-2.3 0-.5.3-1 .7-1.3z"/>',
    'instagram':    '<rect x="3" y="3" width="18" height="18" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>',
    'facebook':     '<path d="M14 8h2.5V5H14a3 3 0 0 0-3 3v3H9v3h2v7h3v-7h2.3l.5-3H14V8.5a.5.5 0 0 1 .5-.5z"/>',
    'phone':        '<path d="M5 3.5h3l1.5 4.5L7.5 10a10.5 10.5 0 0 0 6.5 6.5L16 14l4.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5A15.5 15.5 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5z"/>',
    'mail':         '<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3.5 6l8.5 7 8.5-7"/>',
    'map-pin':      '<path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'
  };

  window.icon = function (name, size, className) {
    var s = size || 22;
    var cls = 'cp-icon' + (className ? ' ' + className : '');
    var paths = ICONS[name];
    if (!paths) {
      // Fallback: circle placeholder so layout doesn't break
      paths = '<circle cx="12" cy="12" r="8" opacity=".3"/>';
    }
    return (
      '<svg class="' + cls + '" width="' + s + '" height="' + s +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"' +
      ' aria-hidden="true">' + paths + '</svg>'
    );
  };

  // Legacy alias used by partials.js internally
  window.useIconInline = window.icon;

})();
