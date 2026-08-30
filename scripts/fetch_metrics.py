#!/usr/bin/env python3
"""Add citation data to data/content.json from OpenAlex.

Google Scholar is the obvious source for this and is deliberately not used:
it serves a CAPTCHA to any automated request, and defeating that is not
something this repo does. OpenAlex is a public, free, no-key API built for
programmatic access, indexes the same literature, and exposes the same
figures — total citations, h-index, i10-index, and per-work counts.

Writes into data/content.json:
    metrics       {works, citedBy, hIndex, i10Index, updated, source}
    publications  each gains citedBy (int) where OpenAlex knows the work

    python3 scripts/fetch_metrics.py
"""
import json, os, re, sys, time
from urllib.parse import quote
from urllib.request import urlopen, Request

ORCID = '0000-0001-9382-5674'
MAILTO = 'hufengzhou@g.harvard.edu'      # OpenAlex asks for a contact; it buys
API = 'https://api.openalex.org'         # the faster, more reliable pool
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, 'data', 'content.json')


def get(url):
    sep = '&' if '?' in url else '?'
    req = Request(f'{url}{sep}mailto={MAILTO}',
                  headers={'User-Agent': f'zhou.genohub.org (mailto:{MAILTO})'})
    with urlopen(req, timeout=60) as r:
        return json.load(r)


def norm_title(t):
    return re.sub(r'[^a-z0-9]+', ' ', (t or '').lower()).strip()


def search_title(title):
    """Look one work up by exact title. Returns its citation count, or None."""
    try:
        r = get(f'{API}/works?filter=title.search:{quote(title[:250])}'
                f'&per-page=5&select=title,cited_by_count')
    except Exception:
        return None
    target = norm_title(title)
    for w in r.get('results', []):
        if norm_title(w.get('title')) == target:
            return w.get('cited_by_count', 0)
    return None


def norm_doi(url):
    if not url:
        return ''
    return re.sub(r'^https?://(dx\.)?doi\.org/', '', url.strip()).lower()


def main():
    data = json.load(open(CONTENT, encoding='utf-8'))

    author = get(f'{API}/authors?filter=orcid:{ORCID}')['results']
    if not author:
        sys.exit(f'no OpenAlex author for ORCID {ORCID}')
    a = author[0]
    stats = a.get('summary_stats', {})
    data['metrics'] = {
        'works': a['works_count'],
        'citedBy': a['cited_by_count'],
        'hIndex': stats.get('h_index'),
        'i10Index': stats.get('i10_index'),
        'updated': time.strftime('%Y-%m-%d'),
        'source': 'OpenAlex',
        'sourceUrl': a['id'],
    }
    print(f"  author: {a['display_name']}  works={a['works_count']} "
          f"cited_by={a['cited_by_count']} h={stats.get('h_index')} "
          f"i10={stats.get('i10_index')}")

    # Page through every work so citation counts can be matched offline, by DOI
    # first and by PMID as a fallback (a few records carry no DOI link).
    by_doi, by_pmid = {}, {}
    cursor, seen = '*', 0
    while cursor:
        page = get(f'{API}/works?filter=author.orcid:{ORCID}'
                   f'&per-page=200&cursor={quote(cursor)}')
        for w in page['results']:
            seen += 1
            c = w.get('cited_by_count', 0)
            if w.get('doi'):
                by_doi[norm_doi(w['doi'])] = c
            pmid = (w.get('ids') or {}).get('pmid', '')
            if pmid:
                by_pmid[pmid.rsplit('/', 1)[-1]] = c
        cursor = page['meta'].get('next_cursor')
        if not page['results']:
            break
    print(f'  indexed {seen} works ({len(by_doi)} with a DOI)')

    # Title index for the ~half of listed papers that carry no DOI or PMID link
    # on the source page.
    by_title = {}
    cursor = '*'
    while cursor:
        page = get(f'{API}/works?filter=author.orcid:{ORCID}'
                   f'&per-page=200&cursor={quote(cursor)}'
                   f'&select=title,cited_by_count')
        for w in page['results']:
            if w.get('title'):
                by_title[norm_title(w['title'])] = w.get('cited_by_count', 0)
        cursor = page['meta'].get('next_cursor')
        if not page['results']:
            break

    def all_pubs(node):
        """Every publication object in the tree — the flat list on the
        Publications page and the per-project 'Related work' copies alike, so a
        paper shows the same count wherever it appears."""
        if isinstance(node, dict):
            if 'title' in node and 'venue' in node and 'authors' in node:
                yield node
            for v in node.values():
                yield from all_pubs(v)
        elif isinstance(node, list):
            for v in node:
                yield from all_pubs(v)

    targets = list(all_pubs(data))
    matched, via_search = 0, 0
    for pub in targets:
        c = by_doi.get(norm_doi(pub.get('doi', '')))
        if c is None and pub.get('pubmed'):
            c = by_pmid.get(pub['pubmed'].rstrip('/').rsplit('/', 1)[-1])
        if c is None and pub.get('title'):
            c = by_title.get(norm_title(pub['title']))
        if c is None and pub.get('title'):
            # Last resort: ask OpenAlex directly. Some older papers sit under a
            # different author record and never appear in the ORCID listing.
            c = search_title(pub['title'])
            if c is not None:
                via_search += 1
        if c is not None:
            pub['citedBy'] = c
            matched += 1
    if via_search:
        print(f'  {via_search} resolved by title search')
    print(f'  matched citation counts for {matched}/{len(targets)} publication entries '
          f'({len(data.get("publications", []))} on the Publications page)')

    json.dump(data, open(CONTENT, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)
    print('  wrote data/content.json')


if __name__ == '__main__':
    main()
