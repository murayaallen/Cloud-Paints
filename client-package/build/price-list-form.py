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
# Two things to know before sending it:
#   · Form fields render in Helvetica, not Inter. At these sizes the
#     difference is slight but it is there, and it shows most on the
#     figures that are not edited. Flatten before printing to bake the
#     values in — see --flatten below.
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
            f.field_name = 'price_p%d_%03d' % (pno + 1, made + 1)
            f.field_value = text
            f.rect = box
            f.text_font = 'HeBo'                 # Helvetica-Bold
            f.text_fontsize = round((rect.y1 - rect.y0) * 1.02, 1)
            f.text_color = (0.07, 0.08, 0.12)
            f.fill_color = sample_bg(page, rect, pix, scale)
            f.border_width = 0
            f.field_flags = 0
            page.add_widget(f)

            made += 1
            seen.append(text)

    doc.save(OUT, garbage=3, deflate=True)

    # every figure prices.js states should have become a field
    want = [format(v, ',') for _, _, v in wanted if v]
    missing = [v for v in want if v not in seen]

    print('  %s' % OUT)
    print('  %d editable figures over %d pages' % (made, doc.page_count))
    print('  prices.js states %d; not found on the page: %s'
          % (len(want), missing or 'none'))

    if FLATTEN:
        d2 = pymupdf.open(OUT)
        for page in d2:
            for wdg in list(page.widgets()):
                page.add_freetext_annot(
                    wdg.rect, wdg.field_value or '',
                    fontsize=wdg.text_fontsize, fontname='HeBo',
                    text_color=wdg.text_color, fill_color=wdg.fill_color,
                    border_width=0)
                page.delete_widget(wdg)
        d2.bake()
        d2.save(FLAT, garbage=3, deflate=True)
        d2.close()
        print('  %s  (fields flattened, for the printer)' % FLAT)

    doc.close()


if __name__ == '__main__':
    build()
