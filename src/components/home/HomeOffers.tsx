import { Link } from 'react-router-dom'
import { useTourCms } from '../../hooks/useTourCms'
import { displayName, getDisplayPricing } from '../../lib/tourCms'
import { RN_SNOWMOBILE_PROMO } from '../../lib/bokun'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../../seo/guaranteedNorthernLightsTour'

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
 * Seasonal offers — live NL catalogue sale + documented snowmobile RN10.
 * Restored from pre-2.0 FeaturedExperience into the Royal Nordic 2.0 system.
 */
export default function HomeOffers() {
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
      title: tour ? displayName(tour) : GUARANTEED_NL_SHORT_NAME,
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
      className="rn-home-section rn-home-section--sage"
      aria-labelledby="rn-home-offers-heading"
    >
      <div className="rn-container">
        <header className="rn-home-section__head rn-reveal max-w-2xl">
          <p className="rn-home-eyebrow">This season</p>
          <h2 id="rn-home-offers-heading" className="rn-home-h2">
            Offers & discounts
          </h2>
          <p className="rn-home-lede">
            Clear savings on our flagship aurora evening and partner snowmobile safari — discount
            shown up front, final total confirmed at checkout.
          </p>
        </header>

        <div className="rn-home-offers-grid mt-10 sm:mt-12">
          {offers.map((offer) => (
            <Link key={offer.to} to={offer.to} className="rn-home-offer rn-reveal group">
              <div className="rn-home-offer__media">
                <img
                  src={offer.image}
                  alt={offer.imageAlt}
                  className="rn-home-offer__img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="rn-home-offer__shade" aria-hidden />
                <span className="rn-home-offer__badge">{offer.badge}</span>
                <span className="rn-home-offer__pct" aria-label={`${offer.discountLabel} off`}>
                  {offer.discountLabel}
                </span>
              </div>
              <div className="rn-home-offer__body">
                <p className="rn-home-offer__eyebrow">{offer.eyebrow}</p>
                <h3 className="rn-home-offer__title">{offer.title}</h3>
                <p className="rn-home-offer__desc">{offer.description}</p>
                <div className="rn-home-offer__foot">
                  <div
                    className="rn-home-offer__price"
                    aria-label={`Was €${formatMoney(offer.reference)}, now €${formatMoney(offer.current)}`}
                  >
                    <span className="rn-home-offer__was">€{formatMoney(offer.reference)}</span>
                    <span className="rn-home-offer__now">€{formatMoney(offer.current)}</span>
                    <span className="rn-home-offer__unit">/ adult</span>
                  </div>
                  <span className="rn-home-offer__cta">
                    {offer.cta}
                    <span aria-hidden> →</span>
                  </span>
                </div>
                <p className="rn-home-offer__note">{offer.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
