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
  PRIVATE_NL_CAPACITY,
  PRIVATE_NL_DEPARTURE,
  PRIVATE_NL_GROUP_PRICE,
  PRIVATE_NL_NAME,
  PRIVATE_NL_SEASON_END,
  PRIVATE_NL_SEASON_START,
  PRIVATE_NL_TOUR_ID,
} from '../lib/tourBookingRules'

const FALLBACK: TourPageFallback = {
  title: PRIVATE_NL_NAME,
  lede:
    'Experience the Northern Lights exclusively with your own private group, professional guide, comfortable transportation and unforgettable aurora photography.',
  adultPrice: PRIVATE_NL_GROUP_PRICE,
  childPrice: PRIVATE_NL_GROUP_PRICE,
  maxCapacity: PRIVATE_NL_CAPACITY,
  duration: 'About 5 hours',
  groupSize: 'Private · max 8',
  pickupFact: 'Hotel pickup included',
  seasonStart: PRIVATE_NL_SEASON_START,
  seasonEnd: PRIVATE_NL_SEASON_END,
  departureTime: PRIVATE_NL_DEPARTURE,
  description:
    'Discover the magic of the Northern Lights on an exclusive private adventure through the breathtaking wilderness of Finnish Lapland. This experience is reserved entirely for you and your group of up to eight guests, offering a more personal and comfortable way to explore the Arctic night. Your English-speaking guide will take you away from city lights and search for clearer skies, choosing the most promising viewing locations according to weather and aurora conditions. Unlike tours following fixed sightseeing routes, our Northern Lights experiences prioritize finding suitable skies. The Northern Lights are a natural phenomenon, and clear skies are essential for the best viewing opportunities. Professional Northern Lights photography is included, allowing you to enjoy the experience while your guide captures memorable photographs. Hotel pickup and drop-off in the supported Rovaniemi pickup area are included. Our Northern Lights guarantee applies according to the published terms and conditions.',
  benefits: [
    'Exclusive private tour for your group of up to eight guests',
    'Comfortable private transportation with hotel pickup and drop-off',
    'Experienced English-speaking Northern Lights guide',
    'Flexible route based on weather and sky conditions',
    'Professional Northern Lights photography included',
    'Northern Lights guarantee according to our terms',
  ],
  included: [
    'Exclusive private transportation',
    'Hotel pickup and drop-off within the supported pickup area',
    'English-speaking guide',
    'Northern Lights search',
    'Professional aurora photography',
    'Applicable Northern Lights guarantee',
  ],
  excluded: ['Thermal clothing', 'Food and drinks', 'Personal purchases'],
  gallery: [
    {
      src: '/nortti11.jpg',
      alt: 'Private Northern Lights experience under the aurora in Finnish Lapland',
    },
    { src: '/nortti10.jpg', alt: 'Aurora Borealis over Arctic wilderness near Rovaniemi' },
    { src: '/nortti8.jpg', alt: 'Green northern lights above snowy Lapland forest' },
    { src: '/lights8.jpg', alt: 'Aurora reflecting above the Arctic landscape' },
    { src: '/nortti7.jpg', alt: 'Clear winter night during a private aurora hunt' },
  ],
  faqs: [
    {
      question: 'Is this a shared group tour?',
      answer:
        'No. This departure is reserved exclusively for your private group of up to eight guests. Other customers are not added to your booking.',
    },
    {
      question: 'How does pricing work?',
      answer:
        'The price is €1,349 for the entire private group, whether you book for one guest or eight. The price is not multiplied by the number of participants.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Yes. Hotel pickup and drop-off within the supported Rovaniemi pickup area are included. Enter your accommodation at checkout. Exact pickup time is confirmed after booking.',
    },
    {
      question: 'What time does the tour depart?',
      answer:
        'The tour is scheduled for 18:30. Pickup from your accommodation may begin earlier so the group can leave on time.',
    },
    {
      question: 'When can I book?',
      answer:
        'The season is 1 November through 15 April. Dates outside that season are closed. Inside the season, only dates opened for this private departure can be booked.',
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
    'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves. Thermal clothing is not provided.',
  knowBefore:
    'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
}

const NorthernLightsPrivateTour = () => {
  const cms = useCmsTourPresentation(PRIVATE_NL_TOUR_ID, FALLBACK)
  const departure = cms.departureTime || PRIVATE_NL_DEPARTURE
  const capacity = cms.maxCapacity || PRIVATE_NL_CAPACITY
  const groupPrice = cms.pricing.current || PRIVATE_NL_GROUP_PRICE

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: departure,
      title: 'Hotel pickup',
      text: 'We collect you from your accommodation in the supported Rovaniemi pickup area. Exact pickup time is confirmed after booking and may be earlier than departure.',
    },
    {
      title: 'Private wilderness search',
      text: 'Your English-speaking guide drives your private group toward clearer skies, adapting the route to weather and aurora forecasts.',
    },
    {
      title: 'Aurora and photography',
      text: 'Time on site depends on the sky. Professional Northern Lights photographs of your group are included.',
    },
    {
      title: 'Hotel drop-off',
      text: 'The evening lasts about five hours depending on conditions, then returns you to your accommodation.',
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
        eyebrow="Rovaniemi · Private exclusive"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || 'About 5 hours' },
          { label: 'Group', value: cms.groupSize || `Private · max ${capacity}` },
          { label: 'Departure', value: departure },
          { label: 'Pickup', value: cms.pickupFact || 'Hotel pickup included' },
        ]}
        booking={
          <BookingAside
            priceFrom={groupPrice}
            priceNote="/ private group"
            trustLines={[
              'Your own private group',
              `Up to ${capacity} guests`,
              'Hotel pickup included',
              'Free cancellation 24h',
            ]}
            offerLine="Your own private Northern Lights experience · Up to 8 guests"
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingWidget
                tourId={PRIVATE_NL_TOUR_ID}
                tourName={cms.bookingTourName}
                adultPrice={groupPrice}
                childPrice={groupPrice}
                maxCapacity={capacity}
                seasonStart={cms.seasonStart || PRIVATE_NL_SEASON_START}
                seasonEnd={cms.seasonEnd || PRIVATE_NL_SEASON_END}
                departureTime={departure}
                pricingModel="per_vehicle"
                requiresHotelPickup
                totalNote="Per private group · VAT incl."
                guestPriceNote="Price is for your private group, not per person."
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="About this experience">
          <p className="leading-relaxed text-text-muted">{cms.fullDescription || FALLBACK.description}</p>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why choose private" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="How the evening works">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-white">Hotel pickup. </span>
            {cms.pickupInfo ||
              'Hotel pickup and drop-off are included within the supported Rovaniemi pickup area. Enter your accommodation at checkout.'}
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
                  'Bookings are accepted from 1 November through 15 April. Dates outside that season are closed. Inside the season, only dates opened for this private departure can be booked — each night is exclusive to one group.',
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

        <TourSection eyebrow="Other aurora tours" title="Compare Northern Lights experiences">
          <p className="leading-relaxed text-text-muted">
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Guaranteed Northern Lights & Photography
            </Link>{' '}
            is the small-group shared tour with hotel pickup.{' '}
            <Link
              to="/northern-lights-standard-group"
              className="font-medium text-aurora-soft hover:underline"
            >
              Standard Group
            </Link>{' '}
            is the large shared bus departure from Ruokasenkatu 3.
          </p>
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="private-nl-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar
        priceFrom={groupPrice}
        onBook={scrollToBook}
        label="Check availability"
        unitLabel="/ private group"
      />
    </div>
  )
}

export default NorthernLightsPrivateTour
