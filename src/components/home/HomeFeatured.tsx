import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../../seo/guaranteedNorthernLightsTour'

const PCT = Math.round(
  ((GUARANTEED_NL_REFERENCE_ADULT_PRICE - GUARANTEED_NL_CATALOG_ADULT_PRICE) /
    GUARANTEED_NL_REFERENCE_ADULT_PRICE) *
    100,
)

const CARDS = [
  {
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    alt: 'Guests under the Northern Lights in Finnish Lapland',
    title: GUARANTEED_NL_SHORT_NAME,
    meta: `Small group · From €${GUARANTEED_NL_CATALOG_ADULT_PRICE}`,
    badge: PCT > 0 ? `−${PCT}%` : undefined,
  },
  {
    to: '/snowmobile-safari',
    image: '/snowmobiling1.jpg',
    alt: 'Arctic snowmobile safari near Rovaniemi',
    title: 'Snowmobile Safari',
    meta: 'Guided wilderness ride',
  },
  {
    to: '/daytime-experiences',
    image: '/ranua5.jpeg',
    alt: 'Wildlife and winter landscapes on a Lapland day tour',
    title: 'Arctic Day Tours',
    meta: 'Wildlife · Nature · Culture',
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

        <ul className="rn-ql-featured rn-stagger mt-10 sm:mt-12">
          {CARDS.map((card) => (
            <li key={card.to}>
              <Link to={card.to} className="rn-ql-feat-card rn-reveal group">
                <img
                  src={card.image}
                  alt={card.alt}
                  className="rn-ql-feat-card__img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="rn-ql-feat-card__shade" aria-hidden />
                {'badge' in card && card.badge ? (
                  <span className="rn-ql-feat-card__badge">{card.badge}</span>
                ) : null}
                <div className="rn-ql-feat-card__body">
                  <h3 className="rn-ql-feat-card__title">{card.title}</h3>
                  <p className="rn-ql-feat-card__meta">{card.meta}</p>
                </div>
                <span className="rn-ql-feat-card__arrow" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
