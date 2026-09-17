import { useEffect, useState } from 'react'
import BookingForm from './BookingForm'
import BookingAside from './experience/BookingAside'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceGallery from './ExperienceGallery'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceItinerary from './experience/ExperienceItinerary'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import { getAllTours } from '../lib/api'

const GALLERY = [
  { src: '/snowshoe1.jpg', alt: 'Snowshoeing in Lapland winter forest' },
  { src: '/snowshoe2.jpg', alt: 'Snowshoe rental adventure near Rovaniemi' },
  { src: '/snowshoe3.jpg', alt: 'Winter landscape on snowshoes in Finnish Lapland' },
  { src: '/snowshoe4.jpg', alt: 'Exploring Lapland on traditional snowshoes' },
  { src: '/snowshoe5.jpg', alt: 'Snowshoe trek through pristine wilderness' },
  { src: '/snowshoe6.jpg', alt: 'Snowshoe equipment delivery in Rovaniemi' },
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
      answer:
        'Yes. Children are welcome with an adult. Child pricing applies for ages 0–17.',
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
      title: 'Enjoy your adventure',
      text: "Explore Lapland's beautiful winter landscapes at your own pace",
    },
    {
      title: 'Equipment return',
      text: "We'll collect the snowshoes when you're finished with your adventure",
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-shell-pad pb-14 pt-6 sm:pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Renting equipment', to: '/renting-equipment' },
            { label: 'Snowshoe Adventure' },
          ]}
        />

        <header className="mt-5 max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Self-guided rental</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Snowshoe Adventure
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Explore Finnish Lapland’s winter wonderland at your own pace — we deliver snowshoes to your
            lodging, brief you on safety, and collect when you are done.
          </p>
        </header>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: 'Flexible rental' },
                { label: 'Group', value: 'Any size' },
                { label: 'Location', value: 'Rovaniemi' },
                { label: 'Delivery', value: 'To your lodging' },
              ]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Our snowshoe rental gives you the freedom to explore Finnish Lapland&apos;s winter wonderland at
                your own pace. We provide professional equipment along with instructions on how to use it
                safely.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Perfect for families and groups who want an authentic Lapland winter independently. We deliver
                to your accommodation, provide a safety briefing, and collect everything when you finish.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">How it works</h2>
              <div className="mt-4">
                <ExperienceItinerary steps={itinerary} />
              </div>
            </section>

            <ExperienceInclusions included={included} />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
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
          </div>

          <aside id="book" className="lg:col-span-5">
            <div className="rn-sticky-book">
              <BookingAside
                priceFrom={price}
                trustLines={[
                  'Delivery to your lodging',
                  'Secure Stripe payment',
                  'Safety briefing included',
                  'Explore at your own pace',
                ]}
              >
                {loading ? (
                  <p className="py-10 text-center text-text-muted">Loading availability…</p>
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
                    tone="dark"
                  />
                )}
              </BookingAside>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default SnowshoeRental
