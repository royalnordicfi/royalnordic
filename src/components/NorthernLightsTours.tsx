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

  const signature = tours.find((t) => t.featured)
  const secondary = tours.filter((t) => !t.featured)

  return (
    <div className="rn-page">
      <CategoryHero
        title="Northern Lights Tours in Rovaniemi"
        subtitle="Small-group aurora hunts from a local operator — with a clear guarantee on our signature tour."
        image="/nortti5.jpg"
      />

      <section className="bg-midnight pb-12 pt-8">
        <div className="rn-container space-y-10">
          {signature && (
            <div>
              <p className="rn-eyebrow">Signature experience</p>
              <div className="mt-4 grid gap-5">
                <TourCard
                  to={signature.to}
                  image={signature.image}
                  imageAlt={signature.imageAlt}
                  title={signature.title}
                  description={signature.description}
                  duration={signature.duration}
                  groupSize={signature.groupSize}
                  pickup={signature.pickup}
                  badge={signature.badge}
                  priceFrom={signature.priceFrom}
                  featured
                  ctaLabel="View guaranteed tour"
                />
              </div>
            </div>
          )}

          {secondary.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">More aurora evenings</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {secondary.map((tour) => (
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
                    ctaLabel={tour.priceFrom ? 'View details' : 'Request availability'}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="max-w-2xl border-y border-white/[0.08] py-8">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Which tour is right?</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>
                <strong className="text-white">Guaranteed</strong> — full evening hunt with flexible
                duration and free return trip if no lights appear (see{' '}
                <Link to="/terms-conditions" className="font-medium text-aurora-soft hover:underline">
                  Terms
                </Link>
                ).
              </li>
              <li>
                <strong className="text-white">Family</strong> — shorter 2-hour evening format. Northern
                Lights not guaranteed.
              </li>
            </ul>
          </div>

          <ReviewCarousel reviews={reviewsFor('northern-lights', 6)} />
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default NorthernLightsTours
