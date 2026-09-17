import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'
import TourCard from './TourCard'
import { fetchActiveTourIds } from '../lib/productVisibility'

const ALL_RENTALS = [
  {
    tourId: 2,
    to: '/snowshoe-rental',
    image: '/snowshoe1.jpg',
    imageAlt: 'Snowshoeing in Lapland forest',
    title: 'Quality Snowshoe Rental',
    duration: 'Flexible rental',
    groupSize: 'Solo or groups',
    pickup: true,
    badge: 'Self-guided',
    priceFrom: 79,
    featured: true,
  },
]

const RentingEquipment: React.FC = () => {
  const [activeIds, setActiveIds] = useState<Set<number> | null>(null)

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
  }, [])

  const rentals = useMemo(() => {
    if (!activeIds) return ALL_RENTALS
    return ALL_RENTALS.filter((r) => activeIds.has(r.tourId))
  }, [activeIds])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Equipment Rental in Rovaniemi"
        subtitle="Premium snowshoes for independent winter walks — flexible duration and delivery to your lodging when booked."
        image="/snowshoe2.jpg"
      />

      <section className="rn-section bg-midnight">
        <div className="rn-container">
          {rentals.length === 0 ? (
            <p className="text-center text-text-muted">No equipment rentals are available right now.</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {rentals.map((rental) => (
                <TourCard
                  key={rental.to}
                  to={rental.to}
                  image={rental.image}
                  imageAlt={rental.imageAlt}
                  title={rental.title}
                  duration={rental.duration}
                  groupSize={rental.groupSize}
                  pickup={rental.pickup}
                  badge={rental.badge}
                  priceFrom={rental.priceFrom}
                  featured={rental.featured}
                />
              ))}
            </div>
          )}

          <div className="mt-12 max-w-2xl rounded-rn border border-white/10 bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold text-white">Why rent from us</h2>
            <ul className="mt-4 space-y-2 text-sm text-text-muted">
              <li>Well-maintained snowshoes sized for your group</li>
              <li>Trail tips and local route suggestions included</li>
              <li>Optional delivery to hotels in Rovaniemi</li>
              <li>Book online with secure payment</li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default RentingEquipment
