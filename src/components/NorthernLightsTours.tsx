import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import CategorySectionHeader from './CategorySectionHeader'
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
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SHORT_NAME,
} from '../seo/guaranteedNorthernLightsTour'
import {
  PRIVATE_NL_GROUP_PRICE,
  PRIVATE_NL_LISTING_TITLE,
  PRIVATE_NL_PATH,
  PRIVATE_NL_TOUR_ID,
  STANDARD_GROUP_ADULT_PRICE,
  STANDARD_GROUP_LISTING_TITLE,
  STANDARD_GROUP_MEETING_POINT,
  STANDARD_GROUP_PATH,
  STANDARD_GROUP_TOUR_ID,
} from '../lib/tourBookingRules'

const ALL_TOURS = [
  {
    tourId: 1 as number | null,
    to: '/northern-lights-tour',
    image: '/nortti1.jpg',
    imageAlt: 'Small group Northern Lights and photography tour in Lapland',
    title: GUARANTEED_NL_SHORT_NAME,
    description:
      'Small-group aurora hunt with hotel pickup and free professional photos. Camera-capture refund guarantee.',
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
    image: '/nordicci7.jpg',
    imageAlt: 'Private Northern Lights tour for an exclusive group',
    title: PRIVATE_NL_LISTING_TITLE,
    description:
      'Exclusive private aurora evening for your group of up to eight. Hotel pickup and professional photography included.',
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
      'Shared bus departure for up to 50 guests. Meet at Ruokasenkatu 3 at 20:00 — hotel pickup is not included.',
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
    description:
      'Shorter two-hour evening format for families and mixed-age groups. Aurora is not guaranteed.',
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

/** Comparison columns sourced only from existing listing / booking constants. */
const COMPARE_COLUMNS = [
  {
    to: '/northern-lights-tour',
    tourId: 1 as number | null,
    short: 'Small Group',
    groupSize: 'Max 8',
    duration: '2–10 hours',
    pickup: 'Hotel pickup',
    photography: 'Free professional photos',
    guarantee: 'Camera-capture refund',
    price: `€${GUARANTEED_NL_CATALOG_ADULT_PRICE} / adult`,
  },
  {
    to: PRIVATE_NL_PATH,
    tourId: PRIVATE_NL_TOUR_ID as number | null,
    short: 'Private Northern Lights',
    groupSize: 'Private · max 8',
    duration: 'About 5 hours',
    pickup: 'Hotel pickup',
    photography: 'Professional photography',
    guarantee: '100% guarantee',
    price: `€${PRIVATE_NL_GROUP_PRICE} / private group`,
  },
  {
    to: STANDARD_GROUP_PATH,
    tourId: STANDARD_GROUP_TOUR_ID as number | null,
    short: 'Standard Group Bus',
    groupSize: 'Max 50',
    duration: 'About 5 hours',
    pickup: `Meeting point · ${STANDARD_GROUP_MEETING_POINT.split(',')[0]}`,
    photography: '—',
    guarantee: '100% guarantee',
    price: `€${STANDARD_GROUP_ADULT_PRICE} / person`,
  },
  {
    to: '/family-friendly-northern-lights',
    tourId: 8 as number | null,
    short: 'Family-Friendly Tour',
    groupSize: 'Family format',
    duration: '2 hours',
    pickup: 'Hotel pickup',
    photography: '—',
    guarantee: 'Aurora not guaranteed',
    price: '€79 / adult',
  },
] as const

const COMPARE_ROW_KEYS = [
  { label: 'Group size', key: 'groupSize' },
  { label: 'Duration', key: 'duration' },
  { label: 'Pickup', key: 'pickup' },
  { label: 'Photography', key: 'photography' },
  { label: 'Guarantee', key: 'guarantee' },
  { label: 'Price', key: 'price' },
] as const

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
        duration: t.duration,
        groupSize: t.groupSize,
        badge: t.badge,
        logistics: 'logistics' in t ? t.logistics : undefined,
        // Keep curated listing copy and photos — do not let CMS homogenize cards.
        image: t.image,
        imageAlt: t.imageAlt,
        description: t.description,
      }
    })
  }, [activeIds, cmsById])

  const compareColumns = useMemo(() => {
    const visibleTos = new Set(tours.map((t) => t.to))
    return COMPARE_COLUMNS.filter((col) => visibleTos.has(col.to))
  }, [tours])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Northern Lights Tours in Rovaniemi"
        subtitle={`Small-group, private, bus, and family evenings from a local Rovaniemi team. ${GUARANTEED_NL_GUARANTEE_SHORT}`}
        image="/nortti5.jpg"
        eyebrow="Royal Nordic · Aurora"
      />

      <section className="rn-section-follow" aria-label="Northern Lights experiences">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-70" aria-hidden />
        <div className="rn-container relative">
          <div className="rn-card-grid rn-card-grid--balanced">
            {tours.map((tour) => (
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
              />
            ))}
          </div>

          {compareColumns.length > 1 ? (
            <div className="rn-nl-compare mt-10 sm:mt-12" aria-labelledby="rn-nl-compare-heading">
              <CategorySectionHeader
                eyebrow="Compare"
                title="Which tour is right for me?"
                titleId="rn-nl-compare-heading"
                lede="Scan group size, logistics, photography, and guarantee terms before you book."
              />

              <div className="rn-nl-compare__scroll mt-6" role="region" aria-label="Tour comparison table" tabIndex={0}>
                <table className="rn-nl-compare__table">
                  <thead>
                    <tr>
                      <th scope="col" className="rn-nl-compare__corner">
                        <span className="sr-only">Attribute</span>
                      </th>
                      {compareColumns.map((col) => (
                        <th key={col.to} scope="col" className="rn-nl-compare__head">
                          <Link to={col.to} className="rn-nl-compare__head-link">
                            {col.short}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROW_KEYS.map((row) => (
                      <tr key={row.label}>
                        <th scope="row" className="rn-nl-compare__row-label">
                          {row.label}
                        </th>
                        {compareColumns.map((col) => (
                          <td key={`${row.label}-${col.to}`} className="rn-nl-compare__cell">
                            {col[row.key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <ReviewCarousel
        reviews={reviewsFor('northern-lights', 8)}
        className="border-t border-white/[0.06] !pb-6 sm:!pb-8"
      />
      <CategoryPageEnd
        title="Ready to book your aurora evening?"
        lede="Start with our Small Group Northern Lights Tour, or choose private, bus, or family formats from the catalogue above."
        links={[
          { to: '/northern-lights-tour', label: 'Check Small Group availability', primary: true },
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
