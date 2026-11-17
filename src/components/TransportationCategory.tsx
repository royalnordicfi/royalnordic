import React from 'react'
import CategoryHero from './CategoryHero'
import CategoryPageEnd from './CategoryPageEnd'
import CategorySectionHeader from './CategorySectionHeader'
import Footer from './Footer'
import TourCard from './TourCard'
import {
  FIXED_TRANSFER_CAPACITY_LABEL,
  LEVI_VEHICLE_PRICE,
  SAARISELKA_VEHICLE_PRICE,
} from '../lib/transferPricing'

const TRANSFERS = [
  {
    to: '/transportation-rovaniemi-saariselka',
    image: '/royal-trans-1.jpg',
    imageAlt: 'Private transfer between Rovaniemi and Saariselkä',
    title: 'Rovaniemi ⇄ Saariselkä',
    description: 'Private door-to-door transfer. Flat rate per vehicle, one way — book and pay online.',
    duration: '3–3.5 hours',
    groupSize: FIXED_TRANSFER_CAPACITY_LABEL,
    pickup: true,
    badge: 'Book online',
    priceFrom: SAARISELKA_VEHICLE_PRICE,
    pricePrefix: undefined as string | undefined,
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
    groupSize: FIXED_TRANSFER_CAPACITY_LABEL,
    pickup: true,
    badge: 'Request a quote',
    priceFrom: LEVI_VEHICLE_PRICE,
    pricePrefix: 'From',
    priceUnit: '/ vehicle (indicative)',
    ctaLabel: 'Request a transfer',
  },
  {
    to: '/transportation-customized',
    image: '/royal-trans-3.jpg',
    imageAlt: 'Custom Lapland transportation',
    title: 'Customized Transportation',
    description:
      'Airport pickups, multi-stop days, and routes for groups of any size — we arrange suitable vehicles.',
    duration: 'Flexible timing',
    groupSize: 'Any group size · custom routes',
    pickup: false,
    logistics: 'Quote on request',
    badge: 'Request a quote',
    priceFrom: undefined as number | undefined,
    pricePrefix: undefined as string | undefined,
    priceUnit: undefined as string | undefined,
    ctaLabel: 'Get a quote',
  },
]

const BENEFITS = [
  {
    title: 'Private, door-to-door',
    text: 'Travel directly between your chosen locations.',
  },
  {
    title: 'Flexible schedules',
    text: 'Transfers arranged around your travel plans.',
  },
  {
    title: 'Clear pricing',
    text: 'Rates quoted per vehicle, with custom routes available on request.',
  },
] as const

const TransportationCategory = () => {
  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Transfers Across Finnish Lapland"
        subtitle="Comfortable, private journeys between Rovaniemi, Lapland's resorts and airports — tailored to your schedule."
        image="/royal-trans-4.jpg"
        eyebrow="Royal Nordic · Transfers"
        actions={
          <a href="#transfers" className="rn-btn-primary min-h-[48px] px-7">
            Explore transfers
          </a>
        }
      />

      <section
        id="transfers"
        className="rn-section-follow scroll-mt-[calc(var(--rn-chrome-h)+1rem)]"
        aria-labelledby="rn-transfers-heading"
      >
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-60" aria-hidden />
        <div className="rn-container relative">
          <CategorySectionHeader
            className="mb-6 sm:mb-7"
            eyebrow="Routes"
            title="Choose your transfer"
            titleId="rn-transfers-heading"
            lede="Fixed routes with clear per-vehicle rates, plus custom transportation when you need a different destination or larger group."
          />

          <div className="rn-card-grid rn-card-grid--transfers">
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
                logistics={'logistics' in item ? item.logistics : undefined}
                badge={item.badge}
                priceFrom={item.priceFrom}
                pricePrefix={item.pricePrefix}
                priceUnit={item.priceUnit}
                ctaLabel={item.ctaLabel}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="rn-section-band" aria-labelledby="rn-transfer-benefits-heading">
        <div className="rn-container">
          <CategorySectionHeader
            eyebrow="Why book with us"
            title="Travel comfortably. Arrive effortlessly."
            titleId="rn-transfer-benefits-heading"
            lede={`Saariselkä is bookable online at €${SAARISELKA_VEHICLE_PRICE} one way per vehicle. Levi/Kittilä (from €${LEVI_VEHICLE_PRICE}) and custom routes are confirmed by request so we can match flights, luggage and fleet needs.`}
          />

          <ul className="rn-benefit-row mt-8">
            {BENEFITS.map((item) => (
              <li key={item.title} className="rn-benefit-row__item">
                <h3 className="rn-benefit-row__title">{item.title}</h3>
                <p className="rn-benefit-row__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CategoryPageEnd
        title="Going somewhere else in Lapland?"
        lede="Tell us your destination, travel date and group size. We'll help arrange the right private transportation."
        links={[
          { to: '/transportation-customized', label: 'Request a custom transfer', primary: true },
          { to: '/contact', label: 'Contact us' },
        ]}
      />

      <Footer />
    </div>
  )
}

export default TransportationCategory
