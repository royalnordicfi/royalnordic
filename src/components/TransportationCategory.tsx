import React from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import TourCard from './TourCard'
import { SAARISELKA_VEHICLE_PRICE } from './TransportationSaariselka'

const TRANSFERS = [
  {
    to: '/transportation-rovaniemi-saariselka',
    image: '/royal-trans-1.jpg',
    imageAlt: 'Private transfer between Rovaniemi and Saariselkä',
    title: 'Rovaniemi ⇄ Saariselkä',
    description: 'Private door-to-door transfer. Flat rate per vehicle, one way — book and pay online.',
    duration: '3–3.5 hours',
    groupSize: 'Up to 8',
    pickup: true,
    badge: 'Book online',
    priceFrom: SAARISELKA_VEHICLE_PRICE,
    priceUnit: '/ vehicle · one way',
    ctaLabel: 'Book transfer',
  },
  {
    to: '/transportation-rovaniemi-levi',
    image: '/royal-trans-2.jpg',
    imageAlt: 'Private transfer from Rovaniemi to Levi',
    title: 'Rovaniemi – Levi / Kittilä',
    description: 'Private vehicle with professional driver. Request timing and we confirm by email.',
    duration: '2–3 hours',
    groupSize: 'Up to 8',
    pickup: true,
    badge: 'On request',
    priceFrom: 399,
    priceUnit: '/ vehicle (indicative)',
    ctaLabel: 'Request transfer',
  },
  {
    to: '/transportation-customized',
    image: '/royal-trans-3.jpg',
    imageAlt: 'Custom Lapland transportation',
    title: 'Customized Transportation',
    description: 'Airport pickups, multi-stop days, and routes across Finnish Lapland on request.',
    duration: 'Flexible',
    groupSize: 'Up to 8',
    pickup: true,
    badge: 'On request',
    priceFrom: undefined as number | undefined,
    priceUnit: '/ vehicle',
    ctaLabel: 'Request quote',
  },
]

const TransportationCategory = () => {
  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Transfers in Finnish Lapland"
        subtitle="Door-to-door rides between Rovaniemi, Saariselkä, Levi, Kittilä and custom routes — timed around flights and hotels."
        image="/royal-trans-4.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative pt-0 pb-10 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative space-y-10">
          <div className="rn-card-grid sm:!grid-cols-2 lg:!grid-cols-3">
            {TRANSFERS.map((item) => (
              <TourCard
                key={item.to}
                to={item.to}
                image={item.image}
                imageAlt={item.imageAlt}
                title={item.title}
                description={item.description}
                location="Lapland, Finland"
                duration={item.duration}
                groupSize={item.groupSize}
                pickup={item.pickup}
                badge={item.badge}
                priceFrom={item.priceFrom}
                priceUnit={item.priceUnit}
                ctaLabel={item.ctaLabel}
              />
            ))}
          </div>

          <div className="mx-auto max-w-rn-measure border-y border-white/[0.08] py-8 sm:py-9">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">How pricing works</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-[15px]">
              Fixed-route transfers are priced per vehicle, not per passenger. The Saariselkä route can be
              booked and paid online at €{SAARISELKA_VEHICLE_PRICE} one way. Levi/Kittilä and custom routes
              are confirmed by request so we can match your flight and luggage needs.
            </p>
          </div>
        </div>
      </section>

      <CategoryPageEnd
        lede="Need a custom route or airport timing?"
        links={[
          { to: '/transportation-customized', label: 'Request a quote', primary: true },
          { to: '/contact', label: 'Contact us' },
        ]}
      />

      <Footer />
    </div>
  )
}

export default TransportationCategory
