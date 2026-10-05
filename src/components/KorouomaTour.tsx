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
  title: 'Korouoma Canyon Winter Adventure',
  lede: 'Guided winter hike to frozen waterfalls — transport from Rovaniemi and campfire picnic included.',
  adultPrice: 129,
  childPrice: 109,
  maxCapacity: 16,
  duration: '6 hours',
  groupSize: 'Max 8 / vehicle',
  pickupFact: 'Rovaniemi',
  description:
    'Winter hike through Korouoma Canyon — about 100 km from Rovaniemi, then snow-covered trails among towering cliffs and frozen waterfalls. Campfire break with grilled snacks and hot drinks. Transport, guiding, and picnic included; bring your own warm winter clothing.',
  benefits: [
    'Winter hike among frozen waterfalls and canyon cliffs',
    'Campfire picnic with grilled snacks and hot drinks',
    'Small groups — max 8 per vehicle from Rovaniemi',
  ],
  included: [
    'Hotel pickup and drop-off from Rovaniemi',
    'Professional guide (English & Finnish)',
    'Campfire picnic with grilled snacks and hot drinks',
    'Guided hike to Korouoma’s frozen waterfalls',
    'Photo stops at scenic viewpoints',
    'Warm, comfortable minivan or minibus',
    'Small group — max 8 people per vehicle',
    'Expert knowledge of Korouoma geology and nature',
  ],
  excluded: ['Warm winter clothing (bring layered Arctic clothing and sturdy footwear)'],
  gallery: [
    { src: '/korouoma1.jpg', alt: 'Frozen waterfall and snowy cliffs at Korouoma Canyon' },
    { src: '/korouoma2.jpg', alt: 'Winter hiking trail through Korouoma Canyon Nature Reserve' },
  ],
  faqs: [
    {
      question: 'How long is the Korouoma Canyon tour?',
      answer:
        'About 6 hours in total — roughly 1.5 hours each way from Rovaniemi and about 3 hours at the canyon for hiking, photos, and a campfire picnic.',
    },
    {
      question: 'What should I wear?',
      answer:
        'Warm layers, winter boots, gloves, and a hat. Clothing is not provided. The hike is outdoors in snowy canyon conditions.',
    },
    {
      question: 'Is the tour difficult?',
      answer:
        'It is a moderate outdoor hike on winter trails. It is not suitable for wheelchair users. A reasonable fitness level helps you enjoy the canyon walks.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Yes. Hotel pickup and drop-off from Rovaniemi are included, along with an English & Finnish guide and a warm vehicle.',
    },
    {
      question: 'Is this suitable for children?',
      answer:
        'Children are welcome with an adult if they can manage a moderate outdoor winter hike. Child pricing applies for ages 0–17.',
    },
  ],
  whatToBring: 'The tour is outdoors in winter conditions — dress in warm layers and sturdy footwear.',
  knowBefore:
    'Not suitable for wheelchair users. Tell us about snack allergies when you book. Free cancellation up to 24 hours before departure.',
}

const KorouomaTour = () => {
  const cms = useCmsTourPresentation(6, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: '~09:00',
      title: 'Pickup in Rovaniemi',
      text: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      time: '1.5 h',
      title: 'Drive to Korouoma',
      text: 'About 100 km by warm vehicle to Korouoma Canyon Nature Reserve.',
    },
    {
      time: '3 h',
      title: 'Guided canyon hike',
      text: 'Snowy trails, frozen waterfalls, photo stops, and a campfire picnic with grilled snacks and hot drinks.',
    },
    {
      time: '1.5 h',
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
        eyebrow="Korouoma · Canyon hike"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || '6 hours' },
          { label: 'Group', value: cms.groupSize || 'Max 8 / vehicle' },
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
              'Campfire picnic included',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={6}
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
                title: 'Outdoor conditions',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Accessibility & cancellation',
                content: cms.knowBefore || FALLBACK.knowBefore!,
              },
            ]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="korouoma-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default KorouomaTour
