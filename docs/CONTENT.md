# Where the content comes from, and how to change it

Two sources, for two different things.

```
  zhouhufeng.github.io ──scrape.py──► data/raw/*.html.gz    provenance snapshot
                                            │
                                  extract_content.py
                                            ▼
                                    data/content.json ◄── fetch_metrics.py
                                            │              (OpenAlex citations)
                                     fetch_images.py
                                            ▼
                                      public/images/
                                            │
                                       vite build
                                            ▼
                                          dist/
```

| Source | Supplies | How |
|---|---|---|
| `zhouhufeng.github.io` | All text, structure, figures, the 62-entry bibliography | Scraped (18 pages) |
| **OpenAlex** | Citation counts, h-index, i10-index, total citations | Public API, by ORCID |

## Why not Google Scholar

Scholar is the obvious source for citation figures and is deliberately not
scraped. It serves a CAPTCHA to automated requests — plain HTTP and a real
headless browser both get *"Please show you're not a robot"* — and working
around an anti-bot control is not something this repo does.

**OpenAlex** replaces it properly: a free, key-less API built for programmatic
access, indexing the same literature, exposing the same figures. Retrieved
2026-08-30 it reported 89 works, 3,613 citations, h-index 32, i10-index 47.

Scholar's numbers will read **higher**, because it indexes preprints, theses,
book chapters and citing documents that OpenAlex does not. Neither is wrong;
they count different things. The site says which source and which date, on the
home page and in the footer, so the figure is never presented as unattributed
fact. To show Scholar's numbers instead, edit `metrics` in `data/content.json`
by hand and change the attribution to match.

## Refreshing

```bash
npm run refresh    # scrape --force, extract, metrics, images
npm run build
git diff --stat data/content.json    # review before committing
```

Order matters. `extract_content.py` rewrites `data/content.json` from scratch,
so it must come before `fetch_metrics.py` (which adds `citedBy`) and
`fetch_images.py` (which rewrites image paths to local, converted files). Run
out of order and you lose the citation counts or end up hot-linking GitHub.

Just the citations, which change more often than the prose:

```bash
npm run metrics
```

Python dependencies: `pip3 install --user beautifulsoup4 lxml`. Image resizing
uses macOS `sips`; on Linux the download works and the resize is skipped with a
warning.

## Shape of data/content.json

| Key | Shape |
|---|---|
| `site` | name, discipline, role, email, CV link, external profile links |
| `metrics` | `{works, citedBy, hIndex, i10Index, updated, source, sourceUrl}` |
| `pages.<slug>` | `{route, kicker, title, lede, heroActions, heroStats, heroImage, sections[]}` |
| `publications` | The flat 62-entry bibliography from the Publications page |

A `section` carries the roles the source site's markup expressed, so the React
app can restyle rather than copy its CSS:

```
{ kicker, heading, lede, tags[], alt, prose, cards[], stats[],
  publications[], actions[], image, imageAlt }
```

`alt` marks the tinted bands the source alternates. `prose` is sanitised HTML
(whitelisted tags, only `href`/`target`/`rel` surviving) — safe to render, but
hold to that whitelist if you paste HTML in by hand.

## Routes

`src/data/nav.ts` defines the menu; `PAGES` in `scripts/extract_content.py` maps
each source `.html` to its route, and internal links are rewritten to match. Add
a page to the source site and it appears here — including in `dist/sitemap.xml`,
which is generated from the content — without editing the router: `App.tsx`
generates a route per extracted page.

## Attribution

The text, figures and photographs are Hufeng Zhou's own, republished from his
GitHub Pages site. The CV link points at the source site's `.docx` rather than
copying the file, so there is one canonical CV.

The source site uses system fonts; this one sets Source Serif 4 and Inter from
Google Fonts.
