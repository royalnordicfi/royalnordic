import { Link } from 'react-router-dom'

const FinalCta = () => {
  return (
    <section className="rn-section-tight border-y border-white/10 bg-surface">
      <div className="rn-container flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
            Ready for a clearer night under the aurora?
          </h2>
          <p className="mt-3 text-text-muted">
            Book the Guaranteed Northern Lights Tour direct — small group, hotel pickup, and secure
            online payment.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/northern-lights-tour" className="rn-btn-primary">
            Book Guaranteed Northern Lights
          </Link>
          <a href="#contact" className="rn-btn-secondary">
            Contact us
          </a>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
