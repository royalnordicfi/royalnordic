import { Link } from 'react-router-dom'
import { useTourCms } from '../hooks/useTourCms'
import { displayName, getDisplayPricing } from '../lib/tourCms'
import { RN_SNOWMOBILE_PROMO } from '../lib/bokun'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'

type OfferCard = {
  to: string
  image: string
  imageAlt: string
  eyebrow: string
  title: string
  description: string
  badge: string
  current: number
  reference: number
  discountLabel: string
  note: string
  cta: string
}

function formatMoney(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function discountPercent(reference: number, current: number) {
  if (reference <= 0 || current >= reference) return 0
  return Math.round(((reference - current) / reference) * 100)
}

/**
 * Homepage offers strip — compact dual cards for live discounts
 * (Guaranteed NL catalogue sale + RN10 snowmobile).
 */
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
      }

  const nlCurrent = pricing.current
  const nlReference =
    pricing.saleActive && pricing.reference != null
      ? pricing.reference
      : GUARANTEED_NL_REFERENCE_ADULT_PRICE
  const nlPct = discountPercent(nlReference, nlCurrent)

  const snow = RN_SNOWMOBILE_PROMO
  const snowPct = snow.percent

  const offers: OfferCard[] = [
    {
      to: '/northern-lights-tour',
      image: tour?.hero_image_url || tour?.gallery?.[0]?.url || '/nordicci1.jpg',
      imageAlt: 'Guests under the Northern Lights in Finnish Lapland',
      eyebrow: 'Rovaniemi · Aurora',
      title: tour ? displayName(tour) : 'Guaranteed Northern Lights Tour',
      description: '100% aurora guarantee, hotel pickup, and free professional photos.',
      badge: tour?.badge || 'Special offer',
      current: nlCurrent,
      reference: nlReference,
      discountLabel: nlPct > 0 ? `−${nlPct}%` : 'Offer',
      note: 'Catalogue price · no code needed',
      cta: 'Book aurora',
    },
    {
      to: '/snowmobile-safari',
      image: '/snowmobiling1.jpg',
      imageAlt: 'Arctic snowmobile safari near Rovaniemi',
      eyebrow: 'Rovaniemi · Partner',
      title: 'Arctic Snowmobile Safari',
      description: `Guided wilderness ride with ~75 minutes of driving. Use code ${snow.code} at checkout.`,
      badge: `${snow.code} · −${snowPct}%`,
      current: snow.adultWithCode,
      reference: snow.adultRegular,
      discountLabel: `−${snowPct}%`,
      note: `With code ${snow.code} at Bókun checkout`,
      cta: 'Book safari',
    },
  ]

  return (
    <section
      className="rn-offers relative overflow-hidden bg-midnight pb-12 pt-8 sm:pb-14 sm:pt-10 lg:pb-16 lg:pt-12"
      aria-labelledby="rn-offers-heading"
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
      <div className="rn-container relative">
        <header className="rn-reveal max-w-2xl">
          <p className="rn-eyebrow">This season</p>
          <h2 id="rn-offers-heading" className="rn-h2 mt-2.5 text-white">
            Offers & discounts
          </h2>
          <p className="mt-3 max-w-xl text-[14.5px] leading-relaxed text-text-muted sm:text-[15px]">
            Clear savings on our flagship aurora evening and partner snowmobile safari — discount
            shown up front, final total confirmed at checkout.
          </p>
        </header>

        <div className="rn-offers__grid mt-8 sm:mt-9">
          {offers.map((offer, i) => (
            <Link
              key={offer.to}
              to={offer.to}
              className="rn-offer-card rn-reveal group"
              style={{ ['--rn-offer-delay' as string]: `${i * 90}ms` }}
            >
              <div className="rn-offer-card__media">
                <img
                  src={offer.image}
                  alt={offer.imageAlt}
                  className="rn-offer-card__img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="rn-offer-card__shade" aria-hidden />
                <span className="rn-offer-card__badge">{offer.badge}</span>
                <span className="rn-offer-card__pct" aria-label={`${offer.discountLabel} off`}>
                  {offer.discountLabel}
                </span>
              </div>

              <div className="rn-offer-card__body">
                <p className="rn-offer-card__eyebrow">{offer.eyebrow}</p>
                <h3 className="rn-offer-card__title">{offer.title}</h3>
                <p className="rn-offer-card__desc">{offer.description}</p>

                <div className="rn-offer-card__foot">
                  <div className="rn-offer-card__price" aria-label={`Was €${formatMoney(offer.reference)}, now €${formatMoney(offer.current)}`}>
                    <span className="rn-offer-card__was">€{formatMoney(offer.reference)}</span>
                    <span className="rn-offer-card__now">€{formatMoney(offer.current)}</span>
                    <span className="rn-offer-card__unit">/ adult</span>
                  </div>
                  <span className="rn-offer-card__cta">
                    {offer.cta}
                    <span aria-hidden> →</span>
                  </span>
                </div>
                <p className="rn-offer-card__note">{offer.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience
