import React from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import TourCard from './TourCard'

const TRANSFERS = [
  {
    to: '/transportation-rovaniemi-levi',
    image: '/transportation1.jpg',
    imageAlt: 'Private transfer from Rovaniemi to Levi',
    title: 'Rovaniemi – Levi / Kittilä',
    description: 'Private vehicle transfer with professional driver and flexible pickup timing.',
    duration: '2–3 hours',
    groupSize: 'Up to 8',
    pickup: true,
    badge: 'Private transfer',
    priceFrom: 399,
  },
  {
    to: '/transportation-customized',
    image: '/transportation2.jpg',
    imageAlt: 'Custom Lapland transportation',
    title: 'Customized Transportation',
    description: 'Airport pickups, multi-stop days, and routes across Finnish Lapland on request.',
    duration: 'Flexible',
    groupSize: 'Up to 8',
    pickup: true,
    badge: 'On request',
    priceFrom: undefined as number | undefined,
  },
]

const TransportationCategory = () => {
  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Transportation in Lapland"
        subtitle="Rovaniemi, Levi, Kittilä, and custom routes — professional driver and flexible timing."
        image="/transportation3.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative pt-0 pb-10 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
        <div className="rn-container relative space-y-10">
          <div className="mx-auto max-w-5xl">
            <div className="rn-card-grid lg:!grid-cols-2">
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
                  ctaLabel={item.priceFrom != null ? 'View details' : 'Request quote'}
                />
              ))}
            </div>
          </div>

          <div className="mx-auto max-w-2xl border-y border-white/[0.08] py-8 sm:py-9">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">How it works</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-[15px]">
              Fixed-route Levi/Kittilä transfers are priced per vehicle. For airport pickups, ski
              transfers, or multi-stop days, use the customized option and tell us your schedule — we
              reply with a quote.
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
