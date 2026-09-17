import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import TourCard from './TourCard'
import ReviewCarousel from './ReviewCarousel'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import { getAllTours } from '../lib/api'
import { reviewsFor } from '../data/reviews'
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

const INCLUDED = [
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

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-shell-pad pb-14 pt-6 sm:pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Northern Lights', to: '/northern-lights-tours' },
            { label: 'Guaranteed Northern Lights Tour' },
          ]}
        />

        <header className="mt-5 max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Aurora season</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.6rem]">
            Guaranteed Northern Lights Tour
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            We drive where the skies are clearest. Small groups, hotel pickup and professional photos.
            If you don’t see the Northern Lights, you can join us again for free according to our
            guarantee terms.
          </p>
        </header>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: '2–12 h (~6h)' },
                { label: 'Group', value: 'Max 8 / vehicle' },
                { label: 'Pickup', value: 'Rovaniemi' },
                { label: 'Guarantee', value: 'Return trip' },
              ]}
            />

            <section className="rn-reveal">
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Hunt the Aurora Borealis from Rovaniemi with local guides who read live solar and weather
                data, then drive as far as needed for clearer skies — including across borders when
                conditions call for it. Hotel pickup, a warm vehicle, hot drinks, and photography guidance
                are included.
              </p>
            </section>

            <section className="rn-reveal">
              <h2 className="font-display text-2xl font-semibold text-white">Itinerary</h2>
              <div className="mt-5">
                <ExperienceItinerary steps={itinerary} />
              </div>
            </section>

            <section className="rn-reveal">
              <ExperienceInclusions
                included={INCLUDED}
                notIncluded={['Clothing and personal equipment (bring warm Arctic layers)']}
              />
            </section>

            <section className="rn-reveal">
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
              <div className="mt-4">
                <ExperienceAccordion
                  items={[
                    {
                      title: 'What to bring',
                      content:
                        'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves. Tell us about snack allergies when you book.',
                    },
                    {
                      title: 'Good to know',
                      content: (
                        <ul className="space-y-2">
                          <li>Auroras often look more colourful in photos than with the naked eye.</li>
                          <li>Extreme weather or unsafe roads may lead to reschedule or refund.</li>
                          <li>Free cancellation up to 24 hours before departure.</li>
                        </ul>
                      ),
                    },
                    {
                      title: 'Guarantee & cancellation',
                      content: (
                        <p>
                          If no Northern Lights are visible during your tour, we offer a free return trip on the
                          next available date. See our{' '}
                          <Link
                            to="/terms-conditions"
                            className="font-semibold text-aurora-soft underline-offset-2 hover:underline"
                          >
                            Terms &amp; Conditions
                          </Link>{' '}
                          for the full promise.
                        </p>
                      ),
                    },
                  ]}
                />
              </div>
            </section>

            <ProductFaq items={[...guaranteedNlFaqs]} schemaId="nl-faq" tone="dark" />

            <section className="rn-reveal">
              <h2 className="font-display text-2xl font-semibold text-white">Related experiences</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TourCard
                  to="/family-friendly-northern-lights"
                  image="/family1.jpg"
                  imageAlt="Family Northern Lights tour"
                  title="Family-Friendly Northern Lights"
                  description="Shorter evening format for families."
                  duration="2 hours"
                  pickup
                  priceFrom={79}
                  badge="Family"
                />
                <TourCard
                  to="/customized-tour"
                  image="/nortti5.jpg"
                  imageAlt="Custom Lapland experience"
                  title="Private & Custom Tour"
                  description="Tailored itineraries for private groups."
                  ctaLabel="Request quote"
                />
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5" id="book">
            <div className="rn-sticky-book">
              <BookingAside
                priceFrom={price}
                trustLines={[
                  'Free cancellation up to 24h before',
                  'Secure Stripe payment',
                  'Hotel pickup in Rovaniemi',
                  'Northern Lights guarantee (see Terms)',
                ]}
              >
                <p className="mb-4 rounded-md border border-aurora/20 bg-aurora/10 px-3 py-2 text-xs text-text-muted">
                  Optional: enter <span className="font-semibold text-aurora-soft">WINTER20</span> at
                  checkout for 20% off eligible direct bookings.
                </p>
                {loading ? (
                  <p className="py-10 text-center text-text-muted">Loading availability…</p>
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
                    tone="dark"
                  />
                )}
              </BookingAside>
              <p className="mt-3 text-center text-sm text-text-muted">
                <Link to="/northern-lights-tours" className="font-medium text-aurora-soft hover:underline">
                  Compare Northern Lights tours
                </Link>
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ReviewCarousel
        reviews={reviewsFor('northern-lights', 7)}
        eyebrow="From real guests"
        title="Guests on this experience"
        className="border-t border-white/[0.06]"
      />

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default NorthernLightsTour
