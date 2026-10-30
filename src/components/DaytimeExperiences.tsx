import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds } from '../lib/productVisibility'
import { fetchPublicTourCards, type TourCms } from '../lib/tourCms'
import { mergeTourCardCms, tourCmsMap } from '../lib/mergeTourCardCms'

const ALL_EXPERIENCES = [
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
    priceFrom: 119 as number | undefined,
    imagePosition: 'center',
  },
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
    priceFrom: 1169 as number | undefined,
    priceUnit: '/ private group',
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
    duration: 'About 5 hours',
    groupSize: 'Max 16',
    pickup: true,
    priceFrom: 99 as number | undefined,
    imagePosition: 'center',
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
    priceFrom: 129 as number | undefined,
    imagePosition: 'center top',
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
    badge: 'RN10 · −10%',
    priceFrom: 107.1 as number | undefined,
    referencePrice: 119 as number | undefined,
    imagePosition: 'center',
  },
]

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
        image: e.image,
        imageAlt: e.imageAlt,
        priceUnit: e.priceUnit,
      }
    })
  }, [activeIds, cmsById])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Daytime Experiences in Lapland"
        subtitle="Ice fishing, wildlife, private Santa visits, canyon hikes, and Arctic snowmobile safari from Rovaniemi."
        image="/korouoma1.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative pt-0 pb-10 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative">
          <div className="rn-card-grid">
            {experiences.map((exp, i) => (
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
                referencePrice={exp.referencePrice}
                priceUnit={'priceUnit' in exp && exp.priceUnit ? exp.priceUnit : undefined}
                imagePosition={exp.imagePosition}
                ctaLabel={exp.priceFrom != null ? 'Explore' : 'Request availability'}
                className={`rn-stagger-${(i % 4) + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <ReviewCarousel
        reviews={reviewsFor('day-tours', 6)}
        className="border-t border-white/[0.06] !pb-6 sm:!pb-10"
      />
      <CategoryPageEnd
        lede="Evenings free? Pair a day tour with our signature aurora hunt."
        links={[
          { to: '/northern-lights-tour', label: 'Guaranteed Northern Lights', primary: true },
          { to: '/contact', label: 'Contact us' },
        ]}
      />
      <Footer />
    </div>
  )
}

export default DaytimeExperiences
