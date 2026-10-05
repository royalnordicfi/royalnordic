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
  title: 'Snowshoe Adventure',
  lede: 'Snowshoe rental with delivery to your lodging, safety briefing, and pickup when you are done.',
  adultPrice: 79,
  childPrice: 49,
  maxCapacity: 3,
  duration: 'Flexible rental',
  groupSize: 'Any size',
  pickupFact: 'Rovaniemi',
  description:
    'Rent professional snowshoes and explore near Rovaniemi at your own pace. We deliver to your accommodation, run a safety briefing, and collect the gear when you finish. Suited to families and groups who want a self-guided winter outing without a full-day guided tour.',
  benefits: [
    'Equipment delivered to your lodging in Rovaniemi',
    'Safety briefing and local route tips — explore at your own pace',
    'Not a guided tour: we deliver, brief you, and collect when you are done',
  ],
  included: [
    'Professional snowshoe equipment for all sizes',
    'Detailed safety briefing and instructions',
    'Equipment delivery to your accommodation',
    'Equipment pickup when finished',
    'Local area recommendations',
  ],
  excluded: [],
  gallery: [
    { src: '/snowshoe1.jpg', alt: 'Snowshoeing in Lapland winter forest' },
    { src: '/snowshoe2.jpg', alt: 'Snowshoe rental adventure near Rovaniemi' },
    { src: '/snowshoe3.jpg', alt: 'Winter landscape on snowshoes in Finnish Lapland' },
    { src: '/snowshoe4.jpg', alt: 'Exploring Lapland on traditional snowshoes' },
    { src: '/snowshoe5.jpg', alt: 'Snowshoe trek through pristine wilderness' },
    { src: '/snowshoe6.jpg', alt: 'Snowshoe equipment delivery in Rovaniemi' },
  ],
  faqs: [
    {
      question: 'Is this a guided tour?',
      answer:
        'No — this is an equipment rental. We deliver snowshoes to your accommodation in Rovaniemi, provide safety instructions, and collect them when you finish exploring at your own pace.',
    },
    {
      question: 'Where do you deliver?',
      answer:
        'We deliver to your lodging in the Rovaniemi area and collect the equipment when your rental period ends.',
    },
    {
      question: 'When is snowshoe season?',
      answer:
        'Snowshoe rental is typically available from early November through early April, depending on snow conditions in Finnish Lapland.',
    },
    {
      question: 'What is included?',
      answer:
        'Professional snowshoe equipment, a safety briefing, delivery and pickup, and local area recommendations for exploring near Rovaniemi.',
    },
    {
      question: 'Is this suitable for children?',
      answer: 'Yes. Children are welcome with an adult. Child pricing applies for ages 0–17.',
    },
  ],
  whatToBring:
    'This is equipment rental, not a guided tour. We deliver, brief you, and collect — you choose your own pace and routes near Rovaniemi.',
  knowBefore:
    'Typically available from early November through early April, depending on snow conditions.',
}

const SnowshoeRental = () => {
  const cms = useCmsTourPresentation(2, FALLBACK)

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      title: 'Book your snowshoes',
      text: 'Reserve your snowshoe equipment online or contact us directly',
    },
    {
      title: 'Equipment delivery',
      text: "We'll deliver the snowshoes and safety gear to your accommodation",
    },
    {
      title: 'Safety briefing & instructions',
      text: 'Receive detailed instructions on how to use the equipment safely',
    },
    {
      title: 'Explore on your own',
      text: "Walk Lapland's winter landscapes at your own pace",
    },
    {
      title: 'Equipment return',
      text: "We'll collect the snowshoes when you're finished",
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Renting equipment', to: '/renting-equipment' },
          { label: cms.title },
        ]}
        eyebrow="Rovaniemi · Self-guided rental"
        title={cms.title}
        lede={cms.lede}
        images={cms.gallery}
        facts={[
          { label: 'Duration', value: cms.duration || 'Flexible rental' },
          { label: 'Group', value: cms.groupSize || 'Any size' },
          { label: 'Location', value: cms.pickupFact },
          { label: 'Delivery', value: 'To your lodging' },
        ]}
        booking={
          <BookingAside
            priceFrom={cms.pricing.current}
            referencePrice={cms.pricing.saleActive ? cms.pricing.reference ?? undefined : undefined}
            offerLine={cms.pricing.saleActive ? undefined : 'WINTER20 · Save 20% at checkout'}
            trustLines={[
              'Lodging delivery',
              'Secure payment',
              'Safety briefing',
              'Go at your pace',
            ]}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={2}
                tourName={cms.bookingTourName}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                seasonStart="11-01"
                seasonEnd="04-01"
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

        <TourSection eyebrow="Itinerary" title="How it works">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions
            included={cms.included}
            notIncluded={cms.excluded.length > 0 ? cms.excluded : undefined}
          />
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Practical information">
          <ExperienceAccordion
            items={[
              {
                title: 'Self-guided format',
                content: cms.whatToBring || FALLBACK.whatToBring!,
              },
              {
                title: 'Season',
                content: cms.knowBefore || FALLBACK.knowBefore!,
              },
            ]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="snowshoe-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={cms.pricing.current} onBook={scrollToBook} />
    </div>
  )
}

export default SnowshoeRental
