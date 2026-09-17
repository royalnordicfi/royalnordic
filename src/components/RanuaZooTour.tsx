import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Users, XCircle } from 'lucide-react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import { getAllTours } from '../lib/api'

const RANUA_MAX_CAPACITY = 16

const GALLERY = [
  { src: '/ranua1.jpg', alt: 'Ranua Wildlife Park in Finnish Lapland' },
  { src: '/ranua2.jpeg', alt: 'Arctic animals at Ranua Wildlife Park' },
  { src: '/ranua3.jpeg', alt: 'Polar bear habitat at Ranua' },
  { src: '/ranua4.jpeg', alt: 'Forest trails at Ranua Wildlife Park' },
  { src: '/ranua5.jpeg', alt: 'Northern species at Ranua zoo day trip' },
]

const RanuaZooTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 99,
    child_price: 79,
    max_capacity: RANUA_MAX_CAPACITY,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours()
        const ranuaZooTour = tours.find((tour) => tour.id === 5)
        if (ranuaZooTour) {
          setTourData({
            adult_price: ranuaZooTour.adult_price || 99,
            child_price: ranuaZooTour.child_price || 79,
            max_capacity: RANUA_MAX_CAPACITY,
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

  const price = loading ? 99 : tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const features = [
    'Hotel pickup and drop-off from Rovaniemi',
    'Professional guide (English & Finnish)',
    'Comfortable transportation to Ranua',
    'Entrance tickets to Ranua Wildlife Park',
    'Meet polar bears and 50+ Arctic species',
    'Guidance and tips about Arctic wildlife',
    'Free time to explore and take photos',
    `Small group experience (max ${RANUA_MAX_CAPACITY} people)`,
  ]

  const itinerary = [
    {
      time: '~09:30',
      title: 'Pickup in Rovaniemi',
      text: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      time: '1 h',
      title: 'Drive to Ranua',
      text: 'Scenic drive through Lapland wilderness to Ranua Wildlife Park.',
    },
    {
      time: '~3.5 h',
      title: 'Ranua Wildlife Park',
      text: 'Explore forest trails and habitats — polar bears, lynx, wolves, moose, reindeer, arctic foxes, and more. Free time for photos at your own pace.',
    },
    {
      time: '1 h',
      title: 'Return to Rovaniemi',
      text: 'Drive back and drop-off at your accommodation.',
    },
  ]

  const knowBefore = [
    'Please tell us in advance about any mobility or dietary requirements.',
    'Wear warm clothing and comfortable shoes suitable for walking.',
    'A camera or smartphone is recommended for photography.',
    'Lunch and drinks are not included — cafés and restaurants are available at the park.',
    'Free cancellation up to 24 hours before departure.',
  ]

  const faqs = [
    {
      question: 'What is included in the Ranua tour?',
      answer:
        'Hotel pickup and drop-off from Rovaniemi, entrance tickets to Ranua Wildlife Park, and an English & Finnish guide. Meals and personal expenses are not included.',
    },
    {
      question: 'How long is the day trip?',
      answer:
        'About 5 hours overall, including transfers and time to explore polar bears and 50+ Arctic species at the park.',
    },
    {
      question: 'Is it good for families?',
      answer:
        'Yes. The tour is a popular family daytime experience. Child pricing applies for ages 0–17, and the park has walking paths suitable for a relaxed visit.',
    },
    {
      question: 'What should we wear?',
      answer:
        'Warm clothing and comfortable shoes for outdoor walking. Winter clothing rental is not included.',
    },
  ]

  const notIncluded = [
    'Meals and drinks (optional lunch available at the park)',
    'Personal expenses and souvenirs',
    'Winter clothing or boot rental',
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
            <li className="text-white">Nordic Animals of Ranua Zoo</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow">Ranua · Wildlife day trip</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Nordic Animals of Ranua Zoo
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Day trip from Rovaniemi to Finland’s northernmost zoo — polar bears and 50+ Arctic species, with
            transfers and entrance included.
          </p>
        </div>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: '~5 hours' },
                { icon: Users, label: 'Group', value: `Max ${RANUA_MAX_CAPACITY}` },
                { icon: MapPin, label: 'Location', value: 'Ranua' },
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
              <h2 className="font-display text-2xl font-semibold text-white">About this tour</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Depart Rovaniemi for a guided day trip through Lappish landscapes to Ranua Wildlife Park — home
                to over 50 Arctic and northern species, including polar bears, lynxes, wolves, moose, reindeer,
                and arctic foxes.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Walk peaceful forest trails, see animals in spacious habitats, and enjoy free time for photos.
                Transfers and entrance tickets are included. Perfect for families, animal lovers, and
                photographers.
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
                  {notIncluded.map((item) => (
                    <li key={item} className="flex gap-2">
                      <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
                      {item}
                    </li>
                  ))}
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

            <ProductFaq items={faqs} schemaId="ranua-faq" tone="dark" />
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
                    <li>✓ Park entrance included</li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5">
                  {loading ? (
                    <p className="py-10 text-center text-panel-muted">Loading availability…</p>
                  ) : (
                    <BookingForm
                      tourId={5}
                      tourName="Nordic Animals of Ranua Zoo"
                      adultPrice={tourData.adult_price}
                      childPrice={tourData.child_price}
                      maxCapacity={tourData.max_capacity}
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

export default RanuaZooTour
