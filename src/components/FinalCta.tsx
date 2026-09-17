import { Link } from 'react-router-dom'

const FinalCta = () => {
  return (
    <section className="rn-section-snow !py-16 sm:!py-20">
      <div className="rn-container">
        <div className="rounded-rn-lg bg-midnight px-6 py-12 text-center text-snow sm:px-10 sm:py-14">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Ready for a clearer night under the aurora?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-snow/70">
            Book the Guaranteed Northern Lights Tour direct — small group, hotel pickup, and secure
            online payment.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/northern-lights-tour" className="rn-btn-primary px-8">
              Book Guaranteed Northern Lights
            </Link>
            <Link to="/#contact" className="rn-btn-secondary px-8">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FinalCta
