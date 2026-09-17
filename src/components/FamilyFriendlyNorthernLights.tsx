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
  { src: '/family1.jpg', alt: 'Family watching the Northern Lights in Lapland' },
  { src: '/family2.jpg', alt: 'Family aurora evening near Rovaniemi' },
  { src: '/family3.jpg', alt: 'Parents and children on a Northern Lights tour' },
  { src: '/family4.jpg', alt: 'Winter night family experience in Finnish Lapland' },
]

const INCLUDED = [
  'Hotel pickup and drop-off',
  'Professional local guide (English & Finnish)',
  'Hot drinks and snacks',
  'Aurora photography tips',
  'Warm vehicle for the journey',
]

const FamilyFriendlyNorthernLights = () => {
  const [tourData, setTourData] = useState({
    adult_price: 79,
    child_price: 59,
    max_capacity: 16,
  })

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours()
        const familyTour = tours.find((tour) => tour.id === 8)
        if (familyTour) {
          setTourData({
            adult_price: Number(familyTour.adult_price) || 79,
            child_price: Number(familyTour.child_price) || 59,
            max_capacity: familyTour.max_capacity || 16,
          })
        }
      } catch (error) {
        console.error('Error loading tour data:', error)
      }
    }
    loadTourData()
  }, [])

  const price = tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const knowBefore: Array<string | { text: string; link?: { to: string; label: string } }> = [
    {
      text: 'Northern Lights are a natural phenomenon and cannot be guaranteed on this tour. For a guaranteed product, see our ',
      link: { to: '/northern-lights-tour', label: 'Guaranteed Northern Lights Tour' },
    },
    'Designed for all ages — a shorter, comfortable evening for families.',
    'Dress warmly; we have a warm vehicle, but viewing stops are outdoors.',
    'Free cancellation up to 24 hours before departure.',
  ]

  const faqs = [
    {
      question: 'Are the Northern Lights guaranteed on this tour?',
      answer:
        'No. This is a shorter family-friendly evening and aurora sightings are never 100% guaranteed. If you want our guaranteed product, book the Guaranteed Northern Lights Tour.',
    },
    {
      question: 'What time does the tour start?',
      answer:
        'Hotel pickup is typically around 21:00 in the Rovaniemi area. Exact pickup time is confirmed after booking.',
    },
    {
      question: 'Is it suitable for children?',
      answer:
        'Yes — the format is designed for families and all ages. Child pricing applies for ages 0–17. Bring warm outdoor layers for viewing stops.',
    },
    {
      question: 'How long is the tour?',
      answer: 'About 2 hours including pickup, viewing stops with hot drinks, and return to Rovaniemi.',
    },
  ]

  const itinerary = [
    {
      time: '~21:00',
      title: 'Pickup',
      text: 'Hotel pickup in the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      title: 'Guided aurora evening',
      text: 'Drive to darker viewing spots, enjoy hot drinks and snacks, and listen to stories about the lights and Lapland while we watch the sky (~2 h).',
    },
    {
      title: 'Return to Rovaniemi',
      text: 'Drop-off at your accommodation.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-4 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/northern-lights-tours" className="hover:text-white">Northern Lights</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Family-Friendly Northern Lights</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Family aurora</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Family-Friendly Northern Lights Tour
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            A shorter 2-hour aurora evening from Rovaniemi — hotel pickup, warm drinks, and a guide for the
            whole family. Aurora sightings are never guaranteed; for our guaranteed hunt, see the{' '}
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Guaranteed Northern Lights Tour
            </Link>
            .
          </p>
        </div>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: '2 hours' },
                { icon: Users, label: 'Group', value: 'Max 16' },
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
              <h2 className="font-display text-2xl font-semibold text-white">About this tour</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Begin with hotel pickup in Rovaniemi, then head away from city lights to viewing spots chosen
                for the evening’s weather and aurora activity.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Your guide shares stories about the Northern Lights and Lapland while you stay warm with hot
                drinks and snacks. A shorter, comfortable format designed for families and all ages.
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
                  {INCLUDED.map((h) => (
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
                {knowBefore.map((item, index) => (
                  <li key={index}>
                    •{' '}
                    {typeof item === 'string' ? (
                      item
                    ) : (
                      <>
                        {item.text}
                        {item.link && (
                          <Link to={item.link.to} className="font-medium text-aurora-soft hover:underline">
                            {item.link.label}
                          </Link>
                        )}
                        .
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <ProductFaq items={faqs} schemaId="family-nl-faq" tone="dark" />
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
                    <li>✓ Shorter format for families — aurora not guaranteed</li>
                  </ul>
                </div>
                <div className="p-4 sm:p-5">
                  <BookingForm
                    tourId={8}
                    tourName="Family-Friendly Northern Lights Tour"
                    adultPrice={tourData.adult_price}
                    childPrice={tourData.child_price}
                    maxCapacity={tourData.max_capacity}
                    seasonStart="09-15"
                    seasonEnd="04-15"
                    chrome="embedded"
                  />
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-text-muted">
                <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
                  Want a guaranteed aurora hunt?
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default FamilyFriendlyNorthernLights
