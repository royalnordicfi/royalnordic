import { Link } from 'react-router-dom'
import TourCard from '../TourCard'
import { RN_SNOWMOBILE_PROMO } from '../../lib/bokun'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../../seo/guaranteedNorthernLightsTour'

const CARDS = [
  {
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Guests under the Northern Lights in Finnish Lapland',
    title: GUARANTEED_NL_SHORT_NAME,
    description: 'Small-group aurora hunt with hotel pickup and free professional photos.',
    duration: '2–10 hours',
    groupSize: 'Small group · max 8',
    pickup: true,
    badge: 'Aurora',
    priceFrom: GUARANTEED_NL_CATALOG_ADULT_PRICE,
    referencePrice: GUARANTEED_NL_REFERENCE_ADULT_PRICE,
    ctaLabel: 'Check availability',
  },
  {
    to: '/snowmobile-safari',
    image: '/snowmobiling1.jpg',
    imageAlt: 'Arctic snowmobile safari near Rovaniemi',
    title: 'Snowmobile Safari',
    description: 'Guided wilderness ride through Arctic forest trails near Rovaniemi.',
    duration: 'About 2 hours',
    groupSize: '2 per snowmobile',
    pickup: false,
    logistics: 'Meeting point',
    badge: 'Adventure',
    priceFrom: RN_SNOWMOBILE_PROMO.adultWithCode,
    referencePrice: RN_SNOWMOBILE_PROMO.adultRegular,
    ctaLabel: 'View experience',
  },
  {
    to: '/daytime-experiences',
    image: '/ranua5.jpeg',
    imageAlt: 'Wildlife and winter landscapes on a Lapland day tour',
    title: 'Arctic Day Tours',
    description: 'Wildlife, canyon hiking, ice fishing, and cultural day experiences.',
    duration: 'Half & full day',
    groupSize: 'Small group',
    pickup: true,
    badge: 'Day tours',
    ctaLabel: 'Browse day tours',
  },
] as const

export default function HomeFeatured() {
  return (
    <section className="rn-ql-section" aria-labelledby="rn-ql-featured-heading">
      <div className="rn-container">
        <header className="rn-ql-section__head rn-reveal">
          <div>
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Featured Experiences
            </p>
            <h2 id="rn-ql-featured-heading" className="rn-ql-h2 mt-3">
              The Best of Lapland
            </h2>
          </div>
          <Link to="/northern-lights-tours" className="rn-ql-text-link">
            View all experiences
            <span aria-hidden> →</span>
          </Link>
        </header>

        <div className="rn-card-grid rn-card-grid--balanced mt-10 sm:mt-12">
          {CARDS.map((card, i) => (
            <TourCard key={card.to} {...card} className={`rn-reveal rn-stagger-${(i % 3) + 1}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
