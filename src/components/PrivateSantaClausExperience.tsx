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
  PRIVATE_SANTA_CAPACITY,
  PRIVATE_SANTA_GROUP_PRICE,
  PRIVATE_SANTA_PUBLIC_NAME,
  PRIVATE_SANTA_REFERENCE_PRICE,
  PRIVATE_SANTA_SEASON_FIRST,
  PRIVATE_SANTA_SEASON_LAST,
  PRIVATE_SANTA_TOUR_ID,
} from '../lib/tourBookingRules'

const FALLBACK: TourPageFallback = {
  title: PRIVATE_SANTA_PUBLIC_NAME,
  lede:
    'Experience the magic of Christmas with an exclusive private visit to Santa Claus in Rovaniemi. Enjoy a cozy festive atmosphere, personal time with Santa, Christmas treats, and comfortable private transportation for your group.',
  adultPrice: PRIVATE_SANTA_GROUP_PRICE,
  childPrice: PRIVATE_SANTA_GROUP_PRICE,
  maxCapacity: PRIVATE_SANTA_CAPACITY,
  duration: 'Approximately 1.5 hours',
  groupSize: 'Private · max 6',
  pickupFact: 'Hotel pickup included',
  description: `Make your visit to Lapland truly unforgettable with an exclusive Private Santa Claus Experience in Rovaniemi.

Your magical Christmas journey begins with comfortable private transportation from your accommodation. Travel to a cozy and traditional Christmas setting, where Santa Claus is waiting to welcome you and your loved ones.

Unlike busy public Santa attractions, this experience is reserved exclusively for your group, allowing you to enjoy a more personal and memorable meeting with Santa.

Spend quality time together, share your Christmas wishes, enjoy warm drinks and festive treats, and capture your own photographs and videos of this special moment.

After your visit, your private driver will take you comfortably back to your accommodation in Rovaniemi.

Perfect for families, couples and anyone looking for an unforgettable Christmas experience in Lapland.`,
  benefits: [
    'Enjoy an exclusive private meeting with Santa Claus in Rovaniemi.',
    'Experience Christmas magic in a cozy, traditional setting.',
    'Spend personal time with Santa away from crowded tourist areas.',
    'Enjoy warm drinks and delicious Christmas treats.',
    'Capture memorable photographs and videos with Santa.',
    'Travel comfortably with private round-trip transportation.',
  ],
  included: [
    'Exclusive private Santa Claus meeting',
    'Private round-trip transportation',
    'Accommodation pickup and return in Rovaniemi',
    'Personal time with Santa Claus',
    'Warm drinks and Christmas treats',
    'Opportunity to take personal photos and videos',
  ],
  excluded: [
    'Personal purchases and souvenirs',
    'Additional meals and drinks',
    'Professional photography services',
    'Optional gratuities',
  ],
  gallery: [
    {
      src: '/santaclaus1.jpg',
      alt: 'Private Santa Claus meeting in Rovaniemi',
      position: 'center 42%',
    },
    { src: '/santaclaus2.jpg', alt: 'Festive Santa Claus Christmas scene' },
    { src: '/santaclaus3.jpg', alt: 'Cozy Christmas fireplace setting' },
    { src: '/santaclaus4.jpg', alt: 'Santa Claus seated indoors for a private visit' },
    { src: '/santaclaus5.jpg', alt: 'Christmas details during the Santa experience' },
    { src: '/santaclaus6.jpg', alt: 'Festive Santa Claus atmosphere in Lapland' },
  ],
  faqs: [
    {
      question: 'Is this a shared group experience?',
      answer:
        'No. This experience is reserved exclusively for your private group of up to six participants. Other customers are not added to your booking.',
    },
    {
      question: 'How does pricing work?',
      answer:
        'The price is €1,169 for the entire private group, whether you book for one guest or six. The price is not multiplied by the number of participants.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Yes. Private accommodation pickup and return within the supported Rovaniemi area are included. Enter your hotel or pickup address at checkout. Exact pickup time is confirmed before the experience.',
    },
    {
      question: 'How long is the experience?',
      answer:
        'Approximately 1.5 hours in total, including private transportation and your exclusive Santa Claus meeting.',
    },
    {
      question: 'When can I book?',
      answer:
        'This experience operates from 15 November 2026 through 31 March 2027. Dates outside that window cannot be booked.',
    },
    {
      question: 'What is the cancellation policy?',
      answer:
        'Free cancellation up to 24 hours before departure. Cancellations within 24 hours of the start time are non-refundable.',
    },
  ],
  whatToBring: 'Warm winter clothing, camera or smartphone, and Christmas wishes for Santa.',
  knowBefore:
    'This is a private experience for a maximum of six participants. Only your booked group participates in the Santa meeting. Free cancellation up to 24 hours before departure.',
}

const itinerary = [
  {
    title: 'Private pickup in Rovaniemi',
    text: 'Your private driver collects your group from your accommodation at the confirmed pickup time.',
  },
  {
    title: 'Comfortable transportation',
    text: 'Enjoy a private journey to the Christmas experience location.',
  },
  {
    title: 'Exclusive Santa Claus meeting',
    text: 'Meet Santa Claus in a cozy and traditional Christmas setting, reserved exclusively for your group.',
  },
  {
    title: 'Christmas treats and photographs',
    text: 'Enjoy warm drinks, festive treats and the opportunity to capture memorable photographs.',
  },
  {
    title: 'Return transportation',
    text: 'Your private driver takes your group back to your accommodation in Rovaniemi.',
  },
]

const PrivateSantaClausExperience = () => {
  const cms = useCmsTourPresentation(PRIVATE_SANTA_TOUR_ID, FALLBACK)
  const capacity = cms.maxCapacity || PRIVATE_SANTA_CAPACITY
  const groupPrice = cms.pricing.current || PRIVATE_SANTA_GROUP_PRICE
  const referencePrice = cms.pricing.saleActive
    ? cms.pricing.reference ?? PRIVATE_SANTA_REFERENCE_PRICE
    : undefined

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const descriptionParagraphs = (cms.fullDescription || FALLBACK.description || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: cms.title },
        ]}
        eyebrow="Rovaniemi · Private Christmas"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || 'Approximately 1.5 hours' },
          { label: 'Group', value: cms.groupSize || `Private · max ${capacity}` },
          { label: 'Experience', value: 'Private · exclusive' },
          { label: 'Pickup', value: cms.pickupFact || 'Hotel pickup included' },
        ]}
        booking={
          <BookingAside
            priceFrom={groupPrice}
            referencePrice={referencePrice}
            priceNote="/ private group"
            trustLines={[
              'Private experience',
              `Up to ${capacity} guests`,
              'Hotel pickup & return',
              'Free cancellation 24h',
            ]}
            offerLine="Exclusive private Santa meeting · Flat group price"
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingWidget
                tourId={PRIVATE_SANTA_TOUR_ID}
                tourName={cms.bookingTourName}
                adultPrice={groupPrice}
                childPrice={groupPrice}
                maxCapacity={capacity}
                absoluteFrom={PRIVATE_SANTA_SEASON_FIRST}
                absoluteTo={PRIVATE_SANTA_SEASON_LAST}
                pricingModel="per_vehicle"
                requiresHotelPickup
                totalNote="Per private group · VAT incl."
                guestPriceNote="Price is for your private group, not per person."
                cancellationNote="Free cancellation up to 24 hours before departure."
              />
            )}
          </BookingAside>
        }
      >
        <TourSection eyebrow="About" title="Overview">
          <div className="space-y-4">
            {descriptionParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="leading-relaxed text-text-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </TourSection>

        <TourSection eyebrow="Highlights" title="Highlights" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="Itinerary">
          <ExperienceItinerary steps={itinerary} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            The experience lasts approximately 1.5 hours including private transportation. Exact
            pickup time is confirmed before departure.
          </p>
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
          <p className="mt-5 text-sm leading-relaxed text-text-muted">
            <span className="font-medium text-white">Pickup. </span>
            {cms.pickupInfo ||
              'Private accommodation pickup and return within the supported Rovaniemi pickup area are included. Enter your hotel or pickup address at checkout.'}
          </p>
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              {
                title: 'Group size',
                content:
                  'This is a private experience for a maximum of six participants. Only your booked group participates in the Santa meeting.',
              },
              {
                title: 'Pickup',
                content:
                  cms.pickupInfo ||
                  'Private accommodation pickup and return within the supported Rovaniemi pickup area. Exact pickup time is confirmed before the experience. Guests should be ready at their confirmed pickup location.',
              },
              {
                title: 'What to bring',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Good to know',
                content:
                  cms.importantInfo ||
                  'The Santa meeting takes place indoors in a cozy Christmas setting. Guests may take their own photographs and videos. Warm drinks and Christmas treats are included. Suitable for families, couples and private groups.',
              },
              {
                title: 'Accessibility',
                content:
                  'Please contact us before booking if anyone in your group has reduced mobility. Accessibility depends on the private location and vehicle arrangements for your departure.',
              },
              {
                title: 'Season',
                content:
                  'Available from 15 November 2026 through 31 March 2027. Dates outside this window cannot be booked.',
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

        <TourSection eyebrow="Also explore" title="Related experiences">
          <p className="leading-relaxed text-text-muted">
            Pair your Christmas visit with{' '}
            <Link to="/ranua-zoo" className="font-medium text-aurora-soft hover:underline">
              Ranua Wildlife Park
            </Link>
            ,{' '}
            <Link to="/korouoma-canyon" className="font-medium text-aurora-soft hover:underline">
              Korouoma Canyon
            </Link>
            , or a{' '}
            <Link
              to="/northern-lights-private-tour"
              className="font-medium text-aurora-soft hover:underline"
            >
              Private Northern Lights Tour
            </Link>
            .
          </p>
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="private-santa-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar
        priceFrom={groupPrice}
        referencePrice={referencePrice}
        unitLabel="/ private group"
        onBook={scrollToBook}
      />
    </div>
  )
}

export default PrivateSantaClausExperience
