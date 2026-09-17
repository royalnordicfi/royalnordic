import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'
import TourCard from './TourCard'
import { fetchActiveTourIds } from '../lib/productVisibility'

const ALL_EXPERIENCES = [
  {
    tourId: 4 as number | null,
    to: '/ice-fishing',
    image: '/icefishing2.jpg',
    imageAlt: 'Ice fishing on a frozen Lapland lake',
    title: 'Ice Fishing Experience',
    duration: '3–4 hours',
    groupSize: 'Max 8',
    pickup: true,
    badge: 'Day trip',
    priceFrom: 119,
    featured: false,
  },
  {
    tourId: 5 as number | null,
    to: '/ranua-zoo',
    image: '/ranua1.jpg',
    imageAlt: 'Ranua Wildlife Park',
    title: 'Nordic Animals of Ranua Zoo',
    duration: 'About 5 hours',
    groupSize: 'Max 16',
    pickup: true,
    badge: 'Family',
    priceFrom: 99,
    featured: false,
  },
  {
    tourId: 6 as number | null,
    to: '/korouoma-canyon',
    image: '/korouoma1.jpg',
    imageAlt: 'Korouoma Canyon frozen waterfalls',
    title: 'Korouoma Canyon Winter Adventure',
    duration: '6 hours',
    groupSize: 'Max 8 / vehicle',
    pickup: true,
    badge: 'Adventure',
    priceFrom: 129,
    featured: false,
  },
  {
    tourId: null as number | null,
    to: '/snowmobile-safari',
    image: '/snowmobiling2.jpg',
    imageAlt: 'Snowmobile safari in Lapland',
    title: 'Snowmobile Safari',
    duration: '0.5–3 hours',
    groupSize: 'Flexible',
    pickup: false,
    badge: 'Partner',
    priceFrom: undefined as number | undefined,
    featured: false,
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
        subtitle="Ice fishing, wildlife, canyon hikes, and partner snowmobile trips — small groups with local guides from Rovaniemi."
        image="/icefishing3.jpg"
      />

      <section className="rn-section bg-midnight">
        <div className="rn-container">
          <div className="grid gap-5 sm:grid-cols-2">
            {experiences.map((exp) => (
              <TourCard
                key={exp.to}
                to={exp.to}
                image={exp.image}
                imageAlt={exp.imageAlt}
                title={exp.title}
                duration={exp.duration}
                groupSize={exp.groupSize}
                pickup={exp.pickup}
                badge={exp.badge}
                priceFrom={exp.priceFrom}
                featured={exp.featured}
                ctaLabel={exp.priceFrom != null ? 'View details' : 'Request availability'}
              />
            ))}
          </div>

          <div className="mt-12 max-w-2xl rounded-rn border border-white/10 bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold text-white">Pick your day trip</h2>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>
                <strong className="text-white">Ice fishing</strong> — relaxed morning or afternoon on
                frozen lakes near Rovaniemi.
              </li>
              <li>
                <strong className="text-white">Ranua Zoo</strong> — polar bears and Arctic species with
                transfers and tickets included.
              </li>
              <li>
                <strong className="text-white">Korouoma</strong> — guided hike to frozen waterfalls and
                campfire lunch.
              </li>
              <li>
                <strong className="text-white">Snowmobile</strong> — operated by a partner; send a request
                for times and pricing.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default DaytimeExperiences
