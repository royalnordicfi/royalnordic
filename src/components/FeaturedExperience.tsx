import { Link } from 'react-router-dom'

const FeaturedExperience = () => {
  return (
    <section className="rn-section relative overflow-hidden" aria-label="Guaranteed Northern Lights Tour">
      <div className="pointer-events-none absolute inset-0 rn-ambient-aurora" aria-hidden />
      <div className="rn-container relative">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="rn-reveal relative overflow-hidden rounded-rn bg-black lg:col-span-7">
            <div className="aspect-[16/10]">
              <img
                src="/nortti1.jpg"
                alt="Guests watching the Northern Lights near Rovaniemi"
                className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <span className="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-aurora-soft">
              Signature experience
            </span>
          </div>

          <div className="rn-reveal lg:col-span-5">
            <p className="rn-eyebrow">From €149</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-[2.35rem]">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-muted sm:text-base">
              We drive where the skies are clearest. Small groups, hotel pickup, and photography
              guidance. If you don’t see the Northern Lights, you can join us again for free
              according to our guarantee terms.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-text-muted">
              {[
                'Northern Lights guarantee (see Terms)',
                'Max 8 guests per vehicle',
                'Hotel pickup in Rovaniemi',
                'Photography included',
              ].map((line) => (
                <li key={line} className="flex gap-2.5">
                  <span className="text-aurora" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
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
