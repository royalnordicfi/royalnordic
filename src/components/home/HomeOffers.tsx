import { Link } from 'react-router-dom'
import { useTourCms } from '../../hooks/useTourCms'
import { displayName, getDisplayPricing } from '../../lib/tourCms'
import { RN_SNOWMOBILE_PROMO } from '../../lib/bokun'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../../seo/guaranteedNorthernLightsTour'

function formatMoney(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function discountPercent(reference: number, current: number) {
  if (reference <= 0 || current >= reference) return 0
  return Math.round(((reference - current) / reference) * 100)
}

/** Live catalogue offers — NL sale + snowmobile RN10. */
export default function HomeOffers() {
  const { tour } = useTourCms(1)
  const pricing = tour
    ? getDisplayPricing(tour)
    : {
        current: GUARANTEED_NL_CATALOG_ADULT_PRICE,
        saleActive: true,
        reference: GUARANTEED_NL_REFERENCE_ADULT_PRICE,
      }

  const nlCurrent = pricing.current
  const nlReference =
    pricing.saleActive && pricing.reference != null
      ? pricing.reference
      : GUARANTEED_NL_REFERENCE_ADULT_PRICE
  const nlPct = discountPercent(nlReference, nlCurrent)
  const snow = RN_SNOWMOBILE_PROMO

  const offers = [
    {
      to: '/northern-lights-tour',
      image: tour?.hero_image_url || tour?.gallery?.[0]?.url || '/nordicci1.jpg',
      alt: 'Guests under the Northern Lights in Finnish Lapland',
      eyebrow: 'Aurora',
      title: tour ? displayName(tour) : GUARANTEED_NL_SHORT_NAME,
      text: 'Hotel pickup, free professional photos, and aurora guarantee.',
      current: nlCurrent,
      reference: nlReference,
      note: 'Catalogue price · no code needed',
      badge: nlPct > 0 ? `−${nlPct}%` : 'Offer',
      cta: 'Book aurora',
    },
    {
      to: '/snowmobile-safari',
      image: '/snowmobiling5.jpg',
      alt: 'Arctic snowmobile safari near Rovaniemi',
      eyebrow: 'Partner',
      title: 'Arctic Snowmobile Safari',
      text: `About 75 minutes of driving. Use code ${snow.code} at checkout.`,
      current: snow.adultWithCode,
      reference: snow.adultRegular,
      note: `With code ${snow.code} at Bókun checkout`,
      badge: `${snow.code} · −${snow.percent}%`,
      cta: 'Book safari',
    },
  ]

  return (
    <section className="rn-ql-section rn-ql-section--inset" aria-labelledby="rn-ql-offers-heading">
      <div className="rn-container">
        <header className="rn-ql-section__head rn-reveal">
          <div>
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              This season
            </p>
            <h2 id="rn-ql-offers-heading" className="rn-ql-h2 mt-3">
              Offers & discounts
            </h2>
          </div>
        </header>

        <div className="rn-ql-offers mt-10 sm:mt-12">
          {offers.map((offer) => (
            <Link key={offer.to} to={offer.to} className="rn-ql-offer rn-reveal group">
              <div className="rn-ql-offer__media">
                <img src={offer.image} alt={offer.alt} loading="lazy" decoding="async" />
                <span className="rn-ql-offer__badge">{offer.badge}</span>
              </div>
              <div className="rn-ql-offer__body">
                <p className="rn-ql-offer__eyebrow">{offer.eyebrow}</p>
                <h3 className="rn-ql-offer__title">{offer.title}</h3>
                <p className="rn-ql-offer__text">{offer.text}</p>
                <div className="rn-ql-offer__foot">
                  <p className="rn-ql-offer__price">
                    <span className="rn-ql-offer__was">€{formatMoney(offer.reference)}</span>
                    <span className="rn-ql-offer__now">€{formatMoney(offer.current)}</span>
                    <span className="rn-ql-offer__unit">/ adult</span>
                  </p>
                  <span className="rn-ql-text-link">
                    {offer.cta}
                    <span aria-hidden> →</span>
                  </span>
                </div>
                <p className="rn-ql-offer__note">{offer.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
