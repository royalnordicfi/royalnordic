import { Link } from 'react-router-dom'
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
  title: 'Family-Friendly Northern Lights Tour',
  lede: 'Two-hour aurora evening from Rovaniemi — pickup, warm drinks, guide for all ages. Aurora not guaranteed.',
  adultPrice: 79,
  childPrice: 59,
  maxCapacity: 16,
  duration: '2 hours',
  groupSize: 'Max 16',
  pickupFact: 'Rovaniemi',
  description:
    'Hotel pickup in Rovaniemi, then darker viewing spots chosen for the evening’s weather. A shorter format for families and all ages.',
  benefits: [
    'About 2 hours — shorter evening format for families',
    'Hotel pickup and viewing stops away from city lights',
    'Hot drinks, snacks, and stories about the aurora and Lapland',
  ],
  included: [
    'Hotel pickup and drop-off',
    'Professional local guide (English & Finnish)',
    'Hot drinks and snacks',
    'Professional photos of you with the Northern Lights',
    'Warm vehicle for the journey',
  ],
  excluded: ['Warm winter clothing (bring layered outdoor clothing)'],
  gallery: [
    { src: '/family1.jpg', alt: 'Family watching the Northern Lights in Lapland' },
    { src: '/family2.jpg', alt: 'Family aurora evening near Rovaniemi' },
    { src: '/family3.jpg', alt: 'Parents and children on a Northern Lights tour' },
    { src: '/family4.jpg', alt: 'Winter night family experience in Finnish Lapland' },
  ],
  faqs: [
    {
      question: 'Are the Northern Lights guaranteed on this tour?',
      answer:
        'No. This is a shorter family-friendly evening and aurora sightings are never 100% guaranteed. If you want our guaranteed product, book the Guaranteed Northern Lights Tour.',
    },
    {
      question: 'What time does the tour start?',
      answer:
        'Hotel pickup is typically around 21:00 in the Rovaniemi area. Exact pickup time is confirmed after booking.',
    },
    {
      question: 'Is it suitable for children?',
      answer:
        'Yes — the format is designed for families and all ages. Child pricing applies for ages 0–17. Bring warm outdoor layers for viewing stops.',
    },
    {
      question: 'How long is the tour?',
      answer: 'About 2 hours including pickup, viewing stops with hot drinks, and return to Rovaniemi.',
    },
  ],
  whatToBring: 'Designed for all ages — a shorter, comfortable evening. Dress warmly; viewing stops are outdoors.',
  knowBefore: 'Free cancellation up to 24 hours before departure.',
}

const FamilyFriendlyNorthernLights = () => {
  const cms = useCmsTourPresentation(8, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: '~21:00',
      title: 'Pickup',
      text: 'Hotel pickup in the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      title: 'Guided aurora evening',
      text: 'Drive to darker viewing spots, enjoy hot drinks and snacks, and listen to stories about the lights and Lapland while we watch the sky (~2 h).',
    },
    {
      title: 'Return to Rovaniemi',
      text: 'Drop-off at your accommodation.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Northern Lights', to: '/northern-lights-tours' },
          { label: cms.title },
        ]}
        eyebrow="Rovaniemi · Family aurora"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || '2 hours' },
          { label: 'Group', value: cms.groupSize || 'Max 16' },
          { label: 'Pickup', value: cms.pickupFact },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <>
            <BookingAside
              priceFrom={cms.pricing.current}
              referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
              offerLine={cms.pricing.saleActive ? undefined : 'WINTER20 · Save 20% at checkout'}
              trustLines={[
                'Free cancellation',
                'Secure payment',
                'Hotel pickup',
                'Family format',
              ]}
            >
              {cms.loading && !cms.tour ? (
                <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
              ) : (
                <BookingForm
                  tourId={8}
                  tourName={cms.bookingTourName}
                  adultPrice={cms.adultPrice}
                  childPrice={cms.childPrice}
                  maxCapacity={cms.maxCapacity}
                  seasonStart="09-15"
                  seasonEnd="04-15"
                  chrome="embedded"
                  tone="light"
                />
              )}
            </BookingAside>
            <p className="mt-3 text-center text-sm text-text-muted">
              <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
                Want a guaranteed aurora hunt?
              </Link>
            </p>
          </>
        }
      >
        <TourSection eyebrow="About" title="About this experience">
          <p className="leading-relaxed text-text-muted">
            {cms.fullDescription || FALLBACK.description}{' '}
            For our 100% camera-capture Aurora guarantee, see the{' '}
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Guaranteed Northern Lights Tour
            </Link>
            .
          </p>
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
                title: 'Aurora expectations',
                content: (
                  <>
                    Northern Lights are a natural phenomenon and cannot be guaranteed on this tour. For a
                    guaranteed product, see our{' '}
                    <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
                      Guaranteed Northern Lights Tour
                    </Link>
                    .
                  </>
                ),
              },
              {
                title: 'Families & clothing',
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
          <ProductFaq items={cms.faqs} schemaId="family-nl-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default FamilyFriendlyNorthernLights
