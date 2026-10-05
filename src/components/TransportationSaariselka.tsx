import BookingForm from './BookingForm'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import TourSection from './tour/TourSection'
import { useCmsTourPresentation, type TourPageFallback } from '../hooks/useCmsTourPresentation'

export const SAARISELKA_TOUR_ID = 9
export const SAARISELKA_VEHICLE_PRICE = 649

const FALLBACK: TourPageFallback = {
  title: 'Rovaniemi ⇄ Saariselkä Private Transfer',
  lede: 'Private door-to-door transfer between Rovaniemi and Saariselkä. €649 per vehicle, one way.',
  adultPrice: SAARISELKA_VEHICLE_PRICE,
  childPrice: SAARISELKA_VEHICLE_PRICE,
  maxCapacity: 8,
  duration: 'About 3–3.5 hours',
  groupSize: 'Up to 8 passengers / vehicle',
  pickupFact: 'Airport, hotel or accommodation',
  description:
    'Private vehicle with professional driver between Rovaniemi and Saariselkä. Price is per vehicle for one way — changing passenger count within capacity does not change the fare. Confirm direction, pickup time, flight number and luggage when you book.',
  benefits: [
    '€649 flat rate per vehicle, one way',
    'Door-to-door: airport, hotel or accommodation',
    'Up to 8 passengers depending on luggage',
  ],
  included: [
    'Private vehicle and professional driver',
    'One-way transfer Rovaniemi ⇄ Saariselkä',
    'Pickup from airport, hotel or accommodation',
    'Direct route — no shared shuttle stops',
  ],
  excluded: ['Meals and personal expenses', 'Return journey (book separately if needed)'],
  gallery: [
    { src: '/transportation1.jpg', alt: 'Private Lapland transfer vehicle' },
    { src: '/transportation2.jpg', alt: 'Winter road transfer in Finnish Lapland' },
    { src: '/transportation3.jpg', alt: 'Airport and hotel transfer service' },
  ],
  faqs: [
    {
      question: 'Is €649 per person or per vehicle?',
      answer:
        'Per vehicle, one way. Passenger count within capacity (up to 8, luggage dependent) does not multiply the price.',
    },
    {
      question: 'Can I book both directions?',
      answer: 'Yes — book each direction as a separate one-way transfer, or contact us for a return plan.',
    },
    {
      question: 'Do you do airport pickups?',
      answer:
        'Yes. Add your flight number and terminal details in special requests so we can time the pickup correctly.',
    },
    {
      question: 'How long is the drive?',
      answer: 'Typically about 3–3.5 hours depending on weather and road conditions.',
    },
  ],
  whatToBring: 'Warm layers for boarding in winter. Note oversized luggage or sports equipment when booking.',
  knowBefore:
    'Free cancellation up to 24 hours before departure. Price does not change with passenger count within capacity.',
}

const TransportationSaariselka = () => {
  const cms = useCmsTourPresentation(SAARISELKA_TOUR_ID, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Transfers', to: '/transportation' },
          { label: cms.title },
        ]}
        eyebrow="Private transfer · Per vehicle"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Price', value: `€${cms.adultPrice} / vehicle` },
          { label: 'Duration', value: cms.duration || 'About 3–3.5 hours' },
          { label: 'Capacity', value: cms.groupSize || 'Up to 8' },
          { label: 'Pickup', value: cms.pickupFact },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            priceNote="/ vehicle · one way"
            trustLines={[
              '€649 flat — not per passenger',
              'Secure Stripe payment',
              'Airport or hotel pickup',
              'Free cancellation 24h before',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={SAARISELKA_TOUR_ID}
                tourName={cms.bookingTourName}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                pricingModel="per_vehicle"
                chrome="embedded"
                tone="light"
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="About this transfer">
          <p className="leading-relaxed text-text-muted">{cms.fullDescription || FALLBACK.description}</p>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why book this route" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              {
                title: 'What to tell us when booking',
                content:
                  'Direction (Rovaniemi → Saariselkä or return), pickup time, pickup address or terminal, destination, flight number if applicable, passenger count, and luggage notes.',
              },
              {
                title: 'What to bring',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Cancellation',
                content: cms.cancellationInfo || cms.knowBefore || FALLBACK.knowBefore!,
              },
            ]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="saariselka-transfer-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar
        priceFrom={cms.pricing.current}
        onBook={scrollToBook}
        label="Book transfer"
      />
    </div>
  )
}

export default TransportationSaariselka
