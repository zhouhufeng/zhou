#!/usr/bin/env python3
"""Turn the snapshots in data/raw/ into data/content.json.

The source is a hand-written static site with a consistent shape, which is what
makes a faithful re-render possible:

    <section class="page-hero">   kicker, h1, lede
    <section class="section">     .section-heading (kicker, h2, lede) + body
                                  body = prose, lists, .grid of .card,
                                  .publication-list, .actions, .media-frame img
                                  .stats

Rather than copy the source CSS, this keeps those roles as data so the React
app can restyle them. Prose bodies are sanitised to a small tag whitelist, so
they are safe to render with dangerouslySetInnerHTML.

    pip install beautifulsoup4 lxml
    python3 scripts/extract_content.py
"""
import gzip, json, os, re
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

BASE = 'https://zhouhufeng.github.io/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'data', 'raw')
OUT = os.path.join(ROOT, 'data', 'content.json')

KEEP = {'p', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'br', 'h3', 'h4',
        'code', 'sup', 'sub', 'blockquote'}

# slug -> the route the React app serves it at
PAGES = {
    'index': '/', 'about': '/about', 'publications': '/publications',
    'projects': '/research', 'Software': '/software', 'contact': '/contact',
    'Population_Genetics': '/research/population-genetics',
    'FAVOR': '/research/favor',
    'STAAR': '/research/staar',
    'Epigenomics': '/research/epigenomics',
    'EBV_Oncoproteins': '/research/ebv-oncoproteins',
    'EBV_Super_Enhancers': '/research/super-enhancers',
    'EBV_Regulome': '/research/ebv-regulome',
    'PPIs': '/research/protein-interactions',
    'IntraPPIs': '/research/intra-species-ppis',
    'Host-Pathogen-PPIs': '/research/host-pathogen-ppis',
    'Protein-functions': '/research/protein-functions',
    'AI_Genomics': '/research/ai-genomics',
}
# Internal .html links get rewritten to those routes.
HREF_MAP = {f'{slug}.html': route for slug, route in PAGES.items()}


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def resolve(href):
    """Rewrite an internal page link to its route; leave external ones alone."""
    if not href:
        return ''
    if href.startswith(('http://', 'https://', 'mailto:', '#')):
        return href
    base = href.split('#')[0].split('?')[0]
    if base in HREF_MAP:
        return HREF_MAP[base]
    if base.endswith('.docx') or base.endswith('.pdf'):
        return urljoin(BASE, href)          # the CV lives on the source site
    if base.startswith('img/'):
        return '/images/' + base[len('img/'):]
    return urljoin(BASE, href)


def sanitize(node):
    soup = BeautifulSoup(str(node), 'lxml')
    body = soup.body or soup
    for t in body(['script', 'style', 'noscript', 'svg']):
        t.decompose()
    for el in body.find_all(True):
        if el.name in ('html', 'body'):
            continue
        if el.name not in KEEP:
            el.unwrap()
            continue
        attrs = {}
        if el.name == 'a':
            href = resolve(el.get('href', ''))
            if href:
                attrs['href'] = href
            if href.startswith('http'):
                attrs['target'] = '_blank'
                attrs['rel'] = 'noopener noreferrer'
        el.attrs = attrs
    html = ''.join(str(c) for c in body.children)
    return re.sub(r'>\s+<', '><', re.sub(r'\s+', ' ', html)).strip()


def actions(scope):
    out = []
    for a in scope.select('.actions a, a.button'):
        label = clean(a.get_text(' '))
        if label:
            out.append({'label': label, 'href': resolve(a.get('href', ''))})
    return out


def publications(scope):
    out = []
    for art in scope.select('article.publication'):
        title = art.find('h3')
        year = art.select_one('.pub-year')
        auth = art.select_one('.authors')
        venue = art.select_one('.venue')
        links = {}
        for a in art.select('.links a'):
            links[clean(a.get_text()).lower()] = a.get('href', '')
        out.append({
            'year': clean(year.get_text()) if year else '',
            'title': clean(title.get_text()) if title else '',
            'authors': clean(auth.get_text()) if auth else '',
            'venue': clean(venue.get_text()) if venue else '',
            'doi': links.get('doi', ''),
            'pubmed': links.get('pubmed', ''),
            'highlight': 'pub-highlight' in (art.get('class') or []),
        })
    return out


def cards(scope):
    out = []
    for c in scope.select('article.card, .card'):
        h = c.find(['h3', 'h4'])
        link = c.find('a')
        body = BeautifulSoup(str(c), 'lxml')
        for x in body.find_all(['h3', 'h4']):
            x.decompose()
        for x in body.select('a.button, .actions'):
            x.decompose()
        # The card's own link is surfaced as href/linkLabel; leaving the anchor
        # in the body would render as an empty <a>.
        for x in body.find_all('a'):
            if not clean(x.get_text()):
                x.decompose()
        cimg = c.find('img')
        out.append({
            'title': clean(h.get_text()) if h else '',
            'image': resolve(cimg.get('src')) if cimg else None,
            'imageAlt': cimg.get('alt', '') if cimg else '',
            'html': sanitize(body.body or body),
            'href': resolve(link.get('href', '')) if link else '',
            'linkLabel': clean(link.get_text()) if link else '',
        })
    return out


def stats(scope):
    """Headline figures. The source writes them as a <dl> of dt/dd pairs."""
    out = []
    for d in scope.select('.hero-metrics > div, .stats > div, .stat'):
        dt, dd = d.find('dt'), d.find('dd')
        if dt and dd:
            out.append({'value': clean(dt.get_text()), 'label': clean(dd.get_text())})
        else:
            parts = [clean(t) for t in d.stripped_strings]
            if len(parts) >= 2:
                out.append({'value': parts[0], 'label': ' '.join(parts[1:])})
    return out


def tags(scope):
    return [clean(t.get_text()) for t in scope.select('.topic-list .tag, .tag')
            if clean(t.get_text())]


def heading_parts(scope):
    """kicker / h2 / lede, whether or not they sit in a .section-heading wrapper."""
    head = scope.select_one('.section-heading') or scope
    kicker = head.select_one('.kicker')
    h2 = head.find('h2')
    lede = None
    if h2:
        for sib in h2.find_next_siblings():
            if sib.name == 'p' and not (sib.get('class') or []):
                lede = sib
                break
    return (clean(kicker.get_text()) if kicker else '',
            clean(h2.get_text()) if h2 else '',
            clean(lede.get_text()) if lede else '')


def prose(scope):
    """Top-level paragraphs and lists, excluding anything already captured."""
    chunks = []
    for el in scope.find_all(['p', 'ul', 'ol'], recursive=True):
        if el.find_parent(['article', 'li']) or el.find_parent(class_='section-heading'):
            continue
        if any(c in (el.get('class') or []) for c in ('kicker', 'authors', 'venue')):
            continue
        html = sanitize(el)
        if html and html not in chunks:
            chunks.append(html)
    return ''.join(chunks)


def section(sec):
    kicker, heading, lede = heading_parts(sec)
    # A bare descendant <img> only counts if it is the section's own figure —
    # not one belonging to a card, which the card carries itself.
    img = sec.select_one('.media-frame img') or sec.select_one('img.portrait')
    if img is None:
        img = next((i for i in sec.find_all('img')
                    if not i.find_parent(class_='card')), None)

    # Work on a copy so removing the heading does not disturb later passes.
    body = BeautifulSoup(str(sec), 'lxml')
    for x in body.select('.section-heading'):
        x.decompose()
    # Drop whichever nodes heading_parts already consumed, so they do not also
    # show up as prose.
    for x in body.find_all(['h2']):
        for sib in x.find_next_siblings('p'):
            if not (sib.get('class') or []):
                sib.decompose()
            break
        x.decompose()
    for x in body.select('.kicker'):
        x.decompose()

    return {
        'kicker': kicker,
        'heading': heading,
        'lede': lede,
        'tags': tags(sec),
        'alt': 'alt' in (sec.get('class') or []),
        'prose': prose(body.body or body),
        'cards': cards(sec),
        'stats': stats(sec),
        'publications': publications(sec),
        'actions': actions(sec),
        'image': (resolve(img.get('src')) if img else None),
        'imageAlt': (img.get('alt', '') if img else ''),
    }


def load(slug):
    with gzip.open(os.path.join(RAW, f'{slug}.html.gz'), 'rt',
                   encoding='utf-8', errors='replace') as f:
        return BeautifulSoup(f.read(), 'lxml')


def page(slug):
    soup = load(slug)
    main = soup.find('main') or soup
    hero = main.select_one('.page-hero, .hero')
    hero_h1 = hero.find('h1') if hero else main.find('h1')
    hero_kicker = hero.select_one('.kicker') if hero else None
    # The home hero marks its lede with a class; the inner pages use a bare <p>.
    hero_lede = None
    if hero:
        hero_lede = hero.select_one('p.lede')
        if hero_lede is None and hero_h1:
            for sib in hero_h1.find_next_siblings():
                if sib.name == 'p' and not (sib.get('class') or []):
                    hero_lede = sib
                    break
    hero_bg = ''
    if hero and hero.get('style'):
        m = re.search(r"url\(['\"]?([^'\")]+)", hero['style'])
        if m:
            hero_bg = resolve(m.group(1))

    secs = []
    for sec in main.find_all('section', recursive=True):
        if 'page-hero' in (sec.get('class') or []) or 'hero' in (sec.get('class') or []):
            continue
        s = section(sec)
        if any((s['prose'], s['cards'], s['stats'], s['publications'],
                s['heading'], s['image'], s['tags'])):
            secs.append(s)

    return {
        'route': PAGES[slug],
        'kicker': clean(hero_kicker.get_text()) if hero_kicker else '',
        'title': clean(hero_h1.get_text()) if hero_h1 else slug,
        'lede': clean(hero_lede.get_text()) if hero_lede else '',
        'heroActions': actions(hero) if hero else [],
        'heroStats': stats(hero) if hero else [],
        'heroImage': hero_bg,
        'sections': secs,
    }


def main_():
    data = {'pages': {}}
    for slug in PAGES:
        data['pages'][slug] = page(slug)
        p = data['pages'][slug]
        print(f'  {slug:22} {p["title"][:34]:36} sections={len(p["sections"]):2} '
              f'pubs={sum(len(s["publications"]) for s in p["sections"])}')

    # The publications page is the canonical bibliography.
    pubs = [pub for s in data['pages']['publications']['sections']
            for pub in s['publications']]
    data['publications'] = pubs

    soup = load('index')
    data['site'] = {
        'name': 'Hufeng Zhou',
        'shortName': 'HZ',
        'discipline': 'Computational Biology',
        'role': 'Research Scientist, Harvard T.H. Chan School of Public Health',
        'email': 'hufengzhou@g.harvard.edu',
        'links': {
            'github': 'https://github.com/zhouhufeng',
            'scholar': 'https://scholar.google.com/citations?user=Ddw_B4EAAAAJ&hl=en',
            'orcid': 'https://orcid.org/0000-0001-9382-5674',
            'pubmed': 'https://pubmed.ncbi.nlm.nih.gov/?term=0000-0001-9382-5674',
            'source': BASE,
        },
        'cv': next((a['href'] for a in
                    [x for s in [soup] for x in []] or []), ''),
    }
    # The CV link is whatever .docx/.pdf the source site offers.
    for a in soup.find_all('a', href=True):
        if a['href'].lower().endswith(('.docx', '.pdf')):
            data['site']['cv'] = urljoin(BASE, a['href'])
            break

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f'\nwrote {os.path.relpath(OUT, ROOT)} ({os.path.getsize(OUT)//1024} KB), '
          f'{len(pubs)} publications')


if __name__ == '__main__':
    main_()
