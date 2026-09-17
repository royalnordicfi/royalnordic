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

const KORUOMA_MAX_CAPACITY = 16

const GALLERY = [
  { src: '/korouoma1.jpg', alt: 'Frozen waterfall and snowy cliffs at Korouoma Canyon' },
  { src: '/korouoma2.jpg', alt: 'Winter hiking trail through Korouoma Canyon Nature Reserve' },
]

const HIGHLIGHTS = [
  'Winter hike among frozen waterfalls and canyon cliffs',
  'Campfire picnic with grilled snacks and hot drinks',
  'Small groups — max 8 per vehicle from Rovaniemi',
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

  const included = [
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
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Korouoma Canyon Winter Adventure' },
        ]}
        eyebrow="Korouoma · Canyon hike"
        title="Korouoma Canyon Winter Adventure"
        lede="Guided winter hike to frozen waterfalls — transport from Rovaniemi and campfire picnic included."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '6 hours' },
          { label: 'Group', value: 'Max 8 / vehicle' },
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
              'Campfire picnic included',
            ]}
          >
            {loading ? (
              <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={6}
                tourName="Korouoma Canyon Winter Adventure"
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
            Winter hike through Korouoma Canyon — about 100 km from Rovaniemi, then snow-covered trails among
            towering cliffs and frozen waterfalls.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Campfire break with grilled snacks and hot drinks. Transport, guiding, and picnic included; bring
            your own warm winter clothing.
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
            included={included}
            notIncluded={['Warm winter clothing (bring layered Arctic clothing and sturdy footwear)']}
          />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Outdoor conditions',
                  content:
                    'The tour is outdoors in winter conditions — dress in warm layers and sturdy footwear.',
                },
                {
                  title: 'Accessibility',
                  content: 'Not suitable for wheelchair users.',
                },
                {
                  title: 'Allergies & cancellation',
                  content:
                    'Tell us about snack allergies when you book. Free cancellation up to 24 hours before departure. Book and pay securely online via Stripe.',
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="korouoma-faq" tone="dark" />
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default KorouomaTour
