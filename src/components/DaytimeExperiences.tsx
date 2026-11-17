import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import CategorySectionHeader from './CategorySectionHeader'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds } from '../lib/productVisibility'
import { fetchPublicTourCards, type TourCms } from '../lib/tourCms'
import { mergeTourCardCms, tourCmsMap } from '../lib/mergeTourCardCms'

const ALL_EXPERIENCES = [
  {
    tourId: 12 as number | null,
    to: '/private-santa-claus-experience',
    image: '/santaclaus1.jpg',
    imageAlt: 'Private Santa Claus Experience in Rovaniemi',
    title: 'Private Santa Claus Experience',
    description:
      'Exclusive private meeting with Santa Claus in Rovaniemi, including private transportation and festive treats.',
    duration: 'Approximately 1.5 hours',
    groupSize: 'Up to 6 guests',
    pickup: true,
    badge: 'Private',
    priceFrom: 1169 as number | undefined,
    priceUnit: '/ private group',
    // Portrait cover: keep Santa (mid-frame) in the card crop — not the cabin ceiling.
    imagePosition: 'center 42%',
    lockListing: true,
  },
  {
    tourId: 4 as number | null,
    to: '/ice-fishing',
    image: '/icefishing2.jpg',
    imageAlt: 'Ice fishing on a frozen Lapland lake',
    title: 'Ice Fishing Experience',
    description: 'Traditional ice fishing on frozen lakes with guide, equipment, and hot drinks by the fire.',
    duration: '3–4 hours',
    groupSize: 'Max 8',
    pickup: true,
    badge: 'Tradition',
    priceFrom: 119 as number | undefined,
    imagePosition: 'center',
    lockListing: true,
  },
  {
    tourId: 5 as number | null,
    to: '/ranua-zoo',
    image: '/ranua1.jpg',
    imageAlt: 'Ranua Wildlife Park',
    title: 'Ranua Wildlife Park – Entry Ticket & Round-Trip Transfer',
    description:
      'Round-trip transfer from Rovaniemi with park admission included. Explore independently — no guided tour.',
    duration: 'About 5 hours · Starts 10:00',
    groupSize: 'Max 16',
    pickup: true,
    badge: 'Wildlife',
    priceFrom: 99 as number | undefined,
    imagePosition: 'center',
    lockListing: true,
  },
  {
    tourId: 6 as number | null,
    to: '/korouoma-canyon',
    image: '/korouoma1.jpg',
    imageAlt: 'Korouoma Canyon frozen waterfalls',
    title: 'Korouoma Canyon Winter Adventure',
    description: 'Guided hike to frozen waterfalls with campfire lunch in the canyon.',
    duration: '6 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Canyon',
    priceFrom: 129 as number | undefined,
    imagePosition: 'center top',
    lockListing: true,
  },
  {
    tourId: null as number | null,
    to: '/snowmobile-safari',
    image: '/snowmobiling1.jpg',
    imageAlt: 'Guided Arctic snowmobile safari near Rovaniemi',
    title: 'Arctic Snowmobile Safari',
    description:
      'Guided 2-hour wilderness safari with ~75 minutes of driving — book online with exclusive code RN10.',
    duration: 'About 2.5 hours',
    groupSize: '2 per snowmobile',
    pickup: true,
    badge: 'Safari',
    priceFrom: 107.1 as number | undefined,
    referencePrice: 119 as number | undefined,
    imagePosition: 'center',
    lockListing: true,
  },
]

/** Comparison columns sourced only from existing listing copy. */
const COMPARE_COLUMNS = [
  {
    to: '/private-santa-claus-experience',
    short: 'Private Santa',
    activity: 'Private festive meeting',
    duration: 'Approx. 1.5 hours',
    format: 'Private · up to 6',
    intensity: '—',
    includes: 'Private transport · festive treats',
  },
  {
    to: '/ice-fishing',
    short: 'Ice Fishing',
    activity: 'Traditional lake fishing',
    duration: '3–4 hours',
    format: 'Small group · max 8',
    intensity: '—',
    includes: 'Guide · equipment · hot drinks',
  },
  {
    to: '/ranua-zoo',
    short: 'Ranua Wildlife',
    activity: 'Wildlife park visit',
    duration: 'About 5 hours',
    format: 'Max 16',
    intensity: 'Self-guided park walk',
    includes: 'Round-trip transfer · admission',
  },
  {
    to: '/korouoma-canyon',
    short: 'Korouoma Canyon',
    activity: 'Canyon winter hike',
    duration: '6 hours',
    format: 'Max 8 / vehicle',
    intensity: 'Guided hike',
    includes: 'Campfire lunch',
  },
  {
    to: '/snowmobile-safari',
    short: 'Snowmobile Safari',
    activity: 'Guided wilderness safari',
    duration: 'About 2.5 hours',
    format: '2 per snowmobile',
    intensity: '~75 min driving',
    includes: 'Guided safari · code RN10',
  },
] as const

const COMPARE_ROW_KEYS = [
  { label: 'Activity', key: 'activity' },
  { label: 'Duration', key: 'duration' },
  { label: 'Group format', key: 'format' },
  { label: 'Intensity', key: 'intensity' },
  { label: 'Includes', key: 'includes' },
] as const

const DaytimeExperiences: React.FC = () => {
  const [activeIds, setActiveIds] = useState<Set<number> | null>(null)
  const [cmsById, setCmsById] = useState<Map<number, TourCms>>(() => new Map())

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
    fetchPublicTourCards()
      .then((cards) => setCmsById(tourCmsMap(cards)))
      .catch(() => undefined)
  }, [])

  const experiences = useMemo(() => {
    const base = !activeIds
      ? ALL_EXPERIENCES
      : ALL_EXPERIENCES.filter((e) => e.tourId == null || activeIds.has(e.tourId))
    return base.map((e) => {
      const merged = mergeTourCardCms(e, cmsById)
      if (!('lockListing' in e) || !e.lockListing) return merged
      return {
        ...merged,
        title: e.title,
        description: e.description,
        duration: e.duration,
        groupSize: e.groupSize,
        pickup: e.pickup,
        badge: e.badge,
        image: e.image,
        imageAlt: e.imageAlt,
        imagePosition: e.imagePosition,
        priceFrom: e.priceFrom,
        referencePrice: 'referencePrice' in e ? e.referencePrice : undefined,
        priceUnit: 'priceUnit' in e ? e.priceUnit : undefined,
      }
    })
  }, [activeIds, cmsById])

  const compareColumns = useMemo(() => {
    const visibleTos = new Set(experiences.map((e) => e.to))
    return COMPARE_COLUMNS.filter((col) => visibleTos.has(col.to))
  }, [experiences])

  const gridClass =
    experiences.length <= 4
      ? 'rn-card-grid rn-card-grid--balanced'
      : 'rn-card-grid rn-card-grid--day'

  return (
    <div className="rn-page">
      <CategoryHero
        title="Daytime Experiences in Lapland"
        subtitle="Ice fishing, wildlife, canyon hiking, private Santa visits, and Arctic snowmobile safari — planned from Rovaniemi."
        image="/korouoma1.jpg"
        eyebrow="Royal Nordic · Day tours"
      />

      <section className="rn-section-follow" aria-label="Daytime experiences">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-70" aria-hidden />
        <div className="rn-container relative">
          <div className={gridClass}>
            {experiences.map((exp) => (
              <TourCard
                key={exp.to}
                to={exp.to}
                image={exp.image}
                imageAlt={exp.imageAlt}
                title={exp.title}
                description={exp.description}
                duration={exp.duration}
                groupSize={exp.groupSize}
                pickup={exp.pickup}
                badge={'badge' in exp ? exp.badge : undefined}
                priceFrom={exp.priceFrom}
                referencePrice={'referencePrice' in exp ? exp.referencePrice : undefined}
                priceUnit={'priceUnit' in exp && exp.priceUnit ? exp.priceUnit : undefined}
                imagePosition={exp.imagePosition}
                ctaLabel={exp.priceFrom != null ? 'Check availability' : 'Request availability'}
              />
            ))}
          </div>

          {compareColumns.length > 1 ? (
            <div className="rn-nl-compare mt-10 sm:mt-12" aria-labelledby="rn-day-compare-heading">
              <CategorySectionHeader
                eyebrow="Compare"
                title="Which day experience suits you?"
                titleId="rn-day-compare-heading"
                lede="Scan activity type, duration, group format, and verified inclusions before you book."
              />

              <div
                className="rn-nl-compare__scroll mt-6"
                role="region"
                aria-label="Day experience comparison table"
                tabIndex={0}
              >
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
        reviews={reviewsFor('day-tours', 6)}
        eyebrow="Guest stories"
        title="Days guests remember"
        className="border-t border-white/[0.06] !pb-6 sm:!pb-8"
      />
      <CategoryPageEnd
        title="Ready for a Lapland day?"
        lede="Start with ice fishing on a frozen lake, or tell us what kind of daytime itinerary you need — we reply personally."
        links={[
          { to: '/ice-fishing', label: 'Check Ice Fishing availability', primary: true },
          { to: '/customized-tour', label: 'Private & custom' },
          { to: '/northern-lights-tour', label: 'Northern Lights evenings' },
        ]}
        className="border-t-0 pt-0"
      />
      <Footer />
    </div>
  )
}

export default DaytimeExperiences
