import { Link } from 'react-router-dom'

const FeaturedExperience = () => {
  return (
    <section
      className="rn-section relative overflow-hidden border-y border-white/[0.06]"
      aria-label="Guaranteed Northern Lights Tour"
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
      <div className="rn-container relative">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-14">
          <div className="rn-reveal w-full max-w-[19rem] shrink-0 lg:max-w-[21rem]">
            <div className="rn-signature-card group">
              <div className="rn-signature-card__media">
                <img
                  src="/nortti1.jpg"
                  alt="Guests watching the Northern Lights near Rovaniemi"
                  className="rn-signature-card__img"
                  loading="lazy"
                />
                <div className="rn-tour-card__shade" aria-hidden />
                <span className="rn-signature-card__label">Signature · Guaranteed</span>
              </div>
            </div>
          </div>

          <div className="rn-reveal min-w-0 flex-1 lg:pt-1">
            <p className="rn-eyebrow">From €149 · Rovaniemi</p>
            <h2 className="mt-2 font-display text-[1.55rem] font-semibold leading-tight text-white sm:text-[1.85rem] lg:text-[2rem]">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-muted sm:text-base">
              We drive where the skies are clearest. Small groups, hotel pickup, and photography
              guidance. If you don’t see the Northern Lights, you can join us again for free according
              to our guarantee terms.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
              {[
                'Northern Lights guarantee (see Terms)',
                'Max 8 guests per vehicle',
                'Hotel pickup in Rovaniemi',
                'Photography included',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-aurora" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link to="/northern-lights-tour" className="rn-btn-primary">
                Book now
              </Link>
              <Link to="/northern-lights-tour#book" className="rn-btn-secondary">
                Check availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience
