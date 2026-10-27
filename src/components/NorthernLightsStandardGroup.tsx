import { Link } from 'react-router-dom'
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
import {
  STANDARD_GROUP_ADULT_PRICE,
  STANDARD_GROUP_CAPACITY,
  STANDARD_GROUP_CHILD_PRICE,
  STANDARD_GROUP_DEPARTURE,
  STANDARD_GROUP_MEETING_POINT,
  STANDARD_GROUP_NAME,
  STANDARD_GROUP_SEASON_END,
  STANDARD_GROUP_SEASON_START,
  STANDARD_GROUP_TOUR_ID,
} from '../lib/tourBookingRules'

const FALLBACK: TourPageFallback = {
  title: STANDARD_GROUP_NAME,
  lede:
    'Affordable large-group bus tour from Rovaniemi, with an English-speaking guide, professional aurora photography, and our Northern Lights guarantee.',
  adultPrice: STANDARD_GROUP_ADULT_PRICE,
  childPrice: STANDARD_GROUP_CHILD_PRICE,
  maxCapacity: STANDARD_GROUP_CAPACITY,
  duration: 'About 5 hours',
  groupSize: 'Large group · max 50',
  pickupFact: STANDARD_GROUP_MEETING_POINT,
  seasonStart: STANDARD_GROUP_SEASON_START,
  seasonEnd: STANDARD_GROUP_SEASON_END,
  departureTime: STANDARD_GROUP_DEPARTURE,
  description:
    'Experience the magical Northern Lights on our affordable Standard Group bus tour from Rovaniemi. Travel comfortably into the Lappish wilderness with an experienced English-speaking guide as we search for clear skies and the best possible conditions to witness the Aurora Borealis. This is a large-group bus experience with up to 50 guests. Professional Northern Lights photography is included, along with our Northern Lights guarantee.',
  benefits: [
    'Large-group bus tour for up to 50 guests',
    'Departs Ruokasenkatu 3 at 20:00',
    'Professional Northern Lights photography included',
    'English-speaking guide',
    'Northern Lights guarantee — see Terms',
  ],
  included: [
    'Bus transportation',
    'English-speaking guide',
    'Professional aurora photography',
    'Applicable Northern Lights guarantee',
  ],
  excluded: ['Hotel pickup and drop-off', 'Thermal clothing', 'Food and drinks'],
  gallery: [
    { src: '/nortti5.jpg', alt: 'Northern Lights over a snowy forest in Finnish Lapland' },
    { src: '/nortti1.jpg', alt: 'Aurora Borealis on a winter night near Rovaniemi' },
    { src: '/nortti3.jpg', alt: 'Green aurora above the Lappish wilderness' },
    { src: '/lights7.jpg', alt: 'Northern Lights above snowy Lapland trees' },
  ],
  faqs: [
    {
      question: 'Is this a small-group tour with hotel pickup?',
      answer:
        'No. This is a large-group bus tour for up to 50 guests. You meet the bus at Ruokasenkatu 3, 96100 Rovaniemi. Hotel pickup and drop-off are not included.',
    },
    {
      question: 'What time does the tour depart?',
      answer:
        'The bus departs at 20:00 from Ruokasenkatu 3. The tour lasts about 5 hours, depending on weather and viewing conditions.',
    },
    {
      question: 'When can I book?',
      answer:
        'The season is 1 November through 31 March. Dates outside that season are closed. Inside the season, only dates opened for this departure can be booked.',
    },
    {
      question: 'What if we do not see the Northern Lights?',
      answer:
        'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
    },
    {
      question: 'What is the cancellation policy?',
      answer:
        'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
    },
  ],
  whatToBring:
    'Bring your own thermal layers, windproof outerwear, warm boots, hat, and gloves. Thermal clothing is not included.',
  knowBefore:
    'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
}

const NorthernLightsStandardGroup = () => {
  const cms = useCmsTourPresentation(STANDARD_GROUP_TOUR_ID, FALLBACK)
  const departure = cms.departureTime || STANDARD_GROUP_DEPARTURE
  const meetingPoint = cms.pickupFact || STANDARD_GROUP_MEETING_POINT
  const capacity = cms.maxCapacity || STANDARD_GROUP_CAPACITY

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: departure,
      title: 'Meet the bus',
      text: `Meeting point: ${meetingPoint}. Hotel pickup is not included. Be at the stop a few minutes before departure.`,
    },
    {
      title: 'Wilderness search',
      text: 'Travel by tour bus with an English-speaking guide toward clearer skies in the Lappish wilderness.',
    },
    {
      title: 'Aurora and photographs',
      text: 'Time on site depends on the sky. Professional photographs of the Northern Lights are included.',
    },
    {
      title: 'Return',
      text: 'The evening lasts about 5 hours, depending on weather and viewing conditions, and ends back at the meeting point.',
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
        eyebrow="Rovaniemi · Large group bus"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        proof={
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-aurora-soft">
            Large group bus tour · Maximum {capacity} guests · Meeting point departure
          </p>
        }
        facts={[
          { label: 'Duration', value: cms.duration || 'About 5 hours' },
          { label: 'Group', value: cms.groupSize || `Large group · max ${capacity}` },
          { label: 'Departure', value: departure },
          { label: 'Meeting point', value: meetingPoint },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
            priceNote="/ adult"
            trustLines={[
              'Free cancellation 24h',
              'Secure payment',
              `Departs ${departure}`,
              'Meeting point only',
            ]}
          >
            <BookingWidget
              tourId={STANDARD_GROUP_TOUR_ID}
              tourName={cms.bookingTourName}
              adultPrice={cms.adultPrice}
              childPrice={cms.childPrice}
              maxCapacity={capacity}
              seasonStart={cms.seasonStart || STANDARD_GROUP_SEASON_START}
              seasonEnd={cms.seasonEnd || STANDARD_GROUP_SEASON_END}
              departureTime={departure}
              meetingPointDeparture
              meetingPoint={meetingPoint}
            />
          </BookingAside>
        }
        bookingBelow={
          <p className="mt-3 text-center text-sm text-text-muted">
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Prefer a small group with hotel pickup?
            </Link>
          </p>
        }
      >
        <TourSection eyebrow="About" title="About this experience">
          <p className="leading-relaxed text-text-muted">
            {cms.fullDescription || FALLBACK.description}
          </p>
          <p className="mt-4 leading-relaxed text-text-muted">
            The tour departs from {meetingPoint} at {departure} and lasts approximately 5 hours, depending
            on weather and viewing conditions. This is a large shared group — not a private tour — and hotel
            pickup is not included. If the auroras are not captured on our cameras, you can receive a refund
            or reschedule according to our guarantee conditions.
          </p>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why you’ll love it" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="How the evening works">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-white">Meeting point. </span>
            {cms.pickupInfo ||
              `Hotel pickup and drop-off are not included. Meet the bus at ${meetingPoint}.`}
          </p>
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              {
                title: 'Northern Lights guarantee',
                content:
                  cms.guaranteeInfo ||
                  'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund or can reschedule to another available day, subject to our Terms & Conditions. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
              },
              {
                title: 'Season and availability',
                content:
                  'Bookings are accepted from 1 November through 31 March. Dates outside that season are closed. Inside the season, only dates opened for this departure can be booked — capacity, closures, and cutoffs still apply.',
              },
              {
                title: 'Clothing',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Cancellation',
                content: cms.cancellationInfo || cms.knowBefore || FALLBACK.knowBefore!,
              },
            ]}
          />
        </TourSection>

        <TourSection eyebrow="Other aurora tours" title="Choose the right evening">
          <p className="leading-relaxed text-text-muted">
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Guaranteed Northern Lights & Photography
            </Link>{' '}
            is the small-group tour with hotel pickup.{' '}
            <Link
              to="/family-friendly-northern-lights"
              className="font-medium text-aurora-soft hover:underline"
            >
              Family-Friendly Northern Lights
            </Link>{' '}
            is a shorter evening, and the aurora is not guaranteed on that tour.
          </p>
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="standard-group-nl-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default NorthernLightsStandardGroup
