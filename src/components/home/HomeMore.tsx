import { Link } from 'react-router-dom'
import TourCard from '../TourCard'

const TOURS = [
  {
    to: '/private-santa-claus-experience',
    image: '/santaclaus1.jpg',
    imageAlt: 'Private Santa Claus Experience in Rovaniemi',
    title: 'Private Santa Claus Experience',
    description: 'Exclusive private meeting with Santa Claus, private transfers and festive treats.',
    duration: 'Approximately 1.5 hours',
    groupSize: 'Up to 6 guests',
    pickup: true,
    badge: 'Private',
    priceFrom: 1169,
    priceUnit: '/ private group',
    imagePosition: 'center 42%',
  },
  {
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family Northern Lights evening',
    title: 'Family-Friendly Northern Lights',
    description: 'Shorter evening format designed for families.',
    duration: '2 hours',
    groupSize: 'Family format',
    pickup: true,
    badge: 'Family',
    priceFrom: 79,
  },
  {
    to: '/korouoma-canyon',
    image: '/korouoma1.jpg',
    imageAlt: 'Korouoma Canyon in winter',
    title: 'Korouoma Canyon',
    description: 'Frozen waterfalls and a guided canyon hike.',
    duration: 'About 6 hours',
    groupSize: 'Small group',
    pickup: true,
    priceFrom: 129,
  },
] as const

/**
 * Product-level featured experiences beyond flagship NL.
 * Prices and copy match the existing FeaturedTours catalogue.
 */
export default function HomeMore() {
  return (
    <section
      className="rn-home-section rn-home-section--ivory"
      aria-labelledby="rn-home-more-heading"
    >
      <div className="rn-container">
        <header className="rn-home-section__head rn-reveal flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <p className="rn-home-eyebrow">More experiences</p>
            <h2 id="rn-home-more-heading" className="rn-home-h2">
              Day trips & family evenings
            </h2>
            <p className="rn-home-lede">
              Beyond the aurora hunt — winter day tours and family formats with hotel pickup where
              listed.
            </p>
          </div>
          <Link to="/daytime-experiences" className="rn-home-btn rn-home-btn--text shrink-0">
            All day tours →
          </Link>
        </header>

        <div className="rn-home-more-grid mt-10 sm:mt-12">
          {TOURS.map((tour) => (
            <TourCard key={tour.to} {...tour} className="rn-home-more-card rn-reveal" />
          ))}
        </div>
      </div>
    </section>
  )
}
