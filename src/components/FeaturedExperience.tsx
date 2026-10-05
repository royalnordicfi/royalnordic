import { Link } from 'react-router-dom'
import { useTourCms } from '../hooks/useTourCms'
import { displayName, getDisplayPricing } from '../lib/tourCms'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'

const FeaturedExperience = () => {
  const { tour } = useTourCms(1)
  const pricing = tour
    ? getDisplayPricing(tour)
    : {
        current: GUARANTEED_NL_CATALOG_ADULT_PRICE,
        saleActive: true,
        reference: GUARANTEED_NL_REFERENCE_ADULT_PRICE,
        saveAmount: 30,
        label: 'Special offer',
        child: GUARANTEED_NL_CATALOG_ADULT_PRICE,
      }

  const title = tour ? displayName(tour) : 'Guaranteed Northern Lights Tour'
  const lede = tour?.tagline?.trim() || GUARANTEED_NL_HERO_PROMISE
  const card =
    tour?.card_description?.trim() ||
    `${lede} Small groups, hotel pickup, and free professional photos of you beneath the aurora.`
  const meta = tour?.highlights?.length
    ? tour.highlights.slice(0, 4).map((h) => h.text)
    : [
        'Max 8 guests per vehicle',
        'Hotel pickup in Rovaniemi',
        'Free professional photos of you with the aurora',
        GUARANTEED_NL_GUARANTEE_SHORT,
      ]
  const image = tour?.hero_image_url || tour?.gallery?.[0]?.url || '/nordicci1.jpg'

  return (
    <section
      className="relative overflow-hidden bg-midnight pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14"
      aria-label={title}
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
                  src={image}
                  alt="A guest points up at a vivid green aurora over Finnish Lapland"
                  className="rn-signature-card__img"
                  loading="lazy"
                />
                <div className="rn-tour-card__shade" aria-hidden />
                <span className="rn-signature-card__label">
                  {tour?.badge || 'Signature · Guaranteed'}
                </span>
              </div>
            </div>
            <div className="rn-price-chip">
              {pricing.saleActive && pricing.reference != null ? (
                <>
                  <span className="rn-price-chip__label">{pricing.label || 'Special offer'}</span>
                  <div className="rn-price-chip__row">
                    <span className="rn-price-chip__was">€{pricing.reference}</span>
                    <span className="rn-price-chip__value">€{pricing.current}</span>
                  </div>
                  {pricing.saveAmount > 0 ? (
                    <span className="rn-price-chip__save">Save €{pricing.saveAmount}</span>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="rn-price-chip__label">From</span>
                  <div className="rn-price-chip__row">
                    <span className="rn-price-chip__value">€{pricing.current}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="rn-reveal min-w-0 flex-1">
            <p className="rn-eyebrow">Rovaniemi · Flagship experience</p>
            <h2 className="rn-h2 mt-2.5 text-white">{title}</h2>
            <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-text-muted sm:text-[15.5px] sm:leading-[1.65]">
              {card}
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {meta.map((line) => (
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
                className="rn-btn-primary w-full justify-center px-7 sm:w-auto min-h-[48px]"
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
