import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds, SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from '../lib/productVisibility'

const ALL_TOURS = [
  {
    tourId: 1 as number | null,
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Guaranteed Northern Lights Tour',
    title: 'Guaranteed Northern Lights Tour',
    description:
      'Full evening aurora hunt with hotel pickup. Free return trip if no lights appear — see Terms.',
    duration: '2–12 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Guaranteed',
    priceFrom: 149 as number | undefined,
  },
  {
    tourId: 8 as number | null,
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family-Friendly Northern Lights',
    title: 'Family-Friendly Northern Lights',
    description: 'Shorter 2-hour evening format for families and mixed-age groups.',
    duration: '2 hours',
    groupSize: 'Family format',
    pickup: true,
    badge: 'Family',
    priceFrom: 79 as number | undefined,
  },
  ...(SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS
    ? [
        {
          tourId: null as number | null,
          to: '/monster-truck-northern-lights',
          image: '/monsteri1.jpg',
          imageAlt: 'Monster Truck Northern Lights',
          title: 'Monster Truck Northern Lights',
          description: 'Partner-operated monster-truck aurora experience from Rovaniemi.',
          duration: '3 hours',
          groupSize: 'Flexible',
          pickup: false,
          badge: 'Partner',
          priceFrom: undefined as number | undefined,
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

      <section className="rn-section relative">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative">
          <div className="max-w-2xl">
            <p className="rn-eyebrow">Aurora season</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Northern Lights experiences
            </h2>
            <p className="mt-2 text-sm text-text-muted sm:text-base">
              Compare formats side by side.{' '}
              <Link to="/northern-lights-tour" className="text-aurora-soft hover:underline">
                Guaranteed
              </Link>{' '}
              includes a free return trip if no lights appear — see Terms.
            </p>
          </div>

          <div className="rn-card-grid mt-8">
            {tours.map((tour, i) => (
              <TourCard
                key={tour.to}
                to={tour.to}
                image={tour.image}
                imageAlt={tour.imageAlt}
                title={tour.title}
                description={tour.description}
                duration={tour.duration}
                groupSize={tour.groupSize}
                pickup={tour.pickup}
                badge={tour.badge}
                priceFrom={tour.priceFrom}
                ctaLabel={tour.priceFrom ? 'Explore' : 'Request availability'}
                className={`rn-stagger-${(i % 4) + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <ReviewCarousel
        reviews={reviewsFor('northern-lights', 6)}
        className="border-t border-white/[0.06]"
      />
      <Footer />
    </div>
  )
}

export default NorthernLightsTours
