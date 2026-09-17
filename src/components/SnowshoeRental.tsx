import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Users } from 'lucide-react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
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

  const features = [
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
      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-4 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/renting-equipment" className="hover:text-white">Renting equipment</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Snowshoe Adventure</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Self-guided rental</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Snowshoe Adventure
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Explore Finnish Lapland’s winter wonderland at your own pace — we deliver snowshoes to your
            lodging, brief you on safety, and collect when you are done.
          </p>
        </div>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: 'Flexible rental' },
                { icon: Users, label: 'Group', value: 'Any size' },
                { icon: MapPin, label: 'Location', value: 'Rovaniemi' },
                { icon: CheckCircle, label: 'Delivery', value: 'To your lodging' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-rn border border-white/10 bg-surface p-3.5">
                  <Icon size={16} className="text-aurora" aria-hidden />
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-text-dim">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">About this rental</h2>
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
              <h2 className="font-display text-2xl font-semibold text-white">What&apos;s included</h2>
              <ul className="mt-4 space-y-2.5">
                {features.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-text-muted">
                    <CheckCircle className="mt-0.5 shrink-0 text-aurora" size={18} aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">How it works</h2>
              <div className="mt-4 space-y-4">
                {itinerary.map((item) => (
                  <div key={item.title} className="border-l-2 border-aurora/40 pl-4">
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <ProductFaq items={faqs} schemaId="snowshoe-faq" tone="dark" />
          </div>

          <aside className="lg:col-span-5" id="book">
            <div className="lg:sticky lg:top-24">
              <div className="rn-panel overflow-hidden shadow-rn">
                <div className="border-b border-black/10 px-5 py-5">
                  <p className="text-xs uppercase tracking-wide text-panel-muted">From</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-panel-ink">
                    €{price}
                    <span className="ml-1 text-base font-sans font-normal text-panel-muted">/ person</span>
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-panel-muted">
                    <li>✓ Delivery to your lodging</li>
                    <li>✓ Secure Stripe payment</li>
                    <li>✓ Safety briefing included</li>
                    <li>✓ Explore at your own pace</li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5">
                  {loading ? (
                    <p className="py-10 text-center text-panel-muted">Loading availability…</p>
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
                    />
                  )}
                </div>
              </div>
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
