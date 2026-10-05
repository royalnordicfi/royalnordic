import BookingForm from './BookingForm'
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

const FALLBACK: TourPageFallback = {
  title: 'Nordic Animals of Ranua Zoo',
  lede: 'Rovaniemi day trip to Finland’s northernmost zoo — polar bears, 50+ species, transfers and entrance included.',
  adultPrice: 99,
  childPrice: 79,
  maxCapacity: 16,
  duration: '~5 hours',
  groupSize: 'Max 16',
  pickupFact: 'Rovaniemi',
  description:
    'Guided day trip from Rovaniemi to Ranua Wildlife Park — over 50 Arctic and northern species, including polar bears, lynxes, wolves, moose, reindeer, and arctic foxes on forest trails. Walk spacious habitats, enjoy free time for photos, with transfers and entrance tickets included.',
  benefits: [
    'Day trip from Rovaniemi with transfers and park entrance included',
    'Polar bears, lynx, wolves, and 50+ Arctic species on forest trails',
    'Free time for photos — popular with families and animal lovers',
  ],
  included: [
    'Hotel pickup and drop-off from Rovaniemi',
    'Professional guide (English & Finnish)',
    'Comfortable transportation to Ranua',
    'Entrance tickets to Ranua Wildlife Park',
    'Meet polar bears and 50+ Arctic species',
    'Guidance and tips about Arctic wildlife',
    'Free time to explore and take photos',
    'Small group experience (max 16 people)',
  ],
  excluded: [
    'Meals and drinks (optional lunch available at the park)',
    'Personal expenses and souvenirs',
    'Winter clothing or boot rental',
  ],
  gallery: [
    { src: '/ranua1.jpg', alt: 'Ranua Wildlife Park in Finnish Lapland' },
    { src: '/ranua2.jpeg', alt: 'Arctic animals at Ranua Wildlife Park' },
    { src: '/ranua3.jpeg', alt: 'Polar bear habitat at Ranua' },
    { src: '/ranua4.jpeg', alt: 'Forest trails at Ranua Wildlife Park' },
    { src: '/ranua5.jpeg', alt: 'Northern species at Ranua zoo day trip' },
  ],
  faqs: [
    {
      question: 'What is included in the Ranua tour?',
      answer:
        'Hotel pickup and drop-off from Rovaniemi, entrance tickets to Ranua Wildlife Park, and an English & Finnish guide. Meals and personal expenses are not included.',
    },
    {
      question: 'How long is the day trip?',
      answer:
        'About 5 hours overall, including transfers and time to explore polar bears and 50+ Arctic species at the park.',
    },
    {
      question: 'Is it good for families?',
      answer:
        'Yes. The tour is a popular family daytime experience. Child pricing applies for ages 0–17, and the park has walking paths suitable for a relaxed visit.',
    },
    {
      question: 'What should we wear?',
      answer:
        'Warm clothing and comfortable shoes for outdoor walking. Winter clothing rental is not included.',
    },
  ],
  whatToBring:
    'Wear warm clothing and comfortable shoes suitable for walking. A camera or smartphone is recommended for photography.',
  knowBefore: 'Please tell us in advance about any mobility or dietary requirements.',
}

const RanuaZooTour = () => {
  const cms = useCmsTourPresentation(5, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: '~09:30',
      title: 'Pickup in Rovaniemi',
      text: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      time: '1 h',
      title: 'Drive to Ranua',
      text: 'Scenic drive through Lapland wilderness to Ranua Wildlife Park.',
    },
    {
      time: '~3.5 h',
      title: 'Ranua Wildlife Park',
      text: 'Explore forest trails and habitats — polar bears, lynx, wolves, moose, reindeer, arctic foxes, and more. Free time for photos at your own pace.',
    },
    {
      time: '1 h',
      title: 'Return to Rovaniemi',
      text: 'Drive back and drop-off at your accommodation.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: cms.title },
        ]}
        eyebrow="Ranua · Wildlife day trip"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || '~5 hours' },
          { label: 'Group', value: cms.groupSize || `Max ${cms.maxCapacity}` },
          { label: 'Pickup', value: cms.pickupFact },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
            offerLine={cms.pricing.saleActive ? undefined : 'WINTER20 · Save 20% at checkout'}
            trustLines={[
              'Free cancellation 24h before',
              'Secure Stripe payment',
              'Hotel pickup',
              'Park entrance included',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={5}
                tourName={cms.bookingTourName}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                chrome="embedded"
                tone="light"
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="Overview">
          <p className="leading-relaxed text-text-muted">{cms.fullDescription || FALLBACK.description}</p>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Highlights" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="Itinerary">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Practical information">
          <ExperienceAccordion
            items={[
              {
                title: 'Accessibility & needs',
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
                  'Lunch and drinks are not included — cafés and restaurants are available at the park.',
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
