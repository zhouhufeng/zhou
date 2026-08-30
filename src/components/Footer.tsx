import { Link } from 'react-router-dom'
import { metrics, site } from '../data/content'
import { nav } from '../data/nav'

const EXTERNAL: [string, string][] = [
  ['Google Scholar', 'scholar'],
  ['ORCID', 'orcid'],
  ['PubMed', 'pubmed'],
  ['GitHub', 'github'],
]

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white/75">
      <div className="mx-auto max-w-shell px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 className="font-display text-2xl font-semibold text-white">{site.name}</h2>
            <p className="mt-1 text-sm text-copper-2">{site.role}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Computational biologist and statistical geneticist. Former Instructor at Harvard
              Medical School and Brigham and Women&rsquo;s Hospital.
            </p>
            <p className="mt-4 text-sm">
              <a
                className="underline underline-offset-2 hover:text-copper-2"
                href={`mailto:${site.email}`}
              >
                {site.email}
              </a>
            </p>
          </div>

          <nav aria-label="Footer">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-2">
              Pages
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link className="hover:text-copper-2" to="/">
                  Home
                </Link>
              </li>
              {nav.map((n) => (
                <li key={n.to}>
                  <Link className="hover:text-copper-2" to={n.to}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-2">
              Elsewhere
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {EXTERNAL.map(([label, key]) => (
                <li key={key}>
                  <a
                    className="hover:text-copper-2"
                    href={site.links[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  className="hover:text-copper-2"
                  href={site.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Curriculum vitae
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/15 pt-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Hufeng Zhou.</p>
          <p>
            Citation figures from{' '}
            <a
              className="underline underline-offset-2 hover:text-copper-2"
              href={metrics.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {metrics.source}
            </a>
            , {metrics.updated}. Content mirrored from{' '}
            <a
              className="underline underline-offset-2 hover:text-copper-2"
              href={site.links.source}
              target="_blank"
              rel="noopener noreferrer"
            >
              zhouhufeng.github.io
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
