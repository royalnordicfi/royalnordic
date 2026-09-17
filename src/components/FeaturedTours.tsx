import { Link } from 'react-router-dom'
import TourCard from './TourCard'

const TOURS = [
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
  {
    to: '/ice-fishing',
    image: '/icefishing2.jpg',
    imageAlt: 'Ice fishing on a frozen lake',
    title: 'Ice Fishing Experience',
    description: 'Traditional ice fishing with equipment and hot drinks.',
    duration: '3–4 hours',
    groupSize: 'Max 8',
    pickup: true,
    priceFrom: 119,
  },
]

const FeaturedTours = () => {
  return (
    <section className="rn-section bg-midnight">
      <div className="rn-container">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="rn-eyebrow">More experiences</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Day trips &amp; family evenings
            </h2>
          </div>
          <Link
            to="/daytime-experiences"
            className="hidden text-sm font-medium text-aurora-soft transition hover:translate-x-0.5 sm:inline-flex"
          >
            All day tours →
          </Link>
        </div>
        <div className="rn-card-grid mt-8">
          {TOURS.map((tour, i) => (
            <TourCard key={tour.to} {...tour} className={`rn-stagger-${(i % 4) + 1}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedTours
