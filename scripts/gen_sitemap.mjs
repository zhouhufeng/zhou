// Writes dist/sitemap.xml from the same route table the router uses.
// Run as part of `npm run build`.
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGIN = process.env.SITE_ORIGIN ?? 'https://zhou.genohub.org'

// Routes come from the content itself, so a new source page appears in the
// sitemap without anyone remembering to add it.
const content = JSON.parse(readFileSync(resolve(ROOT, 'data/content.json'), 'utf8'))
const routes = [...new Set(Object.values(content.pages).map((p) => p.route))].sort()

const today = new Date().toISOString().slice(0, 10)
const urls = routes
  .map(
    (p) =>
      `  <url>\n    <loc>${ORIGIN}${p}</loc>\n    <lastmod>${today}</lastmod>\n` +
      `    <priority>${p === '/' ? '1.0' : p.split('/').length > 2 ? '0.5' : '0.7'}</priority>\n  </url>`,
  )
  .join('\n')

writeFileSync(
  resolve(ROOT, 'dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
)
console.log(`sitemap.xml: ${routes.length} urls -> ${ORIGIN}`)
