#!/usr/bin/env python3
"""Snapshot zhouhufeng.github.io into data/raw/*.html.gz.

This is the provenance step. Everything in data/content.json is derived from
these files by scripts/extract_content.py, so re-scrape plus re-extract is the
whole content-refresh workflow.

Google Scholar is deliberately NOT scraped here — it serves a CAPTCHA to
automated requests, and working around that is not something this repo does.
The citation metrics come from OpenAlex instead (scripts/fetch_metrics.py),
which is a public API built for exactly this and covers the same ground.

    python3 scripts/scrape.py            # fetch all pages
    python3 scripts/scrape.py --force    # re-fetch even if a snapshot exists
"""
import gzip, os, sys, time
from urllib.request import urlopen, Request

BASE = 'https://zhouhufeng.github.io/'
UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36'}

PAGES = [
    'index', 'about', 'publications', 'projects', 'Software', 'contact',
    'Population_Genetics', 'FAVOR', 'STAAR',
    'Epigenomics', 'EBV_Oncoproteins', 'EBV_Super_Enhancers', 'EBV_Regulome',
    'PPIs', 'IntraPPIs', 'Host-Pathogen-PPIs', 'Protein-functions',
    'AI_Genomics',
]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw')


def main():
    force = '--force' in sys.argv
    os.makedirs(RAW, exist_ok=True)
    for name in PAGES:
        dest = os.path.join(RAW, f'{name}.html.gz')
        if os.path.exists(dest) and not force:
            print(f'  = {name} (cached)')
            continue
        with urlopen(Request(f'{BASE}{name}.html', headers=UA), timeout=60) as r:
            html = r.read()
        with gzip.open(dest, 'wb') as f:
            f.write(html)
        print(f'  + {name}  ({len(html)//1024} KB)')
        time.sleep(0.5)


if __name__ == '__main__':
    main()
