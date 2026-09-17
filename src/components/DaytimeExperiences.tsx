import React, { useEffect, useMemo, useState } from 'react'
import CategoryHero from './CategoryHero'
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
    badge: 'Day trip',
    priceFrom: 119,
    featured: true,
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

  const featured = experiences.find((e) => e.featured)
  const secondary = experiences.filter((e) => !e.featured)

  return (
    <div className="rn-page">
      <CategoryHero
        title="Daytime Experiences in Lapland"
        subtitle="Ice fishing, wildlife, canyon hikes, and partner snowmobile trips — small groups with local guides from Rovaniemi."
        image="/icefishing3.jpg"
      />

      <section className="bg-midnight pb-12 pt-8">
        <div className="rn-container space-y-10">
          {featured && (
            <div>
              <p className="rn-eyebrow">Featured day trip</p>
              <div className="mt-4 grid gap-5">
                <TourCard
                  to={featured.to}
                  image={featured.image}
                  imageAlt={featured.imageAlt}
                  title={featured.title}
                  description={featured.description}
                  duration={featured.duration}
                  groupSize={featured.groupSize}
                  pickup={featured.pickup}
                  badge={featured.badge}
                  priceFrom={featured.priceFrom}
                  featured
                />
              </div>
            </div>
          )}

          {secondary.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">More daytime adventures</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {secondary.map((exp) => (
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
                    ctaLabel={exp.priceFrom != null ? 'View details' : 'Request availability'}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="max-w-2xl border-y border-white/[0.08] py-8">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">Pick your day trip</h2>
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

          <ReviewCarousel reviews={reviewsFor('day-tours', 6)} />
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default DaytimeExperiences
