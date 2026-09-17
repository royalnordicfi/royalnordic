import { useEffect, useState } from 'react'
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
import { getAllTours } from '../lib/api'

const GALLERY = [
  { src: '/snowshoe1.jpg', alt: 'Snowshoeing in Lapland winter forest' },
  { src: '/snowshoe2.jpg', alt: 'Snowshoe rental adventure near Rovaniemi' },
  { src: '/snowshoe3.jpg', alt: 'Winter landscape on snowshoes in Finnish Lapland' },
  { src: '/snowshoe4.jpg', alt: 'Exploring Lapland on traditional snowshoes' },
  { src: '/snowshoe5.jpg', alt: 'Snowshoe trek through pristine wilderness' },
  { src: '/snowshoe6.jpg', alt: 'Snowshoe equipment delivery in Rovaniemi' },
]

const HIGHLIGHTS = [
  'Equipment delivered to your lodging in Rovaniemi',
  'Safety briefing and local route tips — explore at your own pace',
  'Not a guided tour: we deliver, brief you, and collect when you are done',
]

const SnowshoeRental = () => {
  const [tourData, setTourData] = useState({
    adult_price: 79,
    child_price: 49,
    max_capacity: 3,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours()
        const snowshoeTour = tours.find((tour) => tour.id === 2)
        if (snowshoeTour) {
          setTourData({
            adult_price: snowshoeTour.adult_price,
            child_price: snowshoeTour.child_price,
            max_capacity: snowshoeTour.max_capacity,
          })
        }
      } catch (error) {
        console.error('Error loading tour data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTourData()
  }, [])

  const price = loading ? 79 : tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const included = [
    'Professional snowshoe equipment for all sizes',
    'Detailed safety briefing and instructions',
    'Equipment delivery to your accommodation',
    'Equipment pickup when finished',
    'Local area recommendations',
  ]

  const faqs = [
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
  ]

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
          { label: 'Snowshoe Adventure' },
        ]}
        eyebrow="Rovaniemi · Self-guided rental"
        title="Snowshoe Adventure"
        lede="Snowshoe rental with delivery to your lodging, safety briefing, and pickup when you are done."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: 'Flexible rental' },
          { label: 'Group', value: 'Any size' },
          { label: 'Location', value: 'Rovaniemi' },
          { label: 'Delivery', value: 'To your lodging' },
        ]}
        booking={
          <BookingAside
            priceFrom={price}
            offerLine="WINTER20 · Save 20% at checkout"
            trustLines={[
              'Delivery to lodging',
              'Secure Stripe payment',
              'Safety briefing included',
              'Explore at your own pace',
            ]}
          >
            {loading ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={2}
                tourName="Snowshoe Adventure"
                adultPrice={tourData.adult_price}
                childPrice={tourData.child_price}
                maxCapacity={tourData.max_capacity}
                seasonStart="11-01"
                seasonEnd="04-01"
                chrome="embedded"
                tone="light"
              />
            )}
          </BookingAside>
        }
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Rent professional snowshoes and explore near Rovaniemi at your own pace. We deliver to your
            accommodation, run a safety briefing, and collect the gear when you finish.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Suited to families and groups who want a self-guided winter outing without a full-day guided tour.
          </p>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Highlights</h2>
          <div className="mt-5">
            <ExperienceHighlights items={HIGHLIGHTS} />
          </div>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">How it works</h2>
          <div className="mt-5">
            <ExperienceItinerary steps={itinerary} />
          </div>
        </section>

        <section className="rn-reveal">
          <ExperienceInclusions included={included} />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Self-guided format',
                  content:
                    'This is equipment rental, not a guided tour. We deliver, brief you, and collect — you choose your own pace and routes near Rovaniemi.',
                },
                {
                  title: 'Season',
                  content:
                    'Typically available from early November through early April, depending on snow conditions.',
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="snowshoe-faq" tone="dark" />
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default SnowshoeRental
