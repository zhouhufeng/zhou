import { HomeHero } from '../components/Hero'
import SectionBlock from '../components/SectionBlock'
import { content, metrics } from '../data/content'

/** Citation figures, shown once on the home page under the hero. */
function MetricsBand() {
  const items = [
    { value: metrics.citedBy.toLocaleString(), label: 'citations' },
    { value: String(metrics.hIndex), label: 'h-index' },
    { value: String(metrics.i10Index), label: 'i10-index' },
    { value: String(metrics.works), label: 'indexed works' },
  ]
  return (
    <section className="border-b border-rule bg-white">
      <div className="mx-auto flex max-w-shell flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          {items.map((m) => (
            <div key={m.label}>
              <dt className="font-display text-3xl font-semibold tabular-nums text-ink">
                {m.value}
              </dt>
              <dd className="mt-0.5 text-xs uppercase tracking-[0.12em] text-mute">{m.label}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-xs text-xs leading-relaxed text-mute">
          From{' '}
          <a
            className="underline underline-offset-2 hover:text-copper"
            href={metrics.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {metrics.source}
          </a>
          , retrieved {metrics.updated}. Counts differ from Google Scholar, which indexes a wider
          and noisier set of sources.
        </p>
      </div>
    </section>
  )
}

export default function Home() {
  const page = content.pages.index

  return (
    <>
      <HomeHero page={page} />
      <MetricsBand />
      {page.sections.map((s, i) => (
        <SectionBlock key={i} section={s} />
      ))}
    </>
  )
}
