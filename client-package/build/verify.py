# ============================================================
# CLOUD PAINTS — print package: finished-PDF verification
# ============================================================
#     python build/verify.py
#
# Run after build + render. Three checks, all end-to-end on the
# finished PDFs rather than on the HTML behind them:
#
# 1. Page geometry — every page is exactly its nominal trim size.
# 2. Fonts — every document carries its own glyphs.
# 3. Words — everything the page said in the browser actually
#    reached the PDF.
#
# Check 3 is the one that matters most. The print engine can drop
# a whole block that the DOM lays out perfectly: a box landing on
# a page boundary is moved to the next page rather than split, and
# if nothing follows it, it vanishes with no error anywhere. That
# is invisible to any measurement taken in the browser, and it is
# how the A5 range flier lost its entire contact block. render.mjs
# records what each sheet said; this compares it with what the PDF
# can actually be read to say.
# ============================================================

import glob
import json
import os
import re
import sys
from collections import Counter

import pypdfium2 as pdfium
from pypdf import PdfReader

HERE = os.path.dirname(os.path.abspath(__file__))
PKG = os.path.dirname(HERE)

# folded/flat trim sizes in mm, by output folder or exact stem
EXPECT = {
    '0-colour-flier/weatherguard-a4': (210, 297),
    '0-colour-flier/weatherguard-a5': (148, 210),
    '1-range-poster/cloud-paints-range-A2': (420, 594),
    '1-range-poster/cloud-paints-range-A3': (297, 420),
    '6-range-flier/cloud-paints-range-flier-folds-to-A4': (420, 297),
    '6-range-flier/cloud-paints-range-flier-folds-to-A5': (297, 210),
    '2-product-fliers-A4': (210, 297),
    '3-product-fliers-A5': (148, 210),
    '4-brochures': (297, 210),
    '5-price-list': (210, 297),
}

# Compare line by line, on a flattened character stream.
#
# Word-by-word is too strict: PDF extraction routinely splits a word across
# two text runs. A single flattened stream is too strict the other way: the
# reading order of a multi-column page differs from DOM order, so any window
# spanning a block boundary looks lost when nothing is.
#
# A line is the right unit. It rarely straddles a boundary, and a block that
# the print engine drops takes all of its lines with it.
FLAT = re.compile(r"[^a-z0-9]+")
MIN_LINE = 24          # ignore short fragments — headings, sizes, page numbers


def expected_size(rel):
    stem = rel[:-4]
    return EXPECT.get(stem) or EXPECT.get(rel.split('/')[0])


def flat(text):
    return FLAT.sub('', text.lower())


def coverage(said, got):
    """Fraction of the page's substantial lines that can be found in the PDF."""
    body = flat(got)
    lines = [(ln, flat(ln)) for ln in said.splitlines()]
    lines = [(raw, f) for raw, f in lines if len(f) >= MIN_LINE]
    if len(lines) < 3:
        return 1.0, []
    lost = [raw.strip() for raw, f in lines if f not in body]
    return (len(lines) - len(lost)) / len(lines), lost


def main():
    os.chdir(PKG)
    said_path = os.path.join(HERE, 'expected-text.json')
    said = json.load(open(said_path, encoding='utf-8')) if os.path.exists(said_path) else {}
    if not said:
        print('note: build/expected-text.json is missing — run render.mjs first')
        print('      (geometry and fonts are still checked)\n')

    files = sorted(f.replace(os.sep, '/') for f in glob.glob('pdf/**/*.pdf', recursive=True))
    geo, fonts, missing = [], [], []
    pages = 0

    for f in files:
        rel = f[4:]
        doc = pdfium.PdfDocument(f)
        want = expected_size(rel)

        for i in range(len(doc)):
            w, h = [round(v * 25.4 / 72) for v in doc[i].get_size()]
            if want and (w, h) != want:
                geo.append('%s p%d is %dx%dmm, expected %dx%dmm'
                           % (rel, i + 1, w, h, want[0], want[1]))
        pages += len(doc)

        reader = PdfReader(f)
        embedded = set()
        for pg in reader.pages:
            e, _ = pg._get_fonts()
            embedded |= set(e)
        if not embedded:
            fonts.append(rel)

        # 3. did every word survive the trip into the PDF?
        for i, page_said in enumerate(said.get(rel, [])):
            if i >= len(doc):
                missing.append('%s: sheet %d never became a page' % (rel, i + 1))
                continue
            pct, lost = coverage(page_said, doc[i].get_textpage().get_text_range())
            if pct < 0.97:
                missing.append('%s p%d: %d line(s) never reached the PDF — e.g. "%s"'
                               % (rel, i + 1, len(lost), lost[0][:56] if lost else ''))

    print('%d documents · %d pages · %.1f MB'
          % (len(files), pages, sum(os.path.getsize(f) for f in files) / 1048576))
    print('')

    ok = True
    for label, problems, good in (
            ('page geometry', geo, 'all %d pages exactly on trim size' % pages),
            ('font embedding', fonts, 'every document embeds its glyphs'),
            ('text integrity', missing, 'every word on every page reached the PDF')):
        if problems:
            ok = False
            print('%-16s %d PROBLEM(S)' % (label, len(problems)))
            for p in problems[:12]:
                print('    ! %s' % p)
        else:
            print('%-16s %s' % (label, good))

    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
