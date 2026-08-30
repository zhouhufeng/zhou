import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { site } from '../data/content'
import { nav } from '../data/nav'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3" aria-label={`${site.name} home`}>
      <span
        className="grid h-10 w-10 place-items-center rounded-lg bg-ink font-display
                   text-sm font-bold tracking-tight text-copper-2"
      >
        {site.shortName}
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-semibold text-ink">{site.name}</span>
        <span className="block text-xs uppercase tracking-[0.14em] text-mute">
          {site.discipline}
        </span>
      </span>
    </Link>
  )
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-full px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-sand text-ink' : 'text-slate hover:text-copper',
  ].join(' ')

/** The Research menu: a hover/focus dropdown on desktop, inline on mobile. */
function ResearchMenu({ item }: { item: (typeof nav)[number] }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])

  // Close on outside click and on Escape, so the menu never strands the page.
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const active = pathname.startsWith('/research')

  return (
    <div
      ref={box}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={[
          'flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors',
          active ? 'bg-sand text-ink' : 'text-slate hover:text-copper',
        ].join(' ')}
      >
        {item.label}
        <span aria-hidden className={`text-[0.6rem] transition-transform ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 w-[19rem] rounded-xl border border-rule
                     bg-white p-3 shadow-xl shadow-ink/5"
        >
          <Link
            to={item.to}
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-2"
          >
            Research program overview
          </Link>
          {item.groups?.map((g) => (
            <div key={g.label} className="mt-2 border-t border-rule pt-2">
              <p className="px-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
                {g.label}
              </p>
              {g.items.map((s) => (
                <NavLink
                  key={s.to}
                  to={s.to}
                  className={({ isActive }) =>
                    [
                      'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                      isActive ? 'bg-sand text-ink' : 'text-slate hover:bg-paper-2 hover:text-copper',
                    ].join(' ')
                  }
                >
                  {s.label}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Header() {
  const [mobile, setMobile] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setMobile(false), [pathname])

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-shell items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Brand />

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.groups ? (
              <ResearchMenu key={item.to} item={item} />
            ) : (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>

        <button
          type="button"
          onClick={() => setMobile((v) => !v)}
          aria-expanded={mobile}
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium text-ink lg:hidden"
        >
          Menu
        </button>
      </div>

      {mobile && (
        <nav aria-label="Main, mobile" className="border-t border-rule bg-white px-5 py-4 lg:hidden">
          {nav.map((item) => (
            <div key={item.to} className="border-b border-rule py-2 last:border-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `block text-sm font-semibold ${isActive ? 'text-copper' : 'text-ink'}`
                }
              >
                {item.label}
              </NavLink>
              {item.groups?.map((g) => (
                <div key={g.label} className="mt-2 pl-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-mute">
                    {g.label}
                  </p>
                  {g.items.map((s) => (
                    <NavLink
                      key={s.to}
                      to={s.to}
                      className={({ isActive }) =>
                        `block py-1 text-sm ${isActive ? 'text-copper' : 'text-slate'}`
                      }
                    >
                      {s.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </nav>
      )}
    </header>
  )
}
