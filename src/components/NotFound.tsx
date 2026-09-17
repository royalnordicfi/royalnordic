import { Link } from 'react-router-dom'
import Footer from './Footer'

const NotFound = () => {
  return (
    <div className="rn-page flex min-h-screen flex-col">
      <section className="rn-status-page text-center">
        <div className="pointer-events-none absolute inset-0 rn-ambient-aurora opacity-60" aria-hidden />
        <div className="rn-container relative max-w-md">
          <p className="rn-eyebrow">404</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">Page not found</h1>
          <p className="mt-4 text-text-muted">
            That link may be outdated or mistyped. Head back to the homepage to browse tours and guides.
          </p>
          <Link to="/" className="rn-btn-primary mt-8 inline-flex">
            Back to home
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}

export default NotFound
