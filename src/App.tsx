import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import { content, pagesByRoute } from './data/content'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Publications from './pages/Publications'
import StandardPage from './pages/StandardPage'

/**
 * Every route except home and publications is a plain section render, so they
 * are generated from the content rather than hand-listed — adding a page to the
 * source site means re-running the scraper, not editing this file.
 */
const GENERATED = Object.values(content.pages).filter(
  (p) => p.route !== '/' && p.route !== '/publications',
)

function useRouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    const page = pagesByRoute[pathname]
    document.title = page && pathname !== '/'
      ? `${page.title} — Hufeng Zhou`
      : 'Hufeng Zhou, PhD — Computational Biology'
  }, [pathname])
}

export default function App() {
  useRouteEffects()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]
                   focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <Header />

      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/publications" element={<Publications />} />
          {GENERATED.map((page) => (
            <Route key={page.route} path={page.route} element={<StandardPage page={page} />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </>
  )
}
