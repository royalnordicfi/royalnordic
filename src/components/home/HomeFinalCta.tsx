import { Link } from 'react-router-dom'

export default function HomeFinalCta() {
  return (
    <section className="rn-home-final" aria-labelledby="rn-home-final-heading">
      <div className="rn-container">
        <div className="rn-home-final__panel rn-reveal">
          <div className="max-w-xl">
            <p className="rn-home-eyebrow rn-home-eyebrow--on-dark">Book direct</p>
            <h2 id="rn-home-final-heading" className="rn-home-h2 rn-home-h2--on-dark mt-3">
              Ready when you are
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/72 sm:text-base">
              Check availability for our Small Group Northern Lights tour, or tell us what kind of
              Lapland trip you need — we reply personally.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-0">
            <Link to="/northern-lights-tour" className="rn-home-btn rn-home-btn--primary">
              Check availability
            </Link>
            <Link to="/contact" className="rn-home-btn rn-home-btn--ghost">
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
