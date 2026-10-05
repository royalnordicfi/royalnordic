import BookingForm from './BookingForm'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceHighlights from './experience/ExperienceHighlights'
import BookingAside from './experience/BookingAside'
import TourSection from './tour/TourSection'
import { useCmsTourPresentation, type TourPageFallback } from '../hooks/useCmsTourPresentation'

const FALLBACK: TourPageFallback = {
  title: 'Ice Fishing Experience',
  lede: 'Traditional Lapland ice fishing on frozen lakes — guide, equipment, and hot drinks by the fire.',
  adultPrice: 119,
  childPrice: 99,
  maxCapacity: 8,
  duration: '3–4 hours',
  groupSize: 'Max 8',
  pickupFact: 'Rovaniemi',
  description:
    'Join a local guide on frozen lakes near Rovaniemi. You learn traditional ice fishing technique, move between spots as conditions allow, and warm up with hot drinks by the fire. Groups stay small — max 8 guests.',
  benefits: [
    'Frozen lakes away from the city, chosen for ice and conditions that day',
    'Equipment and technique guidance included — no prior experience needed',
    'Warm drinks by the fire between fishing spots',
  ],
  included: [
    'Hotel pick-up and drop-off',
    'Professional local guide',
    'Fishing equipment',
    'Hot drinks and snacks by the fire',
    'Local Lapland culture insights',
    'Small group — max 8 guests',
    'Multiple fishing spots',
  ],
  excluded: ['Warm winter clothing (bring layered outdoor clothing)'],
  gallery: [
    { src: '/icefishing.jpeg', alt: 'Ice fishing on a frozen Lapland lake' },
    { src: '/icefishing2.jpg', alt: 'Traditional ice fishing with a local guide' },
    { src: '/icefishing3.jpg', alt: 'Winter ice fishing experience near Rovaniemi' },
  ],
  faqs: [
    {
      question: 'What is included?',
      answer:
        'Hotel pick-up and drop-off, a professional local guide, fishing equipment, hot drinks and snacks by the fire, and information about local Lapland culture.',
    },
    {
      question: 'How long is the ice fishing experience?',
      answer:
        'About 3–4 hours, typically with pickup around 10:00 and return between 13:00 and 14:00 depending on distance.',
    },
    {
      question: 'Do I need my own clothing?',
      answer:
        'Yes. Warm winter clothing is not included. Bring thermal layers, waterproof outerwear, warm boots, gloves, and a hat for frozen lake conditions.',
    },
    {
      question: 'When can I book?',
      answer:
        'This experience runs in the ice fishing season, typically mid-December through mid-March when lakes near Rovaniemi are safely frozen.',
    },
    {
      question: 'Is this suitable for children?',
      answer:
        'Children are welcome with an adult. Child pricing applies for ages 0–17. Dress warmly — the experience is outdoors on frozen lakes.',
    },
  ],
  whatToBring:
    'Thermal layers, waterproof outerwear, warm boots, gloves, and a hat for frozen lake conditions.',
  knowBefore: 'Free cancellation up to 24 hours before departure. Pickup time and fishing location depend on ice and weather that day.',
}

const IceFishingTour = () => {
  const cms = useCmsTourPresentation(4, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: '10:00',
      title: 'Pickup in Rovaniemi',
      text: 'We collect you from your accommodation.',
    },
    {
      title: 'Drive to the lake',
      text: 'Head to fishing spots chosen for ice and weather that day.',
    },
    {
      title: 'Briefing & setup',
      text: 'Learn safe ice fishing technique with all equipment provided.',
    },
    {
      title: 'On the ice',
      text: 'Fish with your guide — hot drinks by the fire between spots.',
    },
    {
      time: '13:00 – 14:00',
      title: 'Return',
      text: 'Drop-off at your lodging depending on distance traveled.',
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
        eyebrow="Rovaniemi · Winter day trip"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || '3–4 hours' },
          { label: 'Group', value: cms.groupSize || 'Max 8' },
          { label: 'Pickup', value: cms.pickupFact },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
            offerLine={cms.pricing.saleActive ? undefined : 'WINTER20 · Save 20% at checkout'}
            trustLines={[
              'Free cancellation',
              'Secure payment',
              'Hotel pickup',
              'Equipment included',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={4}
                tourName={cms.bookingTourName}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                seasonStart="12-15"
                seasonEnd="03-15"
                chrome="embedded"
                tone="light"
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="About this experience">
          <p className="leading-relaxed text-text-muted">{cms.fullDescription || FALLBACK.description}</p>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why you’ll love it" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="How the experience works">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              {
                title: 'What to bring',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Good to know',
                content: cms.knowBefore || cms.importantInfo || FALLBACK.knowBefore!,
              },
            ]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="ice-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default IceFishingTour
