import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import ReviewCarousel from './ReviewCarousel'
import TourCard from './TourCard'
import { reviewsFor } from '../data/reviews'
import { fetchActiveTourIds } from '../lib/productVisibility'

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
    tourId: 5 as number | null,
    to: '/ranua-zoo',
    image: '/ranua1.jpg',
    imageAlt: 'Ranua Wildlife Park',
    title: 'Nordic Animals of Ranua Zoo',
    description: 'Arctic wildlife day trip with transfers and park tickets included.',
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
    image: '/snowmobiling2.jpg',
    imageAlt: 'Snowmobile safari in Lapland',
    title: 'Snowmobile Safari',
    description: 'Partner-operated snowmobile routes near Rovaniemi — request times and pricing.',
    duration: '0.5–3 hours',
    groupSize: 'Flexible',
    pickup: false,
    badge: 'Partner',
    priceFrom: undefined as number | undefined,
    imagePosition: 'center',
  },
]

const DaytimeExperiences: React.FC = () => {
  const [activeIds, setActiveIds] = useState<Set<number> | null>(null)

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
  }, [])

  const experiences = useMemo(() => {
    if (!activeIds) return ALL_EXPERIENCES
    return ALL_EXPERIENCES.filter((e) => e.tourId == null || activeIds.has(e.tourId))
  }, [activeIds])

  return (
    <div className="rn-page">
      <CategoryHero
        title="Daytime Experiences in Lapland"
        subtitle="Ice fishing, wildlife, canyon hikes, and partner snowmobile trips — small groups from Rovaniemi."
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
        className="border-t-0 pt-0"
      />
      <Footer />
    </div>
  )
}

export default DaytimeExperiences
