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
    description: 'Flexible rental with delivery to your lodging, safety briefing, and local route tips.',
    duration: 'Flexible rental',
    groupSize: 'Solo or groups',
    pickup: true,
    badge: 'Self-guided',
    priceFrom: 79,
    
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

      <section className="rn-section">
        <div className="rn-container space-y-10">
          {rentals.length === 0 ? (
            <p className="text-center text-text-muted">No equipment rentals are available right now.</p>
          ) : (
            <>
              <div className="rn-card-grid max-w-md">
                {rentals.map((rental) => (
                  <TourCard
                    key={rental.to}
                    to={rental.to}
                    image={rental.image}
                    imageAlt={rental.imageAlt}
                    title={rental.title}
                    description={rental.description}
                    duration={rental.duration}
                    groupSize={rental.groupSize}
                    pickup={rental.pickup}
                    badge={rental.badge}
                    priceFrom={rental.priceFrom}
                  />
                ))}
              </div>

              <div className="max-w-2xl border-y border-white/[0.08] py-8">
                <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Why rent from us</h2>
                <ul className="mt-4 space-y-2 text-sm text-text-muted">
                  <li>Well-maintained snowshoes sized for your group</li>
                  <li>Trail tips and local route suggestions included</li>
                  <li>Optional delivery to hotels in Rovaniemi</li>
                  <li>Book online with secure payment</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default RentingEquipment
