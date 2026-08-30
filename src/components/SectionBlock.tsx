import Button from './Button'
import Cards from './Cards'
import PublicationList from './PublicationList'
import RichText from './RichText'
import Stats from './Stats'
import type { Section } from '../data/content'

/**
 * One extracted section. The source site alternates plain and tinted bands and
 * pairs some sections with a figure; both are preserved here.
 */
export default function SectionBlock({ section }: { section: Section }) {
  const {
    kicker, heading, lede, tags, alt, prose, cards, stats, publications, actions, image, imageAlt,
  } = section

  const hasFigure = Boolean(image)
  const body = (
    <>
      {(kicker || heading || lede) && (
        <div className="max-w-prose">
          {kicker && <p className="kicker">{kicker}</p>}
          {heading && (
            <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              {heading}
            </h2>
          )}
          {lede && <p className="mt-3 text-lg leading-relaxed text-slate">{lede}</p>}
        </div>
      )}

      {prose && <RichText html={prose} className="mt-5 max-w-prose" />}

      {tags.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2">
          {tags.map((t) => (
            <li
              key={t}
              className="rounded-full border border-rule bg-white px-3 py-1 text-xs font-medium text-slate"
            >
              {t}
            </li>
          ))}
        </ul>
      )}

      {stats.length > 0 && (
        <div className="mt-8">
          <Stats items={stats} />
        </div>
      )}

      {actions.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-3">
          {actions.map((a, i) => (
            <Button key={a.href + i} href={a.href} variant={i === 0 ? 'solid' : 'outline'}>
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </>
  )

  return (
    <section className={alt ? 'border-y border-rule bg-paper-2' : ''}>
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20">
        {hasFigure ? (
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>{body}</div>
            <figure className="overflow-hidden rounded-xl border border-rule bg-white">
              <img
                src={image!}
                alt={imageAlt || heading || ''}
                loading="lazy"
                className="w-full object-contain"
              />
            </figure>
          </div>
        ) : (
          body
        )}

        {cards.length > 0 && (
          <div className="mt-10">
            <Cards items={cards} />
          </div>
        )}

        {publications.length > 0 && (
          <div className="mt-10">
            <PublicationList items={publications} />
          </div>
        )}
      </div>
    </section>
  )
}
