import Stats from './Stats'
import type { Page } from '../data/content'

/**
 * The home hero: a photographic band with the name, lede, calls to action and
 * headline figures. Inner pages get the compact variant below.
 */
export function HomeHero({ page }: { page: Page }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {page.heroImage && (
        <>
          <img
            src={page.heroImage}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          {/* Two layers: a flat wash for contrast, then a left-weighted gradient
              so the text side stays dark enough to read at any viewport. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-ink/75" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/50"
          />
        </>
      )}

      <div className="mx-auto max-w-shell px-5 py-24 sm:px-8 sm:py-32">
        <div className="max-w-2xl">
          {page.kicker && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-2">
              {page.kicker}
            </p>
          )}
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
            {page.title}
          </h1>
          {page.lede && (
            <p className="mt-6 text-lg leading-relaxed text-white/85">{page.lede}</p>
          )}

          {page.heroActions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {page.heroActions.map((a, i) => (
                <a
                  key={a.href + i}
                  href={a.href}
                  {...(/^https?:/.test(a.href)
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className={[
                    'rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                    i === 0
                      ? 'bg-copper text-white hover:bg-copper-2'
                      : 'border border-white/30 text-white hover:border-copper-2 hover:text-copper-2',
                  ].join(' ')}
                >
                  {a.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {page.heroStats.length > 0 && (
          <div className="mt-16 max-w-3xl border-t border-white/15 pt-8">
            <Stats items={page.heroStats} tone="dark" />
          </div>
        )}
      </div>
    </section>
  )
}

export function PageHero({ page }: { page: Page }) {
  return (
    <section className="border-b border-rule bg-ink text-white">
      <div className="mx-auto max-w-shell px-5 py-16 sm:px-8 sm:py-20">
        {page.kicker && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-copper-2">
            {page.kicker}
          </p>
        )}
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {page.title}
        </h1>
        {page.lede && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/80">{page.lede}</p>
        )}
        {page.heroActions.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-3">
            {page.heroActions.map((a, i) => (
              <a
                key={a.href + i}
                href={a.href}
                {...(/^https?:/.test(a.href)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium
                           text-white transition-colors hover:border-copper-2 hover:text-copper-2"
              >
                {a.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
