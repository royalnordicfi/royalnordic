import TourCard from './TourCard'
import { GUARANTEED_NL_CATALOG_ADULT_PRICE } from '../seo/guaranteedNorthernLightsTour'

const TOURS = [
  {
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Northern Lights over Lapland during a Royal Nordic tour',
    title: 'Guaranteed Northern Lights Tour',
    duration: '2–12 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Guaranteed',
    priceFrom: GUARANTEED_NL_CATALOG_ADULT_PRICE,
  },
  {
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family-friendly Northern Lights evening near Rovaniemi',
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
    imageAlt: 'Frozen waterfalls at Korouoma Canyon',
    title: 'Korouoma Canyon Winter Adventure',
    duration: 'About 6 hours',
    groupSize: 'Small group',
    pickup: true,
    priceFrom: 129,
  },
  {
    to: '/ice-fishing',
    image: '/icefishing2.jpg',
    imageAlt: 'Traditional ice fishing on a frozen lake near Rovaniemi',
    title: 'Ice Fishing Experience',
    duration: '3–4 hours',
    groupSize: 'Max 8',
    pickup: true,
    priceFrom: 119,
  },
]

const FeaturedTours = () => {
  return (
    <section className="rn-section-snow" id="tours">
      <div className="rn-container">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="rn-eyebrow !text-aurora-deep">Featured tours</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Bookable experiences
            </h2>
          </div>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((tour) => (
            <TourCard key={tour.to} {...tour} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedTours
