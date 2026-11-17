import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_BENEFITS,
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_PRODUCT_NAME,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../../seo/guaranteedNorthernLightsTour'

export default function HomeFlagship() {
  return (
    <section className="rn-home-flagship relative overflow-hidden" aria-labelledby="rn-home-flag-heading">
      <div className="rn-home-flagship__media absolute inset-0" aria-hidden>
        <img
          src="/nortti3.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="rn-home-flagship__veil" />
      </div>

      <div className="rn-container relative z-10 py-16 sm:py-20 lg:py-24">
        <div className="rn-home-flagship__panel rn-reveal max-w-xl">
          <p className="rn-home-eyebrow rn-home-eyebrow--on-dark">Northern Lights</p>
          <h2 id="rn-home-flag-heading" className="rn-home-h2 rn-home-h2--on-dark mt-3">
            {GUARANTEED_NL_SHORT_NAME}
          </h2>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/78 sm:text-base">
            {GUARANTEED_NL_HERO_PROMISE} {GUARANTEED_NL_GUARANTEE_SHORT}
          </p>
          <ul className="rn-home-flagship__list mt-6">
            {GUARANTEED_NL_BENEFITS.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/northern-lights-tour" className="rn-home-btn rn-home-btn--primary">
              Check availability
            </Link>
            <Link to="/northern-lights-tours" className="rn-home-btn rn-home-btn--ghost">
              All aurora tours
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/60">
            <span className="line-through opacity-60">€{GUARANTEED_NL_REFERENCE_ADULT_PRICE}</span>{' '}
            <span className="font-display text-lg font-semibold text-[var(--rn-sale-soft)]">
              €{GUARANTEED_NL_CATALOG_ADULT_PRICE}
            </span>{' '}
            / adult · {GUARANTEED_NL_PRODUCT_NAME}
          </p>
        </div>
      </div>
    </section>
  )
}
