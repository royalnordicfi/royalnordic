import { Link } from 'react-router-dom'

const FeaturedExperience = () => {
  return (
    <section className="rn-section bg-midnight" aria-label="Guaranteed Northern Lights Tour">
      <div className="rn-container">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="relative aspect-[4/3] overflow-hidden rounded-rn bg-black sm:aspect-[5/4]">
            <img
              src="/nortti1.jpg"
              alt="Guests watching the Northern Lights near Rovaniemi"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            <span className="absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-aurora-soft">
              Signature
            </span>
          </div>

          <div>
            <p className="rn-eyebrow">From €149</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-text-muted sm:text-base">
              We drive where the skies are clearest. Small groups, hotel pickup, and photography
              guidance. If you don’t see the Northern Lights, you can join us again for free
              according to our guarantee terms.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-text-muted">
              {[
                'Northern Lights guarantee (see Terms)',
                'Max 8 guests per vehicle',
                'Hotel pickup in Rovaniemi',
                'Flexible duration based on forecasts',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-aurora">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
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
