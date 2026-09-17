import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Users, XCircle } from 'lucide-react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import { getAllTours } from '../lib/api'

const KORUOMA_MAX_CAPACITY = 16

const GALLERY = [
  { src: '/korouoma1.jpg', alt: 'Frozen waterfall and snowy cliffs at Korouoma Canyon' },
  { src: '/korouoma2.jpg', alt: 'Winter hiking trail through Korouoma Canyon Nature Reserve' },
]

const HIGHLIGHTS = [
  'Explore Korouoma Canyon’s frozen waterfalls and snowy trails',
  'Cozy campfire picnic with grilled snacks and hot drinks',
  'Small-group guided hike from Rovaniemi with transport included',
  'Photo stops among frozen cliffs and icy landscapes',
  'Warm minivan or minibus for the journey',
]

const KorouomaTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 129,
    child_price: 109,
    max_capacity: KORUOMA_MAX_CAPACITY,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours()
        const korouomaTour = tours.find((tour) => tour.id === 6)
        if (korouomaTour) {
          setTourData({
            adult_price: korouomaTour.adult_price || 129,
            child_price: korouomaTour.child_price || 109,
            max_capacity: KORUOMA_MAX_CAPACITY,
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

  const price = loading ? 129 : tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const features = [
    'Hotel pickup and drop-off from Rovaniemi',
    'Professional guide (English & Finnish)',
    'Campfire picnic with grilled snacks and hot drinks',
    'Guided hike to Korouoma’s frozen waterfalls',
    'Photo stops at scenic viewpoints',
    'Warm, comfortable minivan or minibus',
    'Small group — max 8 people per vehicle',
    'Expert knowledge of Korouoma geology and nature',
  ]

  const itinerary = [
    {
      time: '~09:00',
      title: 'Pickup in Rovaniemi',
      text: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      time: '1.5 h',
      title: 'Drive to Korouoma',
      text: 'About 100 km by warm vehicle to Korouoma Canyon Nature Reserve.',
    },
    {
      time: '3 h',
      title: 'Guided canyon hike',
      text: 'Snowy trails, frozen waterfalls, photo stops, and a campfire picnic with grilled snacks and hot drinks.',
    },
    {
      time: '1.5 h',
      title: 'Return to Rovaniemi',
      text: 'Drive back and drop-off at your accommodation.',
    },
  ]

  const knowBefore = [
    'The tour is outdoors in winter conditions — dress in warm layers and sturdy footwear.',
    'Not suitable for wheelchair users.',
    'Free cancellation up to 24 hours before departure.',
    'Tell us about snack allergies when you book.',
  ]

  const faqs = [
    {
      question: 'How long is the Korouoma Canyon tour?',
      answer:
        'About 6 hours in total — roughly 1.5 hours each way from Rovaniemi and about 3 hours at the canyon for hiking, photos, and a campfire picnic.',
    },
    {
      question: 'What should I wear?',
      answer:
        'Warm layers, winter boots, gloves, and a hat. Clothing is not provided. The hike is outdoors in snowy canyon conditions.',
    },
    {
      question: 'Is the tour difficult?',
      answer:
        'It is a moderate outdoor hike on winter trails. It is not suitable for wheelchair users. A reasonable fitness level helps you enjoy the canyon walks.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Yes. Hotel pickup and drop-off from Rovaniemi are included, along with an English & Finnish guide and a warm vehicle.',
    },
    {
      question: 'Is this suitable for children?',
      answer:
        'Children are welcome with an adult if they can manage a moderate outdoor winter hike. Child pricing applies for ages 0–17.',
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
            <li className="text-white">Korouoma Canyon Winter Adventure</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow">Korouoma · Canyon hike</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Korouoma Canyon Winter Adventure
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Canyon hike among frozen waterfalls — small-group guided tour from Rovaniemi with transport and
            campfire picnic.
          </p>
        </div>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: '6 hours' },
                { icon: Users, label: 'Group', value: 'Max 8 / vehicle' },
                { icon: MapPin, label: 'Location', value: 'Korouoma' },
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
                Embark on a winter adventure through Korouoma Canyon — one of Lapland’s most stunning natural
                wonders. We drive about 100 km from Rovaniemi, then hike snow-covered trails among towering
                cliffs and frozen waterfalls.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Along the way, enjoy a cozy campfire break with grilled snacks and hot drinks. Transport,
                guiding, and the picnic are included; bring your own warm winter clothing.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Highlights</h2>
              <ul className="mt-4 space-y-2.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-text-muted">
                    <CheckCircle className="mt-0.5 shrink-0 text-aurora" size={18} aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
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
                    Warm winter clothing (bring layered Arctic clothing and sturdy footwear)
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
              <p className="mt-4 text-sm text-text-muted">
                Free cancellation up to 24 hours before departure. Book and pay securely online via Stripe.
              </p>
            </section>

            <ProductFaq items={faqs} schemaId="korouoma-faq" tone="dark" />
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
                    <li>✓ Campfire picnic included</li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5">
                  {loading ? (
                    <p className="py-10 text-center text-panel-muted">Loading availability…</p>
                  ) : (
                    <BookingForm
                      tourId={6}
                      tourName="Korouoma Canyon Winter Adventure"
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

export default KorouomaTour
