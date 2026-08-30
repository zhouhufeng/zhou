import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-shell px-5 py-24 sm:px-8">
      <p className="kicker">404</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-ink">Page not found</h1>
      <p className="mt-4 max-w-prose">
        That page does not exist here. Try the{' '}
        <Link className="font-medium text-copper underline underline-offset-2" to="/">
          home page
        </Link>
        , the{' '}
        <Link className="font-medium text-copper underline underline-offset-2" to="/publications">
          publication list
        </Link>
        , or the{' '}
        <Link className="font-medium text-copper underline underline-offset-2" to="/research">
          research program
        </Link>
        .
      </p>
    </section>
  )
}
