import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'
import TourCard from './TourCard'
import { fetchActiveTourIds, SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from '../lib/productVisibility'

const ALL_TOURS = [
  {
    tourId: 1 as number | null,
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Guaranteed Northern Lights Tour',
    title: 'Guaranteed Northern Lights Tour',
    duration: '2–12 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Guaranteed',
    priceFrom: 149,
    featured: true,
  },
  {
    tourId: 8 as number | null,
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family-Friendly Northern Lights',
    title: 'Family-Friendly Northern Lights',
    duration: '2 hours',
    groupSize: 'Family format',
    pickup: true,
    badge: 'Family',
    priceFrom: 79,
    featured: false,
  },
  ...(SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS
    ? [
        {
          tourId: null as number | null,
          to: '/monster-truck-northern-lights',
          image: '/monsteri1.jpg',
          imageAlt: 'Monster Truck Northern Lights',
          title: 'Monster Truck Northern Lights',
          duration: '3 hours',
          groupSize: 'Flexible',
          pickup: false,
          badge: 'Partner',
          priceFrom: undefined as number | undefined,
          featured: false,
        },
      ]
    : []),
]

const NorthernLightsTours: React.FC = () => {
  const [activeIds, setActiveIds] = useState<Set<number> | null>(null)

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
  }, [])

  const tours = useMemo(() => {
    if (!activeIds) return ALL_TOURS
    return ALL_TOURS.filter((t) => t.tourId == null || activeIds.has(t.tourId))
  }, [activeIds])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Northern Lights Tours in Rovaniemi"
        subtitle="Small-group aurora hunts from a local operator — with a clear guarantee on our signature tour."
        image="/nortti5.jpg"
      />

      <section className="rn-section bg-midnight">
        <div className="rn-container">
          <div className="grid gap-5 sm:grid-cols-2">
            {tours.map((tour) => (
              <TourCard
                key={tour.to}
                to={tour.to}
                image={tour.image}
                imageAlt={tour.imageAlt}
                title={tour.title}
                duration={tour.duration}
                groupSize={tour.groupSize}
                pickup={tour.pickup}
                badge={tour.badge}
                priceFrom={tour.priceFrom}
                featured={tour.featured}
                ctaLabel={tour.priceFrom ? 'View details' : 'Request availability'}
              />
            ))}
          </div>

          <div className="mt-12 max-w-2xl rounded-rn border border-white/10 bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold text-white">Which tour is right?</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>
                <strong className="text-white">Guaranteed</strong> — full evening hunt with flexible
                duration and free return trip if no lights appear (see Terms).
              </li>
              <li>
                <strong className="text-white">Family</strong> — shorter 2-hour evening format. Northern
                Lights not guaranteed.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default NorthernLightsTours
