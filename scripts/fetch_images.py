#!/usr/bin/env python3
"""Download every image data/content.json references, and resize it.

extract_content.py rewrites `img/foo.png` on the source site to `/images/foo.png`
here, so this walks the JSON for those paths and pulls each one from
zhouhufeng.github.io into public/images/.

Figures are capped at 1200px on the long edge, the portrait at 900px and the
hero at 2000px. Nothing on the page is displayed wider than ~700px, so the
source files (some near 2 MB) are far larger than they need to be.

Figure PNGs are then re-encoded as JPEG, which cuts them ~5x — they are plots
on white with an opaque alpha channel, so nothing is lost. SVGs are left alone.
Paths in data/content.json are rewritten to match.
Resizing uses macOS `sips`; elsewhere the download still works and the resize
is skipped with a warning.

    python3 scripts/fetch_images.py
    python3 scripts/fetch_images.py --force    # re-download and re-resize
"""
import json, os, subprocess, sys
from urllib.parse import quote, urlsplit, urlunsplit
from urllib.request import urlopen, Request

BASE = 'https://zhouhufeng.github.io/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'data', 'content.json')
IMAGES = os.path.join(ROOT, 'public', 'images')
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'}


def walk(node):
    """Yield every '/images/...' string anywhere in the content tree."""
    if isinstance(node, dict):
        for v in node.values():
            yield from walk(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk(v)
    elif isinstance(node, str) and node.startswith('/images/'):
        yield node


def encode(url):
    parts = urlsplit(url)
    return urlunsplit(parts._replace(path=quote(parts.path)))


def max_px(rel):
    if 'hero' in rel:
        return 2000          # full-bleed background
    if 'portrait' in rel:
        return 900
    return 1200              # figures, shown at ~700px at most


def to_jpeg(path):
    """Re-encode a figure PNG as JPEG. Returns the new path (or the old one)."""
    out = os.path.splitext(path)[0] + '.jpg'
    try:
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82',
                        path, '--out', out], check=True, capture_output=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f'  ! could not convert {os.path.basename(path)}: {e}', file=sys.stderr)
        return path
    os.remove(path)
    return out


def resize(path, maxpx):
    if path.lower().endswith('.svg'):
        return
    try:
        subprocess.run(['sips', '-Z', str(maxpx), path], check=True, capture_output=True)
    except (FileNotFoundError, subprocess.CalledProcessError) as e:
        print(f'  ! could not resize {os.path.basename(path)}: {e}', file=sys.stderr)


def main():
    force = '--force' in sys.argv
    data = json.load(open(CONTENT, encoding='utf-8'))
    paths = sorted(set(walk(data)))
    print(f'{len(paths)} images referenced')

    total, renames = 0, {}
    for rel in paths:
        dest = os.path.join(IMAGES, rel[len('/images/'):])
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        # A previous run may already have converted this PNG to JPEG.
        alt = os.path.splitext(dest)[0] + '.jpg'
        if dest.lower().endswith('.png') and os.path.exists(alt) and not force:
            renames[rel] = '/images/' + os.path.relpath(alt, IMAGES).replace(os.sep, '/')
            print(f'  = {renames[rel]}')
            total += os.path.getsize(alt)
            continue
        if os.path.exists(dest) and os.path.getsize(dest) > 0 and not force:
            print(f'  = {rel}')
            total += os.path.getsize(dest)
            continue
        src = BASE + 'img/' + rel[len('/images/'):]
        try:
            with urlopen(Request(encode(src), headers=UA), timeout=90) as r, \
                 open(dest, 'wb') as f:
                f.write(r.read())
        except Exception as e:
            print(f'  ! {rel}: {e}', file=sys.stderr)
            continue
        resize(dest, max_px(rel))
        if dest.lower().endswith('.png'):
            new = to_jpeg(dest)
            if new != dest:
                dest = new
                renames[rel] = '/images/' + os.path.relpath(dest, IMAGES).replace(os.sep, '/')
        total += os.path.getsize(dest)
        print(f'  + {renames.get(rel, rel)}  ({os.path.getsize(dest)//1024} KB)')

    if renames:
        raw = json.dumps(data, ensure_ascii=False)
        for old, new in renames.items():
            raw = raw.replace(json.dumps(old)[1:-1], json.dumps(new)[1:-1])
        json.dump(json.loads(raw), open(CONTENT, 'w', encoding='utf-8'),
                  indent=2, ensure_ascii=False)
        print(f'\nrewrote {len(renames)} image paths in data/content.json')

    print(f'total {total // 1024} KB in public/images')


if __name__ == '__main__':
    main()
