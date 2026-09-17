import { useEffect, useState } from 'react'
import BookingForm from './BookingForm'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceHighlights from './experience/ExperienceHighlights'
import BookingAside from './experience/BookingAside'
import { getAllTours } from '../lib/api'

const GALLERY = [
  { src: '/icefishing.jpeg', alt: 'Ice fishing on a frozen Lapland lake', position: 'center' },
  { src: '/icefishing2.jpg', alt: 'Traditional ice fishing with a local guide', position: 'center' },
  { src: '/icefishing3.jpg', alt: 'Winter ice fishing experience near Rovaniemi', position: 'center 40%' },
]

const INCLUDED = [
  'Hotel pick-up and drop-off',
  'Professional local guide',
  'Fishing equipment',
  'Hot drinks and snacks by the fire',
  'Local Lapland culture insights',
  'Small group — max 8 guests',
  'Multiple fishing spots',
]

const HIGHLIGHTS = [
  'Frozen lakes away from the city, chosen for ice and conditions that day',
  'Equipment and technique guidance included — no prior experience needed',
  'Warm drinks by the fire between fishing spots',
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

  const faqs = [
    {
      question: 'What is included?',
      answer:
        'Hotel pick-up and drop-off, a professional local guide, fishing equipment, hot drinks and snacks by the fire, and information about local Lapland culture.',
    },
    {
      question: 'How long is the ice fishing experience?',
      answer:
        'About 3–4 hours, typically with pickup around 10:00 and return between 13:00 and 14:00 depending on distance.',
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
      title: 'Pickup in Rovaniemi',
      text: 'We collect you from your accommodation.',
    },
    {
      title: 'Drive to the lake',
      text: 'Head to fishing spots chosen for ice and weather that day.',
    },
    {
      title: 'Briefing & setup',
      text: 'Learn safe ice fishing technique with all equipment provided.',
    },
    {
      title: 'On the ice',
      text: 'Fish with your guide — hot drinks by the fire between spots.',
    },
    {
      time: '13:00 – 14:00',
      title: 'Return',
      text: 'Drop-off at your lodging depending on distance traveled.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Ice Fishing Experience' },
        ]}
        eyebrow="Rovaniemi · Winter day trip"
        title="Ice Fishing Experience"
        lede="Traditional Lapland ice fishing on frozen lakes — guide, equipment, and hot drinks by the fire."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '3–4 hours' },
          { label: 'Group', value: 'Max 8' },
          { label: 'Pickup', value: 'Rovaniemi' },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <BookingAside
            priceFrom={price}
            trustLines={[
              'Free cancellation up to 24h before',
              'Secure Stripe payment',
              'Hotel pickup in Rovaniemi',
              'Equipment & guide included',
            ]}
          >
            {loading ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
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
                tone="light"
              />
            )}
          </BookingAside>
        }
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Join a local guide on frozen lakes near Rovaniemi. You learn traditional ice fishing
            technique, move between spots as conditions allow, and warm up with hot drinks by the fire.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Groups stay small — max 8 guests — so the day stays calm, practical, and personal.
          </p>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Highlights</h2>
          <div className="mt-5">
            <ExperienceHighlights items={HIGHLIGHTS} />
          </div>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Itinerary</h2>
          <div className="mt-5">
            <ExperienceItinerary steps={itinerary} />
          </div>
        </section>

        <section className="rn-reveal">
          <ExperienceInclusions
            included={INCLUDED}
            notIncluded={['Warm winter clothing (bring layered outdoor clothing)']}
          />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'What to bring',
                  content:
                    'Thermal layers, waterproof outerwear, warm boots, gloves, and a hat for frozen lake conditions.',
                },
                {
                  title: 'Good to know',
                  content: (
                    <ul className="space-y-2">
                      <li>Free cancellation up to 24 hours before departure.</li>
                      <li>Pickup time and fishing location depend on ice and weather that day.</li>
                    </ul>
                  ),
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="ice-faq" tone="dark" />
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default IceFishingTour
