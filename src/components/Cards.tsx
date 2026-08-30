import { Link } from 'react-router-dom'
import RichText from './RichText'
import type { Card } from '../data/content'

function Shell({ card, children }: { card: Card; children: React.ReactNode }) {
  const cls =
    'group flex h-full flex-col overflow-hidden rounded-xl border border-rule bg-white ' +
    'transition-colors hover:border-copper/50'

  if (!card.href) return <div className={cls}>{children}</div>
  if (/^https?:/.test(card.href)) {
    return (
      <a className={cls} href={card.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }
  return (
    <Link className={cls} to={card.href}>
      {children}
    </Link>
  )
}

export default function Cards({ items }: { items: Card[] }) {
  if (items.length === 0) return null
  const withArt = items.some((c) => c.image)

  return (
    <ul className={`grid gap-5 ${withArt ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-3'}`}>
      {items.map((card, i) => (
        <li key={`${card.title}-${i}`}>
          <Shell card={card}>
            {card.image && (
              <img
                src={card.image}
                alt={card.imageAlt || ''}
                loading="lazy"
                className="aspect-[16/10] w-full border-b border-rule bg-paper-2 object-cover"
              />
            )}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg font-semibold text-ink group-hover:text-copper">
                {card.title}
              </h3>
              <RichText html={card.html} className="mt-2 text-[0.95rem]" />
              {card.linkLabel && (
                <span className="mt-4 text-sm font-medium text-copper">
                  {card.linkLabel} <span aria-hidden>→</span>
                </span>
              )}
            </div>
          </Shell>
        </li>
      ))}
    </ul>
  )
}
