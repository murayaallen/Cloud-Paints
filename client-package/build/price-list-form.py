# ============================================================
# CLOUD PAINTS — the price list, with editable figures
# ============================================================
#     python build/price-list-form.py
#
# Takes the finished price list and lays a fillable form field over
# every price. The document is not redrawn: the ground, the plates,
# the tins, the rules and the type are the same objects in the same
# places. Only the figures become editable.
#
# Why fields rather than a new document: the design was signed off as
# it stands. Rebuilding it as something editable — Word, a spreadsheet,
# an HTML page — means rebuilding the design in a tool that cannot hold
# it, and the result looks like an approximation of the price list
# rather than the price list. A form field changes one number and
# leaves everything around it untouched.
#
# How the field is placed: the words on the page are read back with
# their coordinates, every "Kshs." is found, and the number sitting
# immediately after it on the same line is the field. The cell's own
# tint is sampled from a render of the page and used as the field
# background, so the field covers the original figure without leaving
# a pale box on a coloured card.
#
# What the client does with it: open in Acrobat Reader (free), click a
# number, type, save. No Node, no toolchain, no fonts to install.
#
# The figures are set in Inter Bold, the same face and weight the printed
# page uses. That is not the default: PyMuPDF will only accept four base-14
# names for a widget font — Cour, TiRo, Helv, ZaDb — and silently rewrites
# anything else to Helv, which is how the first version of this file ended
# up asking for Helvetica-Bold and getting Helvetica Regular. So the font is
# embedded by hand into the form's resource dictionary and every field's
# appearance is drawn here rather than left to the viewer.
#
# The font itself is instanced from the project's own Inter variable web
# font at weight 700 — see assets/fonts/inter-bold-subset.ttf. It carries
# the digits, the comma and the full stop, which is all a price needs.
#
# One thing to know before sending it:
#   · The source of truth is still build/prices.js. A number changed
#     here is changed in this file only; the next build will not know
#     about it and the flier will not agree with it.
#
#     python build/price-list-form.py --flatten
#         writes a second copy with the fields flattened to plain text,
#         for sending to a printer.
# ============================================================

import json
import os
import subprocess
import sys

try:
    import pymupdf
except ImportError:
    try:
        import fitz as pymupdf
    except ImportError:
        sys.exit('PyMuPDF is not installed.  pip install pymupdf')

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)
FONT = os.path.join(PKG, 'assets', 'fonts', 'inter-bold-subset.ttf')
SRC = os.path.join(PKG, 'pdf', '5-price-list', 'cloud-paints-price-list.pdf')
OUT = os.path.join(PKG, 'pdf', '5-price-list', 'cloud-paints-price-list-editable.pdf')
FLAT = os.path.join(PKG, 'pdf', '5-price-list', 'cloud-paints-price-list-filled.pdf')

FLATTEN = '--flatten' in sys.argv


def price_index():
    """Every figure the list should contain, in the order prices.js states
    them. Used only to check nothing was missed."""
    node = ("import { PRICE_LIST } from './build/prices.js';"
            "console.log(JSON.stringify(PRICE_LIST.flatMap(g => g.rows.flatMap(r =>"
            "  Object.entries(r.prices).map(([pack, v]) => [r.name, pack, v])))))")
    out = subprocess.run(['node', '--input-type=module', '-e', node],
                         cwd=PKG, capture_output=True, text=True, encoding='utf-8')
    if out.returncode:
        sys.exit('could not read prices.js:\n' + out.stderr)
    return json.loads(out.stdout)


def embed_font(doc):
    """Put Inter Bold in the form's resource dictionary and return the name
    the appearance streams refer to it by, its widths, and its metrics.

    Written by hand because PyMuPDF has no route to it: a widget may only
    name one of four base-14 fonts, and Document.insert_font puts a font in
    a page's resources rather than the form's. A simple TrueType font with
    WinAnsi encoding is enough here — every character a price contains is
    ASCII, so the appearance stream can hold the figure as plain text."""
    if not os.path.exists(FONT):
        return None
    from fontTools.ttLib import TTFont

    tt = TTFont(FONT)
    upem = tt['head'].unitsPerEm
    scale = 1000.0 / upem
    cmap = tt.getBestCmap()
    hmtx = tt['hmtx']
    widths = []
    for code in range(32, 256):
        g = cmap.get(code)
        widths.append(int(round(hmtx[g][0] * scale)) if g else 0)
    head, os2 = tt['head'], tt['OS/2']
    bbox = [int(round(v * scale)) for v in
            (head.xMin, head.yMin, head.xMax, head.yMax)]
    asc = os2.sTypoAscender * scale / 1000.0
    desc = os2.sTypoDescender * scale / 1000.0
    tt.close()

    data = open(FONT, 'rb').read()
    ff = doc.get_new_xref()
    doc.update_object(ff, '<< /Length1 %d >>' % len(data))
    doc.update_stream(ff, data, compress=True)

    fd = doc.get_new_xref()
    doc.update_object(fd, (
        '<< /Type /FontDescriptor /FontName /InterBold /Flags 32 '
        '/FontBBox [%d %d %d %d] /ItalicAngle 0 /Ascent %d /Descent %d '
        '/CapHeight %d /StemV 140 /FontFile2 %d 0 R >>'
    ) % (bbox[0], bbox[1], bbox[2], bbox[3],
         int(round(asc * 1000)), int(round(desc * 1000)),
         int(round(os2.sCapHeight * scale)) if hasattr(os2, 'sCapHeight') else 700,
         ff))

    fo = doc.get_new_xref()
    doc.update_object(fo, (
        '<< /Type /Font /Subtype /TrueType /BaseFont /InterBold '
        '/FirstChar 32 /LastChar 255 /Widths [%s] /FontDescriptor %d 0 R '
        '/Encoding /WinAnsiEncoding >>'
    ) % (' '.join(str(w) for w in widths), fd))

    cat = doc.pdf_catalog()
    dr = doc.get_new_xref()
    doc.update_object(dr, '<< /Font << /InterB %d 0 R >> >>' % fo)
    doc.xref_set_key(cat, 'AcroForm/DR', '%d 0 R' % dr)
    return {'font': fo, 'res': dr, 'widths': widths, 'asc': asc, 'desc': desc}


def draw_appearance(doc, wdg, fnt, meta):
    """Replace the widget's appearance with one drawn in Inter Bold.

    The viewer would rebuild it from /DA if asked to, and /DA is set for
    when it does — but only Acrobat honours /NeedAppearances reliably, and
    a printer opening this in anything else must not get a different face
    from the one on the page beside it. So the stream is written here."""
    # From the record kept at creation, not read back off the widget.
    # PyMuPDF normalises a widget on the way in — text_fontsize comes back
    # as 12 whatever it was set to, which is two points too big for a
    # three-pack cell and put the figure hard against its Kshs. prefix.
    size, (r, g, b), (br, bg_, bb), cover = meta[wdg.field_name]
    w, h = wdg.rect.width, wdg.rect.height
    txt = (wdg.field_value or '').replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')
    # Vertically centre the em box, then sit the baseline on it.
    base = (h - (fnt['asc'] - fnt['desc']) * size) / 2 - fnt['desc'] * size
    # The background covers the figure it replaces and no more. Painted
    # across the whole widget it covered the rule between one pack and the
    # next as well — the box runs to a point and a half short of the next
    # cell's Kshs., and the divider is inside that reach. A number typed
    # longer than the one it replaces runs past the paint onto the cell's
    # own tint, which is the colour the paint was sampled from, so nothing
    # shows.
    stream = (
        '/Tx BMC q %.4f %.4f %.4f rg 0 0 %.3f %.3f re f '
        'BT /InterB %.2f Tf %.4f %.4f %.4f rg %.3f %.3f Td (%s) Tj ET Q EMC'
    # 1.0, not 2.0. The box is drawn a point to the left of the span it
    # covers, so a 2pt inset put the figure a point right of where the page
    # has it and opened a gap after its Kshs. prefix.
    ) % (br, bg_, bb, cover, h, size, r, g, b, 1.0, base, txt)

    ap = doc.get_new_xref()
    doc.update_object(ap, (
        '<< /Type /XObject /Subtype /Form /BBox [0 0 %.3f %.3f] '
        '/Resources %d 0 R >>'
    ) % (w, h, fnt['res']))
    doc.update_stream(ap, stream.encode('latin-1'), compress=True)
    doc.xref_set_key(wdg.xref, 'AP/N', '%d 0 R' % ap)
    doc.xref_set_key(wdg.xref, 'DA',
                     '(%.4f %.4f %.4f rg /InterB %.2f Tf)' % (r, g, b, size))


def sample_bg(page, rect, pix, scale):
    """The cell's tint, taken from a pixel just right of the figure and
    clear of its glyphs. Each card is a different colour, so a fixed
    white would print a pale box on every coloured cell."""
    x = min(int((rect.x1 + 3) * scale), pix.width - 1)
    y = min(int(((rect.y0 + rect.y1) / 2) * scale), pix.height - 1)
    r, g, b = pix.pixel(x, y)[:3]
    return (r / 255, g / 255, b / 255)


def build():
    if not os.path.exists(SRC):
        sys.exit('No price list at %s — run render.mjs first' % SRC)

    wanted = price_index()
    doc = pymupdf.open(SRC)
    made = 0
    seen = []
    meta = {}

    for pno, page in enumerate(doc):
        scale = 3
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
        # Spans, not words. "Kshs.13,950" comes back as a single word, and the
        # prefix is set 3.8pt smaller than the figure, so splitting the word by
        # character count would put the field in the wrong place. As spans the
        # figure is its own object with its own box: prefix, full stop, number.
        prices, everything = [], []
        for blk in page.get_text('dict')['blocks']:
            for line in blk.get('lines', []):
                spans = line['spans']
                everything.extend(spans)
                joined = ''.join(sp['text'] for sp in spans)
                if 'Kshs' not in joined:
                    continue
                for sp in spans:
                    t = sp['text'].strip()
                    if t and t.replace(',', '').isdigit():
                        prices.append(sp)

        for sp in prices:
            text = sp['text'].strip()
            rect = pymupdf.Rect(*sp['bbox'])
            # Room to the right so a longer number is not clipped as it is
            # typed — but only as far as the next thing on that line. Fourteen
            # points flat reached into the neighbouring cell and the field's
            # own background painted out the K of its "Kshs.", so 2,750 read
            # as "shs.2,750" on every middle column.
            limit = rect.x1 + 14
            for other in everything:
                ox0, oy0, ox1, oy1 = other['bbox']
                overlaps = oy0 < rect.y1 and oy1 > rect.y0
                if overlaps and ox0 > rect.x1 - 0.5:
                    limit = min(limit, ox0 - 1.5)
            box = pymupdf.Rect(rect.x0 - 1, rect.y0 - 1.5,
                               max(limit, rect.x1 + 1), rect.y1 + 1.5)

            f = pymupdf.Widget()
            f.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
            name = 'price_p%d_%03d' % (pno + 1, made + 1)
            f.field_name = name
            f.field_value = text
            f.rect = box
            # text_font is left alone: PyMuPDF would rewrite anything but
            # Helv, Cour, TiRo or ZaDb back to Helv. The face is set below,
            # after the fields exist, by writing /DA and the appearance.
            # The span's own type size, not the height of its bounding box.
            # The box is the glyph extent — ascender to descender, about
            # 1.15 times the size — so measuring it set a 10.6pt figure in
            # 12.4pt type and pushed it against its Kshs. prefix. The
            # extraction hands us the real value; use it.
            size = round(sp['size'], 1)
            ink = (0.07, 0.08, 0.12)
            fill = sample_bg(page, rect, pix, scale)
            f.text_fontsize = size
            f.text_color = ink
            f.fill_color = fill
            f.border_width = 0
            f.field_flags = 0
            page.add_widget(f)
            meta[name] = (size, ink, fill, rect.width + 2)

            made += 1
            seen.append(text)

    fnt = embed_font(doc)
    if fnt:
        for page in doc:
            for wdg in page.widgets():
                draw_appearance(doc, wdg, fnt, meta)
        doc.xref_set_key(doc.pdf_catalog(), 'AcroForm/DA',
                         '(0.07 0.08 0.12 rg /InterB 10 Tf)')

    doc.save(OUT, garbage=3, deflate=True)

    # every figure prices.js states should have become a field
    want = [format(v, ',') for _, _, v in wanted if v]
    missing = [v for v in want if v not in seen]

    print('  %s' % OUT)
    print('  %d editable figures over %d pages' % (made, doc.page_count))
    print('  set in %s' % ('Inter Bold, embedded' if fnt
                           else 'Helvetica — %s is missing' % FONT))
    print('  prices.js states %d; not found on the page: %s'
          % (len(want), missing or 'none'))

    if FLATTEN:
        # bake() draws each widget's own appearance into the page content and
        # drops the field. That is all this needs now: the appearance is
        # already the right face at the right size in the right place, so
        # redrawing it as a free-text annotation — which is what this did
        # before, in Helvetica — would only put back the fault.
        d2 = pymupdf.open(OUT)
        d2.bake()
        d2.save(FLAT, garbage=3, deflate=True)
        d2.close()
        print('  %s  (fields flattened, for the printer)' % FLAT)

    doc.close()


if __name__ == '__main__':
    build()
