import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

const HIGHLIGHTS = [
  'About 2 hours — shorter evening format for families',
  'Hotel pickup and viewing stops away from city lights',
  'Hot drinks, snacks, and stories about the aurora and Lapland',
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
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Northern Lights', to: '/northern-lights-tours' },
          { label: 'Family-Friendly Northern Lights' },
        ]}
        eyebrow="Rovaniemi · Family aurora"
        title="Family-Friendly Northern Lights Tour"
        lede="Two-hour aurora evening from Rovaniemi — pickup, warm drinks, guide for all ages. Aurora not guaranteed."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '2 hours' },
          { label: 'Group', value: 'Max 16' },
          { label: 'Pickup', value: 'Rovaniemi' },
          { label: 'Languages', value: 'English · Finnish' },
        ]}
        booking={
          <>
            <BookingAside
              priceFrom={price}
              offerLine="WINTER20 · Save 20% at checkout"
              trustLines={[
                'Free cancellation 24h before',
                'Secure Stripe payment',
                'Hotel pickup',
                'Family format · aurora not guaranteed',
              ]}
            >
              <BookingForm
                tourId={8}
                tourName="Family-Friendly Northern Lights Tour"
                adultPrice={tourData.adult_price}
                childPrice={tourData.child_price}
                maxCapacity={tourData.max_capacity}
                seasonStart="09-15"
                seasonEnd="04-15"
                chrome="embedded"
                tone="light"
              />
            </BookingAside>
            <p className="mt-3 text-center text-sm text-text-muted">
              <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
                Want a guaranteed aurora hunt?
              </Link>
            </p>
          </>
        }
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Hotel pickup in Rovaniemi, then darker viewing spots chosen for the evening’s weather and aurora
            activity. Your guide shares stories about the Northern Lights and Lapland while you stay warm with hot
            drinks and snacks.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            A shorter format designed for families and all ages. For our return-trip guarantee, see the{' '}
            <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
              Guaranteed Northern Lights Tour
            </Link>
            .
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
                  title: 'Aurora expectations',
                  content: (
                    <>
                      Northern Lights are a natural phenomenon and cannot be guaranteed on this tour. For a
                      guaranteed product, see our{' '}
                      <Link to="/northern-lights-tour" className="font-medium text-aurora-soft hover:underline">
                        Guaranteed Northern Lights Tour
                      </Link>
                      .
                    </>
                  ),
                },
                {
                  title: 'Families & clothing',
                  content:
                    'Designed for all ages — a shorter, comfortable evening for families. Dress warmly; we have a warm vehicle, but viewing stops are outdoors.',
                },
                {
                  title: 'Cancellation',
                  content: 'Free cancellation up to 24 hours before departure.',
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="family-nl-faq" tone="dark" />
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default FamilyFriendlyNorthernLights
