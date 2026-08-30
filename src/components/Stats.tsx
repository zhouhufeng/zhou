import type { Stat } from '../data/content'

interface Props {
  items: Stat[]
  tone?: 'light' | 'dark'
}

export default function Stats({ items, tone = 'light' }: Props) {
  if (items.length === 0) return null
  const dark = tone === 'dark'

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.label}>
          <dt
            className={`font-display text-3xl font-semibold tabular-nums ${
              dark ? 'text-copper-2' : 'text-ink'
            }`}
          >
            {s.value}
          </dt>
          <dd className={`mt-1 text-xs leading-snug ${dark ? 'text-white/70' : 'text-mute'}`}>
            {s.label}
          </dd>
        </div>
      ))}
    </dl>
  )
}
