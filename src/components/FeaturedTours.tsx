import TourCard from './TourCard'

const TOURS = [
  {
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Northern Lights over Lapland forest',
    title: 'Guaranteed Northern Lights Tour',
    duration: '2–12 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Guaranteed',
    priceFrom: 149,
  },
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
    title: 'Korouoma Canyon Winter Adventure',
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
        <div className="max-w-2xl">
          <p className="rn-eyebrow">Featured tours</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            Bookable experiences
          </h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TOURS.map((tour) => (
            <TourCard key={tour.to} {...tour} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturedTours
