import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds, SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from '../lib/productVisibility'
import { fetchPublicTourCards, type TourCms } from '../lib/tourCms'
import { mergeTourCardCms, tourCmsMap } from '../lib/mergeTourCardCms'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'
import {
  PRIVATE_NL_GROUP_PRICE,
  PRIVATE_NL_LISTING_TITLE,
  PRIVATE_NL_PATH,
  PRIVATE_NL_TOUR_ID,
  STANDARD_GROUP_ADULT_PRICE,
  STANDARD_GROUP_LISTING_TITLE,
  STANDARD_GROUP_PATH,
  STANDARD_GROUP_TOUR_ID,
} from '../lib/tourBookingRules'

const ALL_TOURS = [
  {
    tourId: 1 as number | null,
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Guaranteed Northern Lights and photography, small group',
    title: 'Guaranteed Northern Lights & Photography — Small Group',
    description: `${GUARANTEED_NL_HERO_PROMISE} Hotel pickup and free professional photos included.`,
    duration: '2–10 hours',
    groupSize: 'Small group · max 8',
    pickup: true,
    badge: 'Small group',
    priceFrom: GUARANTEED_NL_CATALOG_ADULT_PRICE as number | undefined,
    referencePrice: GUARANTEED_NL_REFERENCE_ADULT_PRICE as number | undefined,
    lockListing: true,
  },
  {
    tourId: PRIVATE_NL_TOUR_ID as number | null,
    to: PRIVATE_NL_PATH,
    image: '/nortti11.jpg',
    imageAlt: 'Private Northern Lights tour for an exclusive group',
    title: PRIVATE_NL_LISTING_TITLE,
    description:
      'Exclusive private aurora experience for your group of up to eight guests. Hotel pickup, professional photography, €1,349 per private group.',
    duration: 'About 5 hours',
    groupSize: 'Private · max 8',
    pickup: true,
    badge: 'Private',
    priceFrom: PRIVATE_NL_GROUP_PRICE as number | undefined,
    pricePrefix: 'From',
    priceUnit: '/ private group',
    lockListing: true,
  },
  {
    tourId: STANDARD_GROUP_TOUR_ID as number | null,
    to: STANDARD_GROUP_PATH,
    image: '/nortti5.jpg',
    imageAlt: 'Northern Lights Standard Group bus tour',
    title: STANDARD_GROUP_LISTING_TITLE,
    description:
      'Large shared bus tour for up to 50 guests. Departs Ruokasenkatu 3 at 20:00. Hotel pickup is not included.',
    duration: 'About 5 hours',
    groupSize: 'Large group · max 50',
    pickup: false,
    logistics: 'Meeting point',
    badge: 'Bus tour',
    priceFrom: STANDARD_GROUP_ADULT_PRICE as number | undefined,
    pricePrefix: 'From',
    priceUnit: '/ person',
    lockListing: true,
  },
  {
    tourId: 8 as number | null,
    to: '/family-friendly-northern-lights',
    image: '/family1.jpg',
    imageAlt: 'Family-Friendly Northern Lights Tour',
    title: 'Family-Friendly Northern Lights Tour',
    description: 'Shorter 2-hour evening format for families and mixed-age groups. Aurora is not guaranteed.',
    duration: '2 hours',
    groupSize: 'Family format',
    pickup: true,
    badge: 'Family',
    priceFrom: 79 as number | undefined,
    lockListing: true,
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
  const [cmsById, setCmsById] = useState<Map<number, TourCms>>(() => new Map())

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
    fetchPublicTourCards()
      .then((cards) => setCmsById(tourCmsMap(cards)))
      .catch(() => undefined)
  }, [])

  const tours = useMemo(() => {
    const base = !activeIds
      ? ALL_TOURS.filter(
          (t) => t.tourId !== STANDARD_GROUP_TOUR_ID && t.tourId !== PRIVATE_NL_TOUR_ID,
        )
      : ALL_TOURS.filter((t) => t.tourId == null || activeIds.has(t.tourId))
    return base.map((t) => {
      const merged = mergeTourCardCms(t, cmsById)
      if (!('lockListing' in t) || !t.lockListing) return merged
      return {
        ...merged,
        title: t.title,
        pickup: t.pickup,
      }
    })
  }, [activeIds, cmsById])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Northern Lights Tours in Rovaniemi"
        subtitle={`Small-group, private exclusive, and large-group bus departures — plus a shorter family evening. ${GUARANTEED_NL_GUARANTEE_SHORT}`}
        image="/nortti5.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative pt-0 pb-10 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative">
          <div className="rn-card-grid rn-card-grid--balanced">
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
                logistics={'logistics' in tour ? tour.logistics : undefined}
                badge={tour.badge}
                priceFrom={tour.priceFrom}
                referencePrice={'referencePrice' in tour ? tour.referencePrice : undefined}
                pricePrefix={'pricePrefix' in tour ? tour.pricePrefix : undefined}
                priceUnit={'priceUnit' in tour ? tour.priceUnit : undefined}
                ctaLabel={
                  tour.to === '/northern-lights-tour'
                    ? 'Check availability'
                    : tour.priceFrom
                      ? 'Check availability'
                      : 'Request availability'
                }
                className={`rn-stagger-${(i % 4) + 1}`}
              />
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-rn-measure border-t border-white/[0.08] pt-8 sm:mt-14 sm:pt-10">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">
              Which tour is right for me?
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-muted sm:text-[15px]">
              <li>
                <span className="font-medium text-white">Guaranteed Northern Lights & Photography</span>{' '}
                — small group, hotel pickup, professional photos, and a camera-capture refund guarantee.
              </li>
              <li>
                <span className="font-medium text-white">Private Tour</span> — exclusive experience for
                one group of up to eight guests, hotel pickup included, €1,349 per private group.
              </li>
              <li>
                <span className="font-medium text-white">Standard Group</span> — large shared bus,
                up to 50 guests, meeting point at Ruokasenkatu 3. Hotel pickup is not included.
              </li>
              <li>
                <span className="font-medium text-white">Family-Friendly</span> — a shorter evening
                format for mixed ages. Aurora is not guaranteed on this tour.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <ReviewCarousel
        reviews={reviewsFor('northern-lights', 8)}
        className="border-t border-white/[0.06] !pb-6 sm:!pb-10"
      />
      <CategoryPageEnd
        lede="Fill your days between aurora evenings with Lapland experiences."
        links={[
          { to: '/northern-lights-tour', label: 'Small-group tour', primary: true },
          { to: PRIVATE_NL_PATH, label: 'Private tour' },
          { to: STANDARD_GROUP_PATH, label: 'Standard Group bus' },
          { to: '/daytime-experiences', label: 'Day tours' },
        ]}
        className="border-t-0 pt-0"
      />
      <Footer />
    </div>
  )
}

export default NorthernLightsTours
