# zhou.genohub.org

Personal academic homepage for **Hufeng Zhou, PhD** — Research Scientist,
Department of Biostatistics, Harvard T.H. Chan School of Public Health.

A static React build of the content at
[zhouhufeng.github.io](https://zhouhufeng.github.io/), with citation figures
from OpenAlex, served from our K3s node behind the `genohub.org`
Cloudflare zone.

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (plus dist/sitemap.xml)
npm run preview    # serve the build at http://localhost:4174
```

No system Node? Install it without root:

```bash
V=v24.20.0
curl -sL https://nodejs.org/dist/$V/node-$V-darwin-arm64.tar.xz | tar xJ -C ~/.local/opt
ln -sfn ~/.local/opt/node-$V-darwin-arm64 ~/.local/opt/node
ln -sf ~/.local/opt/node/bin/{node,npm,npx} ~/.local/bin/
```

(`linux-x64` on the workstation. `~/.local/bin` is already on `PATH`.)

## Deploying

```bash
./scripts/deploy.sh
```

Builds, rsyncs a timestamped release to `/srv/zhou/releases/` on
the origin node, flips the `current` symlink, and verifies at the origin and
through Cloudflare — by page content, not status code, because the zone wildcard
answers 200 for any hostname. `--rollback` moves the symlink back.

First-time setup (the `zhou` A record and `kubectl apply`) is in
**[docs/DEPLOY.md](docs/DEPLOY.md)**.

## Layout

| Path | What it is |
|---|---|
| `src/App.tsx` | Router — one route per extracted page, generated from the content |
| `src/components/` | Header with the Research dropdown, hero, section renderer, cards, publication list |
| `src/pages/` | `Home`, `Publications` (search + year + selected filters), `StandardPage` |
| `src/data/content.ts` | Types over `data/content.json` |
| `src/data/nav.ts` | The menu, and the route list |
| `data/content.json` | **All site content** — 18 pages, 62 publications, citation metrics |
| `data/raw/*.html.gz` | The 18 scraped source pages |
| `public/images/` | Figures and photos, downloaded, resized, PNG→JPEG (8.4 MB → 2.4 MB) |
| `scripts/scrape.py` | Snapshot zhouhufeng.github.io |
| `scripts/extract_content.py` | Snapshots → `data/content.json` |
| `scripts/fetch_metrics.py` | Citation counts and h-index from OpenAlex |
| `scripts/fetch_images.py` | Download, resize, convert; rewrite JSON paths |
| `scripts/gen_sitemap.mjs` | `dist/sitemap.xml`, part of the build |
| `scripts/deploy.sh` | Build → node → symlink flip → verify |
| `scripts/cloudflare-dns.sh` | Create/fix the `zhou` A record (needs a Zone:DNS:Edit token) |
| `deploy/k8s/zhou.yaml` | nginx Deployment, Service, Ingress in the `web` namespace |
| `docs/DEPLOY.md` | Runbook, DNS, troubleshooting |
| `docs/CONTENT.md` | Content pipeline, why not Google Scholar, how to edit |

## Updating

```bash
npm run refresh    # re-scrape, re-extract, re-fetch metrics and images
npm run metrics    # citation counts only — these move more often than the prose
npm run build
```

Both paths, and the shape of `data/content.json`, are in
**[docs/CONTENT.md](docs/CONTENT.md)**.

## A note on the numbers

Google Scholar is CAPTCHA-gated against automated access, so citation figures
come from **OpenAlex** (a free public API over the same literature) and are
labelled with their source and retrieval date wherever they appear. Scholar's
totals read higher because it indexes a broader, noisier set of documents —
neither is wrong, they count different things. `docs/CONTENT.md` explains how to
substitute Scholar's figures by hand if you prefer them.

The source site's hero states "45+ peer-reviewed publications"; OpenAlex indexes
89 works for this ORCID. Both appear on the home page, one as the site's own
claim and one as an attributed external count.

## Related

- Source content: <https://zhouhufeng.github.io/>
- Lin Lab site, same node and zone: [`LinLab`](https://github.com/zhouhufeng/LinLab)
- Infrastructure: shares a node and a Cloudflare zone with FAVOR (private repo)
