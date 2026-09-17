import React from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'
import TourCard from './TourCard'

const TRANSFERS = [
  {
    to: '/transportation-rovaniemi-levi',
    image: '/transportation1.jpg',
    imageAlt: 'Private transfer from Rovaniemi to Levi',
    title: 'Rovaniemi – Levi / Kittilä',
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
        subtitle="Point-to-point transfers between Rovaniemi, Levi, Kittilä, and custom routes — professional driver and flexible timing."
        image="/transportation3.jpg"
      />

      <section className="bg-midnight pb-12 pt-8">
        <div className="rn-container space-y-10">
          <div className="grid gap-5 sm:grid-cols-2">
            {TRANSFERS.map((item) => (
              <TourCard
                key={item.to}
                to={item.to}
                image={item.image}
                imageAlt={item.imageAlt}
                title={item.title}
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

          <div className="max-w-2xl border-y border-white/[0.08] py-8">
            <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">How it works</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Fixed-route Levi/Kittilä transfers are priced per vehicle. For airport pickups, ski
              transfers, or multi-stop days, use the customized option and tell us your schedule — we
              reply with a quote.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TransportationCategory
