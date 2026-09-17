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

const RANUA_MAX_CAPACITY = 16

const GALLERY = [
  { src: '/ranua1.jpg', alt: 'Ranua Wildlife Park in Finnish Lapland' },
  { src: '/ranua2.jpeg', alt: 'Arctic animals at Ranua Wildlife Park' },
  { src: '/ranua3.jpeg', alt: 'Polar bear habitat at Ranua' },
  { src: '/ranua4.jpeg', alt: 'Forest trails at Ranua Wildlife Park' },
  { src: '/ranua5.jpeg', alt: 'Northern species at Ranua zoo day trip' },
]

const HIGHLIGHTS = [
  'Day trip from Rovaniemi with transfers and park entrance included',
  'Polar bears, lynx, wolves, and 50+ Arctic species on forest trails',
  'Free time for photos — popular with families and animal lovers',
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

  const included = [
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
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Nordic Animals of Ranua Zoo' },
        ]}
        eyebrow="Ranua · Wildlife day trip"
        title="Nordic Animals of Ranua Zoo"
        lede="Rovaniemi day trip to Finland’s northernmost zoo — polar bears, 50+ species, transfers and entrance included."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '~5 hours' },
          { label: 'Group', value: `Max ${RANUA_MAX_CAPACITY}` },
          { label: 'Pickup', value: 'Rovaniemi' },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <BookingAside
            priceFrom={price}
            offerLine="WINTER20 · Save 20% at checkout"
            trustLines={[
              'Free cancellation 24h before',
              'Secure Stripe payment',
              'Hotel pickup',
              'Park entrance included',
            ]}
          >
            {loading ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={5}
                tourName="Nordic Animals of Ranua Zoo"
                adultPrice={tourData.adult_price}
                childPrice={tourData.child_price}
                maxCapacity={tourData.max_capacity}
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
            Guided day trip from Rovaniemi to Ranua Wildlife Park — over 50 Arctic and northern species,
            including polar bears, lynxes, wolves, moose, reindeer, and arctic foxes on forest trails.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Walk spacious habitats, enjoy free time for photos, with transfers and entrance tickets included.
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
          <ExperienceInclusions included={included} notIncluded={notIncluded} />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Accessibility & needs',
                  content: 'Please tell us in advance about any mobility or dietary requirements.',
                },
                {
                  title: 'What to bring',
                  content:
                    'Wear warm clothing and comfortable shoes suitable for walking. A camera or smartphone is recommended for photography.',
                },
                {
                  title: 'Meals',
                  content:
                    'Lunch and drinks are not included — cafés and restaurants are available at the park.',
                },
                {
                  title: 'Cancellation',
                  content: 'Free cancellation up to 24 hours before departure.',
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="ranua-faq" tone="dark" />
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default RanuaZooTour
