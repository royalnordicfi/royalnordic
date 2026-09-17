import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, ShieldCheck, Users, XCircle } from 'lucide-react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import TourCard from './TourCard'
import { getAllTours } from '../lib/api'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_MAX_PER_VEHICLE,
  GUARANTEED_NL_SEASON_END,
  GUARANTEED_NL_SEASON_START,
  guaranteedNlFaqs,
} from '../seo/guaranteedNorthernLightsTour'

const GALLERY = [
  { src: '/nortti1.jpg', alt: 'Guests watching the Northern Lights on a Royal Nordic tour' },
  { src: '/nortti3.jpg', alt: 'Aurora display over Finnish Lapland wilderness' },
  { src: '/nortti5.jpg', alt: 'Green aurora ribbons above snowy forest near Rovaniemi' },
  { src: '/lights7.jpg', alt: 'Northern Lights over snowy Lapland forest' },
  { src: '/lights8.jpg', alt: 'Aurora Borealis reflecting above Arctic landscape' },
  { src: '/nortti9.jpg', alt: 'Clear winter night during an aurora hunt' },
]

const HIGHLIGHTS = [
  'Northern Lights guarantee — free return trip if no lights appear (see Terms)',
  'Small group — max 8 people per vehicle',
  'Hotel pickup and drop-off in the Rovaniemi area',
  'Flexible duration based on live aurora forecasts',
  'English & Finnish speaking local guides',
  'Warm drinks, snacks, and photography guidance',
]

const NorthernLightsTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: GUARANTEED_NL_CATALOG_ADULT_PRICE,
    child_price: 129,
    max_capacity: GUARANTEED_NL_MAX_PER_VEHICLE,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const tours = await getAllTours()
        const tour = tours.find((t) => t.id === 1)
        if (tour) {
          setTourData({
            adult_price: Number(tour.adult_price) || GUARANTEED_NL_CATALOG_ADULT_PRICE,
            child_price: Number(tour.child_price) || 129,
            max_capacity: tour.max_capacity || GUARANTEED_NL_MAX_PER_VEHICLE,
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const price = loading ? GUARANTEED_NL_CATALOG_ADULT_PRICE : tourData.adult_price

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itinerary = [
    {
      time: '18:30',
      title: 'Pickup',
      text: 'Standard pickup from 18:30. Exact time confirmed after booking — be ready 10–30 minutes before.',
    },
    {
      title: 'Aurora hunt',
      text: 'We drive to the best viewing spots for that night based on live forecasts — farther when skies are clearer.',
    },
    {
      title: 'Photo stops',
      text: 'Warm drinks, snacks, and time outdoors under the Arctic night at each location.',
    },
    {
      time: 'Return',
      title: 'Drop-off',
      text: 'Return depends on distance traveled — usually between midnight and early morning.',
    },
  ]

  const knowBefore = [
    'Auroras often look more colourful in photos than with the naked eye.',
    'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, gloves.',
    'Tell us about snack allergies when you book.',
    'Extreme weather or unsafe roads may lead to reschedule or refund.',
    'Free cancellation up to 24 hours before departure.',
  ]

  return (
    <div className="min-h-screen bg-snow text-ink pb-24 lg:pb-0">
      <div className="rn-container rn-page-pad-top pb-10 pt-6 sm:pt-8">
        <nav className="mb-5 text-sm text-ink-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/northern-lights-tours" className="hover:text-ink">Northern Lights</Link></li>
            <li aria-hidden>/</li>
            <li className="text-ink">Guaranteed Northern Lights Tour</li>
          </ol>
        </nav>

        <div className="max-w-3xl">
          <p className="rn-eyebrow !text-aurora-deep">Rovaniemi · Aurora season</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Guaranteed Northern Lights Tour
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Small-group aurora hunt from Rovaniemi with hotel pickup, flexible duration, and a Northern
            Lights guarantee — free return trip if no lights appear (see Terms).
          </p>
        </div>

        <div className="mt-8">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 space-y-10">
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Clock, label: 'Duration', value: '2–12 h (~6h)' },
                { icon: Users, label: 'Group', value: 'Max 8 / vehicle' },
                { icon: MapPin, label: 'Location', value: 'Rovaniemi' },
                { icon: ShieldCheck, label: 'Guarantee', value: 'Return trip' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-rn border border-black/8 bg-white p-3.5 shadow-rn-soft">
                  <Icon size={16} className="text-aurora-deep" aria-hidden />
                  <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink-muted">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Why this experience</h2>
              <p className="mt-3 text-ink-muted leading-relaxed">
                Hunt the Aurora Borealis from Rovaniemi with local guides who read live solar and weather
                data, then drive as far as needed for clearer skies — including across borders when
                conditions call for it. Hotel pickup, a warm vehicle, hot drinks, and photography guidance
                are included.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Highlights</h2>
              <ul className="mt-4 space-y-2.5">
                {HIGHLIGHTS.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-ink-muted">
                    <CheckCircle className="mt-0.5 shrink-0 text-aurora" size={18} aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Itinerary</h2>
              <div className="mt-4 space-y-4">
                {itinerary.map((item) => (
                  <div key={item.title} className="border-l-2 border-aurora/40 pl-4">
                    {item.time && <p className="text-xs font-semibold uppercase tracking-wide text-aurora-deep">{item.time}</p>}
                    <h3 className="font-semibold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-muted">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">What&apos;s included</h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  {HIGHLIGHTS.map((h) => (
                    <li key={h} className="flex gap-2">
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-aurora" aria-hidden />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Not included</h2>
                <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                  <li className="flex gap-2">
                    <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" aria-hidden />
                    Clothing and personal equipment (bring warm Arctic layers)
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Pickup</h2>
              <p className="mt-3 text-ink-muted leading-relaxed">
                Hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after
                booking — please be ready 10–30 minutes before the standard 18:30 window.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Good to know</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                {knowBefore.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-rn-lg border border-aurora/25 bg-aurora/5 p-5">
              <h2 className="font-display text-2xl font-semibold text-ink">Guarantee &amp; cancellation</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                If no Northern Lights are visible during your tour, we offer a free return trip on the
                next available date. See our{' '}
                <Link to="/terms-conditions" className="font-semibold text-aurora-deep underline-offset-2 hover:underline">
                  Terms &amp; Conditions
                </Link>{' '}
                for the full promise. Free cancellation up to 24 hours before departure.
              </p>
            </section>

            <ProductFaq items={[...guaranteedNlFaqs]} schemaId="nl-faq" tone="snow" />

            <section>
              <h2 className="font-display text-2xl font-semibold text-ink">Related experiences</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TourCard
                  to="/family-friendly-northern-lights"
                  image="/family1.jpg"
                  imageAlt="Family Northern Lights tour"
                  title="Family-Friendly Northern Lights"
                  duration="2 hours"
                  pickup
                  priceFrom={79}
                  badge="Family"
                />
                <TourCard
                  to="/customized-tour"
                  image="/slideshow1.jpg"
                  imageAlt="Custom Lapland experience"
                  title="Private & Custom Tour"
                  location="Rovaniemi, Lapland"
                  ctaLabel="Request quote"
                />
              </div>
            </section>
          </div>

          {/* Sticky commerce booking */}
          <aside className="lg:col-span-5" id="book">
            <div className="lg:sticky lg:top-28">
              <div className="overflow-hidden rounded-rn-lg border border-black/8 bg-white shadow-rn">
                <div className="border-b border-black/5 px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-ink-muted">From</p>
                  <p className="mt-1 font-display text-3xl font-semibold text-ink">
                    €{price}
                    <span className="ml-1 text-base font-sans font-normal text-ink-muted">/ person</span>
                  </p>
                  <ul className="mt-3 space-y-1.5 text-xs text-ink-muted">
                    <li>✓ Free cancellation up to 24h before</li>
                    <li>✓ Secure Stripe payment</li>
                    <li>✓ Hotel pickup in Rovaniemi</li>
                    <li>✓ Northern Lights guarantee (see Terms)</li>
                  </ul>
                  {WINTER20_HINT}
                </div>
                <div className="p-4 sm:p-5">
                  {loading ? (
                    <p className="py-10 text-center text-ink-muted">Loading availability…</p>
                  ) : (
                    <BookingForm
                      tourId={1}
                      tourName="Guaranteed Northern Lights Tour"
                      adultPrice={tourData.adult_price}
                      childPrice={tourData.child_price}
                      maxCapacity={tourData.max_capacity}
                      seasonStart={GUARANTEED_NL_SEASON_START}
                      seasonEnd={GUARANTEED_NL_SEASON_END}
                      chrome="embedded"
                    />
                  )}
                </div>
              </div>
              <p className="mt-3 text-center text-sm text-ink-muted">
                <Link to="/northern-lights-tours" className="font-medium text-aurora-deep hover:underline">
                  Compare Northern Lights tours
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

const WINTER20_HINT = (
  <p className="mt-3 rounded-rn bg-frost px-3 py-2 text-xs text-ink-muted">
    Optional: enter <span className="font-semibold text-ink">WINTER20</span> at checkout for 20% off
    eligible direct bookings.
  </p>
)

export default NorthernLightsTour
