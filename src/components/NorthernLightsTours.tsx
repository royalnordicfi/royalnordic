import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds, SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from '../lib/productVisibility'
import { useTourCms } from '../hooks/useTourCms'
import { getDisplayPricing } from '../lib/tourCms'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'

const ALL_TOURS = [
  {
    tourId: 1 as number | null,
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Guaranteed Northern Lights Tour',
    title: 'Guaranteed Northern Lights Tour',
    description: `${GUARANTEED_NL_HERO_PROMISE} Hotel pickup and free professional photos included.`,
    duration: '2–10 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Guaranteed',
    priceFrom: GUARANTEED_NL_CATALOG_ADULT_PRICE as number | undefined,
    referencePrice: GUARANTEED_NL_REFERENCE_ADULT_PRICE as number | undefined,
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
  const { tour: nlTour } = useTourCms(1)

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
  }, [])

  const tours = useMemo(() => {
    const base = !activeIds ? ALL_TOURS : ALL_TOURS.filter((t) => t.tourId == null || activeIds.has(t.tourId))
    if (!nlTour) return base
    const pricing = getDisplayPricing(nlTour)
    return base.map((t) => {
      if (t.tourId !== 1) return t
      return {
        ...t,
        title: nlTour.public_name || t.title,
        description: nlTour.card_description || t.description,
        duration: nlTour.duration_text || t.duration,
        groupSize: nlTour.group_size_text || t.groupSize,
        badge: nlTour.badge || t.badge,
        image: nlTour.hero_image_url || nlTour.gallery?.[0]?.url || t.image,
        priceFrom: pricing.current,
        referencePrice: pricing.saleActive ? pricing.reference ?? undefined : undefined,
      }
    })
  }, [activeIds, nlTour])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Northern Lights Tours in Rovaniemi"
        subtitle={`Small-group aurora hunts from Rovaniemi. ${GUARANTEED_NL_GUARANTEE_SHORT}`}
        image="/nortti5.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative pt-0 pb-10 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative">
          <div className={`rn-card-grid ${tours.length <= 2 ? 'lg:!grid-cols-2' : ''}`}>
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
                referencePrice={'referencePrice' in tour ? tour.referencePrice : undefined}
                ctaLabel={tour.to === '/northern-lights-tour' ? 'Check availability' : tour.priceFrom ? 'Book now' : 'Request availability'}
                className={`rn-stagger-${(i % 4) + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <ReviewCarousel
        reviews={reviewsFor('northern-lights', 6)}
        className="border-t border-white/[0.06] !pb-6 sm:!pb-10"
      />
      <CategoryPageEnd
        lede="Fill your days between aurora hunts with small-group Lapland experiences."
        links={[
          { to: '/northern-lights-tour', label: 'Book Guaranteed tour', primary: true },
          { to: '/daytime-experiences', label: 'Day tours' },
        ]}
        className="border-t-0 pt-0"
      />
      <Footer />
    </div>
  )
}

export default NorthernLightsTours
