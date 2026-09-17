import { Link } from 'react-router-dom'
import TourCard from './TourCard'

/** Supporting bookable tours — Guaranteed NL is featured above, not repeated here. */
const TOURS = [
  {
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family Northern Lights evening',
    title: 'Family-Friendly Northern Lights',
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
            className="hidden text-sm font-semibold text-aurora-soft hover:underline sm:inline"
          >
            All day tours →
          </Link>
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {TOURS.map((tour) => (
            <TourCard key={tour.to} {...tour} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedTours
