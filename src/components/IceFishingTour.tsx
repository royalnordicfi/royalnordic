import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Users, XCircle } from 'lucide-react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import { getAllTours } from '../lib/api'

const GALLERY = [
  { src: '/icefishing.jpeg', alt: 'Ice fishing on a frozen Lapland lake' },
  { src: '/icefishing2.jpg', alt: 'Traditional ice fishing with a local guide' },
  { src: '/icefishing3.jpg', alt: 'Winter ice fishing experience near Rovaniemi' },
]

const IceFishingTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 119,
    child_price: 99,
    max_capacity: 8,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours()
        const iceFishingTour = tours.find((tour) => tour.id === 4)
        if (iceFishingTour) {
          setTourData({
            adult_price: iceFishingTour.adult_price,
            child_price: iceFishingTour.child_price,
            max_capacity: iceFishingTour.max_capacity || 8,
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

  const price = loading ? 119 : tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const features = [
    'Hotel pick-up and drop-off',
    'Professional local guide',
    'Fishing equipment',
    'Hot drinks and snacks by the fire',
    'Information about local culture of Lapland',
    'Information about local culture of Lapland',
    'Small group experience (max 8 people)',
    'Multiple fishing spots',
  ]

  const knowBefore = [
    'Dress warmly for Arctic conditions: thermal layers, waterproof outerwear, warm boots, gloves, and a hat.',
    'Free cancellation up to 24 hours before departure.',
    'Pickup time and fishing location depend on ice and weather conditions that day.',
  ]

  const faqs = [
    {
      question: 'What is included?',
      answer:
        'Hotel pick-up and drop-off, a professional local guide, fishing equipment, hot drinks and snacks by the fire, and information about local Lapland culture.',
    },
    {
      question: 'How long is the ice fishing experience?',
      answer: 'About 3–4 hours, typically with pickup around 10:00 and return between 13:00 and 14:00 depending on distance.',
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
  ]

  const itinerary = [
    {
      time: '10:00',
      title: 'Pick up from hotel',
      text: "We'll collect you from your accommodation in Rovaniemi",
    },
    {
      title: 'Drive to fishing location',
      text: 'Head to our secret ice fishing spots on frozen lakes',
    },
    {
      title: 'Safety briefing and setup',
      text: 'Learn proper ice fishing techniques and safety procedures',
    },
    {
      title: 'Ice fishing experience',
      text: 'Enjoy traditional ice fishing with professional equipment',
    },
    {
      time: '13:00 – 14:00',
      title: 'Return to accommodation',
      text: 'Drop off between 13:00 and 14:00 depending on distance traveled',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-4 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/daytime-experiences" className="hover:text-white">Daytime experiences</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Ice Fishing Experience</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Winter day trip</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Ice Fishing Experience
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Experience traditional Lapland ice fishing on pristine frozen lakes with expert guidance, equipment,
            and hot drinks by the fire.
          </p>
        </div>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: '3–4 hours' },
                { icon: Users, label: 'Group', value: 'Max 8' },
                { icon: MapPin, label: 'Location', value: 'Rovaniemi' },
                { icon: CheckCircle, label: 'Languages', value: 'EN & FI' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-rn border border-white/10 bg-surface p-3.5">
                  <Icon size={16} className="text-aurora" aria-hidden />
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-text-dim">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">About this experience</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Experience the traditional art of ice fishing in the pristine wilderness of Finnish Lapland. Our
                expert guides take you to the best fishing spots on frozen lakes, where you learn techniques used
                by locals for generations.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                This authentic Lapland experience combines adventure with cultural immersion — a true taste of
                Arctic life while enjoying the peaceful beauty of frozen landscapes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Itinerary</h2>
              <div className="mt-4 space-y-4">
                {itinerary.map((item) => (
                  <div key={item.title} className="border-l-2 border-aurora/40 pl-4">
                    {item.time && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-aurora-soft">{item.time}</p>
                    )}
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">What&apos;s included</h2>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {features.map((h) => (
                    <li key={h} className="flex gap-2">
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-aurora" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-white">Not included</h2>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  <li className="flex gap-2">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
                    Warm winter clothing (bring layered outdoor clothing)
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Good to know</h2>
              <ul className="mt-3 space-y-2 text-sm text-text-muted">
                {knowBefore.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <ProductFaq items={faqs} schemaId="ice-faq" tone="dark" />
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
                    <li>✓ Free cancellation up to 24h before</li>
                    <li>✓ Secure Stripe payment</li>
                    <li>✓ Hotel pickup in Rovaniemi</li>
                    <li>✓ Equipment &amp; guide included</li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5">
                  {loading ? (
                    <p className="py-10 text-center text-panel-muted">Loading availability…</p>
                  ) : (
                    <BookingForm
                      tourId={4}
                      tourName="Ice Fishing Experience"
                      adultPrice={tourData.adult_price}
                      childPrice={tourData.child_price}
                      maxCapacity={tourData.max_capacity}
                      seasonStart="12-15"
                      seasonEnd="03-15"
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

export default IceFishingTour
