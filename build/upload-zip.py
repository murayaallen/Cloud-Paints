# ============================================================
# CLOUD PAINTS — the upload archive
# ============================================================
#     python build/upload-zip.py
#
# Zips the deploy set so that index.html sits at the TOP of the
# archive, not inside a folder. Almost every host's file manager
# offers "extract here", and an archive with one folder in it
# produces cloudpaints.co.ke/website/index.html — a working site
# at the wrong address, which is worse than one that plainly
# fails.
#
# Written with zipfile rather than Compress-Archive for one
# reason: .htaccess. A leading dot makes it invisible to several
# Windows archive tools, and .htaccess is the file that carries
# the clean URLs, every redirect, the security headers and the
# Content-Security-Policy. Without it the site loads and every
# link 404s. Here it is added by name and then checked for by
# name after the fact.
# ============================================================

import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(HERE)
FINAL = os.path.abspath(os.path.join(PROJECT, '..', 'Cloud Paints Final'))
SRC = os.path.join(FINAL, 'website')
OUT = os.path.join(FINAL, 'cloud-paints-website.zip')

if not os.path.isdir(SRC):
    sys.exit('No website folder at %s — run: node build/final-folder.mjs --write' % SRC)

# Files that must be present, or the upload is broken in a way that is not
# obvious until someone clicks a link.
REQUIRED = [
    '.htaccess', 'index.html', 'robots.txt', 'sitemap.xml', 'favicon.ico',
    'css/main.css', 'js/base.js', 'js/products-data.js', 'js/art-manifest.js',
    'paints/silk-vinyl.html', 'css/fonts.css',
]

entries = []
for base, dirs, files in os.walk(SRC):
    dirs.sort()
    for name in sorted(files):
        full = os.path.join(base, name)
        rel = os.path.relpath(full, SRC).replace(os.sep, '/')
        entries.append((full, rel))

names = {rel for _, rel in entries}
missing = [r for r in REQUIRED if r not in names]
if missing:
    sys.exit('Refusing to build the archive — missing:\n  ' + '\n  '.join(missing))

if os.path.exists(OUT):
    os.remove(OUT)

# Deflate everything except what is already compressed; re-deflating a WebP or
# a woff2 costs time on both ends and gains nothing.
STORE = {'.webp', '.jpg', '.jpeg', '.png', '.gif', '.woff2', '.woff',
         '.pdf', '.ico', '.mp4', '.webm', '.zip'}

raw = 0
with zipfile.ZipFile(OUT, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for full, rel in entries:
        raw += os.path.getsize(full)
        ext = os.path.splitext(rel)[1].lower()
        z.write(full, rel,
                compress_type=zipfile.ZIP_STORED if ext in STORE else zipfile.ZIP_DEFLATED)

size = os.path.getsize(OUT)

# Read it back. An archive that cannot be listed is not an archive.
with zipfile.ZipFile(OUT) as z:
    bad = z.testzip()
    inside = z.namelist()

print('  %s' % OUT)
print('  %d files · %.1f MB packed from %.1f MB' % (len(inside), size / 1048576, raw / 1048576))
print('')
print('  integrity            %s' % ('FAILED at ' + bad if bad else 'every entry reads back'))
print('  .htaccess present    %s' % ('yes' if '.htaccess' in inside else 'NO — the site will 404'))
print('  index.html at root   %s' % ('yes' if 'index.html' in inside else 'NO'))
print('  nested folder        %s' % ('none — extracts flat' if not any(
    n.startswith('website/') for n in inside) else 'YES — would extract one level down'))
print('')
top = sorted({n.split('/')[0] for n in inside})
print('  top level: %s' % ', '.join(top))
