import BookingWidget from './booking/BookingWidget'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import TourSection from './tour/TourSection'
import { useCmsTourPresentation, type TourPageFallback } from '../hooks/useCmsTourPresentation'
import { RANUA_DEPARTURE, RANUA_PUBLIC_NAME, RANUA_TOUR_ID } from '../lib/tourBookingRules'

const FALLBACK: TourPageFallback = {
  title: RANUA_PUBLIC_NAME,
  lede:
    'Discover the Arctic wildlife of Ranua Wildlife Park at your own pace. Enjoy comfortable round-trip transportation from Rovaniemi with your entrance ticket included. Explore the park independently, without a guided tour.',
  adultPrice: 99,
  childPrice: 79,
  maxCapacity: 16,
  duration: '~5 hours',
  groupSize: 'Max 16',
  pickupFact: 'Hotel pickup included',
  departureTime: RANUA_DEPARTURE,
  description:
    'Round-trip transportation from Rovaniemi to Ranua Wildlife Park with park admission included. Meet polar bears and 50+ Arctic and northern species on forest trails — lynx, wolves, moose, reindeer, arctic foxes, and more. You explore the park independently at your own pace. Your driver provides transportation, not a guided tour inside the park.',
  benefits: [
    'Round-trip transportation from Rovaniemi',
    'Wildlife park admission included',
    'Independent park visit — no guided tour',
    'Time to explore polar bears and 50+ Arctic species at your own pace',
  ],
  included: [
    'Round-trip transportation from Rovaniemi',
    'Ranua Wildlife Park admission ticket',
    'Professional driver',
    'Time to explore the park independently',
    'Return transportation to Rovaniemi',
  ],
  excluded: [
    'Guided wildlife park tour',
    'Meals and drinks',
    'Personal expenses',
    'Winter clothing rental',
  ],
  gallery: [
    { src: '/ranua1.jpg', alt: 'Ranua Wildlife Park in Finnish Lapland' },
    { src: '/ranua2.jpeg', alt: 'Arctic animals at Ranua Wildlife Park' },
    { src: '/ranua3.jpeg', alt: 'Polar bear habitat at Ranua Wildlife Park' },
    { src: '/ranua4.jpeg', alt: 'Forest trails at Ranua Wildlife Park' },
    { src: '/ranua5.jpeg', alt: 'Northern species at Ranua Wildlife Park' },
  ],
  faqs: [
    {
      question: 'Is this a guided tour of the park?',
      answer:
        'No. This is a self-guided park visit. Royal Nordic provides round-trip transportation and your entrance ticket. You explore Ranua Wildlife Park independently. The driver is not a park guide.',
    },
    {
      question: 'Are entrance tickets included?',
      answer:
        'Yes. Ranua Wildlife Park admission is always included in this product. There is no transfer-only option on royalnordic.fi.',
    },
    {
      question: 'What time does the experience start?',
      answer:
        'The experience starts at 10:00. Exact hotel pickup time is sent after booking — please be ready at your confirmed pickup location.',
    },
    {
      question: 'How long is the experience?',
      answer:
        'About 5 hours in total, including transfers and time to explore the park. Start time is 10:00; exact pickup time is confirmed after booking.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Round-trip transportation from the Rovaniemi area is included. Enter your hotel or pickup address at checkout. Exact pickup time is sent after booking.',
    },
    {
      question: 'Is it good for families?',
      answer:
        'Yes. Child pricing applies for ages 0–17. The park has walking paths suited to a relaxed, independent visit.',
    },
    {
      question: 'What should we wear?',
      answer:
        'Warm winter clothing and comfortable walking shoes are recommended. Clothing rental is not included.',
    },
    {
      question: 'What is the cancellation policy?',
      answer:
        'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
    },
  ],
  whatToBring:
    'Warm winter clothing and comfortable walking shoes. A camera or smartphone is recommended. Clothing rental is not included.',
  knowBefore:
    'This is a self-guided park visit. Your driver provides transportation, not a guided tour inside the park. Entrance tickets are included. The experience starts at 10:00; exact pickup time is sent after booking. Explore at your own pace within the scheduled visit window. Return departure time and meeting location are communicated to guests before the return drive.',
}

const itinerary = [
  {
    time: '10:00',
    title: 'Pickup in Rovaniemi',
    text: 'We collect you from the supported Rovaniemi area. Exact pickup time is sent after booking.',
  },
  {
    title: 'Drive to Ranua Wildlife Park',
    text: 'Comfortable transfer through Lapland to the park entrance.',
  },
  {
    title: 'Independent wildlife park visit',
    text: 'Explore habitats and forest trails at your own pace — polar bears, lynx, wolves, moose, reindeer, arctic foxes, and more. No guided park tour.',
  },
  {
    title: 'Meet the driver',
    text: 'Return to the agreed departure point at the communicated meeting time.',
  },
  {
    title: 'Return to Rovaniemi',
    text: 'Round-trip transfer back to your drop-off in the Rovaniemi area.',
  },
]

const RanuaZooTour = () => {
  const cms = useCmsTourPresentation(RANUA_TOUR_ID, FALLBACK)
  const departure = cms.departureTime || RANUA_DEPARTURE

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: cms.title },
        ]}
        eyebrow="Ranua · Entry & transfer"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || '~5 hours' },
          { label: 'Start', value: departure },
          { label: 'Pickup', value: cms.pickupFact || 'Hotel pickup included' },
          { label: 'Visit', value: 'Independent · no guided tour' },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
            offerLine={cms.pricing.saleActive ? undefined : 'WINTER20 · Save 20% at checkout'}
            trustLines={[
              `Starts ${departure}`,
              'Tickets included',
              'Self-guided visit',
              'Free cancellation',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingWidget
                tourId={RANUA_TOUR_ID}
                tourName={cms.bookingTourName}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                departureTime={departure}
                requiresHotelPickup
                cancellationNote="Free cancellation up to 24 hours before departure."
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="Overview">
          <p className="leading-relaxed text-text-muted">
            {cms.fullDescription || FALLBACK.description}
          </p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              'Round-trip transportation from Rovaniemi',
              'Wildlife park admission included',
              'Independent park visit',
              'No guided tour',
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/90"
              >
                <span className="mt-0.5 text-aurora-soft" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Highlights" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="Itinerary">
          <ExperienceItinerary steps={itinerary} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            Start time is {departure}. Exact hotel pickup time is sent after booking.
          </p>
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-white">Pickup. </span>
            {cms.pickupInfo ||
              'Round-trip transportation from the supported Rovaniemi area is included. Enter your hotel or pickup address at checkout. The experience starts at 10:00; exact pickup time is sent after booking.'}
          </p>
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              {
                title: 'Start time & pickup',
                content:
                  'The experience starts at 10:00. Exact hotel pickup time is sent after booking. Please be ready at your confirmed pickup location.',
              },
              {
                title: 'Self-guided visit',
                content: cms.knowBefore || FALLBACK.knowBefore!,
              },
              {
                title: 'What to bring',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Meals',
                content:
                  cms.importantInfo ||
                  'Meals and drinks are not included. Cafés and restaurants are available at the park.',
              },
              {
                title: 'Cancellation',
                content:
                  cms.cancellationInfo ||
                  'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
              },
            ]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="ranua-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default RanuaZooTour
