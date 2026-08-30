import { Link } from 'react-router-dom'

interface Props {
  href: string
  children: React.ReactNode
  variant?: 'solid' | 'outline'
}

/** One control for both in-app routes and external links. */
export default function Button({ href, children, variant = 'outline' }: Props) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors'
  const style =
    variant === 'solid'
      ? 'bg-copper text-white hover:bg-copper-2'
      : 'border border-ink/20 text-ink hover:border-copper hover:text-copper'
  const cls = `${base} ${style}`

  const external = /^(https?:|mailto:)/.test(href)
  if (external) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith('mailto:')
          ? {}
          : { target: '_blank', rel: 'noopener noreferrer' })}
      >
        {children}
        {!href.startsWith('mailto:') && (
          <span aria-hidden className="text-xs opacity-60">
            ↗
          </span>
        )}
      </a>
    )
  }
  return (
    <Link to={href} className={cls}>
      {children}
    </Link>
  )
}
