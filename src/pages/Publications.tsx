import { useMemo, useState } from 'react'
import { PageHero } from '../components/Hero'
import PublicationList from '../components/PublicationList'
import { content, metrics } from '../data/content'

/**
 * The full bibliography. 62 entries is more than anyone scrolls, so it gets a
 * text filter, a year filter and a selected-only toggle — the three questions
 * a reader actually arrives with.
 */
export default function Publications() {
  const page = content.pages.publications
  const all = content.publications

  const [q, setQ] = useState('')
  const [year, setYear] = useState('all')
  const [selectedOnly, setSelectedOnly] = useState(false)

  const years = useMemo(
    () => [...new Set(all.map((p) => p.year).filter(Boolean))].sort().reverse(),
    [all],
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return all.filter((p) => {
      if (year !== 'all' && p.year !== year) return false
      if (selectedOnly && !p.highlight) return false
      if (!needle) return true
      return `${p.title} ${p.authors} ${p.venue}`.toLowerCase().includes(needle)
    })
  }, [all, q, year, selectedOnly])

  const totalCited = all.reduce((n, p) => n + (p.citedBy ?? 0), 0)

  return (
    <>
      <PageHero page={page} />

      <section className="mx-auto max-w-shell px-5 py-14 sm:px-8">
        <div className="flex flex-wrap items-end gap-4 border-b border-rule pb-6">
          <label className="flex-1 min-w-[16rem]">
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-mute">
              Search
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Title, author, or journal"
              className="mt-2 w-full rounded-lg border border-rule bg-white px-3 py-2 text-sm
                         text-ink placeholder:text-mute focus:border-copper focus:outline-none"
            />
          </label>

          <label>
            <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-mute">
              Year
            </span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="mt-2 rounded-lg border border-rule bg-white px-3 py-2 text-sm text-ink
                         focus:border-copper focus:outline-none"
            >
              <option value="all">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setSelectedOnly((v) => !v)}
            aria-pressed={selectedOnly}
            className={[
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              selectedOnly
                ? 'border-copper bg-copper text-white'
                : 'border-ink/20 text-ink hover:border-copper hover:text-copper',
            ].join(' ')}
          >
            Selected only
          </button>
        </div>

        <p className="py-5 text-sm text-mute">
          Showing <span className="font-semibold text-ink">{shown.length}</span> of {all.length}{' '}
          publications · {totalCited.toLocaleString()} citations across matched works ({metrics.source},{' '}
          {metrics.updated})
        </p>

        <PublicationList items={shown} />
      </section>
    </>
  )
}
