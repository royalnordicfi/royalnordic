import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
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
        subtitle="Premium snowshoes for independent winter walks — flexible duration and delivery when booked."
        image="/snowshoe2.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow pt-0 pb-10 sm:pb-12">
        <div className="rn-container">
          {rentals.length === 0 ? (
            <p className="text-center text-text-muted">No equipment rentals are available right now.</p>
          ) : (
            <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-14">
              <div className="lg:col-span-5 xl:col-span-4">
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

              <div className="lg:col-span-7 xl:col-span-8 lg:pt-1">
                <p className="rn-eyebrow">Included</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-[1.75rem]">
                  Why rent from us
                </h2>
                <ul className="mt-6 space-y-0 text-sm leading-relaxed text-text-muted sm:text-[15px]">
                  <li className="border-t border-white/[0.08] py-4">
                    Well-maintained snowshoes sized for your group
                  </li>
                  <li className="border-t border-white/[0.08] py-4">
                    Trail tips and local route suggestions included
                  </li>
                  <li className="border-t border-white/[0.08] py-4">
                    Optional delivery to hotels in Rovaniemi
                  </li>
                  <li className="border-t border-white/[0.08] border-b py-4">
                    Book online with secure payment
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      <CategoryPageEnd
        lede="Want a guided day out instead of self-guided gear?"
        links={[
          { to: '/daytime-experiences', label: 'Day tours', primary: true },
          { to: '/contact', label: 'Contact us' },
        ]}
      />

      <Footer />
    </div>
  )
}

export default RentingEquipment
