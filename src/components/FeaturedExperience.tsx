import { Link } from 'react-router-dom'
import { GUARANTEED_NL_CATALOG_ADULT_PRICE } from '../seo/guaranteedNorthernLightsTour'

const META = [
  'Max 8 guests',
  'Hotel pickup in Rovaniemi',
  'Professional photos of you with the aurora',
  '100% refund or reschedule if no lights — see Terms',
]

const FeaturedExperience = () => {
  return (
    <section
      className="relative overflow-hidden bg-midnight pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14"
      aria-label="Guaranteed Northern Lights Tour"
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-black/40 to-black sm:h-36"
        aria-hidden
      />
      <div className="rn-container relative">
        <div className="flex flex-col gap-9 lg:flex-row lg:items-center lg:gap-16 xl:gap-20">
          <div className="rn-reveal relative w-full shrink-0 pb-3 lg:w-[44%] lg:pb-0">
            <div className="rn-signature-glow" aria-hidden />
            <div className="rn-signature-card group relative">
              <div className="rn-signature-card__media rn-signature-card__media--tall">
                <img
                  src="/nordicci1.jpg"
                  alt="A guest points up at a vivid green aurora over Finnish Lapland"
                  className="rn-signature-card__img"
                  loading="lazy"
                />
                <div className="rn-tour-card__shade" aria-hidden />
                <span className="rn-signature-card__label">Signature · Guaranteed</span>
              </div>
            </div>
            <div className="rn-price-chip">
              <span className="rn-price-chip__label">From</span>
              <span className="rn-price-chip__value">€{GUARANTEED_NL_CATALOG_ADULT_PRICE}</span>
            </div>
          </div>

          <div className="rn-reveal min-w-0 flex-1">
            <p className="rn-eyebrow">Rovaniemi · Flagship experience</p>
            <h2 className="rn-h2 mt-2.5 text-white">Guaranteed Northern Lights Tour</h2>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-text-muted sm:text-[15.5px] sm:leading-[1.65]">
              Our flagship aurora hunt. Small groups, guided by locals who chase clear sky across
              Lapland — and if the lights don't show, you're welcome back on us.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {META.map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[13px] text-text-muted">
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aurora-soft/70"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/northern-lights-tour"
                className="rn-btn-primary w-full justify-center px-7 sm:w-auto"
              >
                Check availability
              </Link>
              <Link
                to="/northern-lights-tours"
                className="text-center text-sm font-semibold text-white/70 transition hover:text-aurora-soft sm:text-left"
              >
                Compare aurora evenings →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience
