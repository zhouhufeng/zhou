import type { Publication } from '../data/content'

function Meta({ pub }: { pub: Publication }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {pub.doi && (
        <a
          className="font-medium text-copper hover:underline"
          href={pub.doi}
          target="_blank"
          rel="noopener noreferrer"
        >
          DOI
        </a>
      )}
      {pub.pubmed && (
        <a
          className="font-medium text-copper hover:underline"
          href={pub.pubmed}
          target="_blank"
          rel="noopener noreferrer"
        >
          PubMed
        </a>
      )}
      {/* A brand-new paper legitimately has none; the row reads better without
          a "0 citations" label than with one. */}
      {typeof pub.citedBy === 'number' && pub.citedBy > 0 && (
        <span className="text-mute">
          {pub.citedBy.toLocaleString()} citation{pub.citedBy === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}

export default function PublicationList({ items }: { items: Publication[] }) {
  if (items.length === 0) {
    return <p className="py-8 text-sm text-mute">No publications match that filter.</p>
  }

  return (
    <ol className="divide-y divide-rule border-y border-rule">
      {items.map((pub, i) => (
        <li key={`${pub.title}-${i}`} className="grid gap-x-6 gap-y-1 py-6 sm:grid-cols-[4rem_minmax(0,1fr)]">
          <div className="pt-0.5">
            <span className="font-display text-lg font-semibold text-mute tabular-nums">
              {pub.year}
            </span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold leading-snug text-ink">
              {pub.title}
              {pub.highlight && (
                <span
                  title="Marked as selected work"
                  className="ml-2 align-middle text-[0.6rem] font-semibold uppercase
                             tracking-[0.12em] text-copper-2"
                >
                  ★
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate">{pub.authors}</p>
            <p className="mt-1 text-sm italic text-mute">{pub.venue}</p>
            <Meta pub={pub} />
          </div>
        </li>
      ))}
    </ol>
  )
}
