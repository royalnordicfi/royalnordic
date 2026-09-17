import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import BookingForm from './BookingForm'
import BookingAside from './experience/BookingAside'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceGallery from './ExperienceGallery'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceItinerary from './experience/ExperienceItinerary'
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
      <div className="rn-container rn-shell-pad pb-14 pt-6 sm:pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Northern Lights', to: '/northern-lights-tours' },
            { label: 'Family-Friendly Northern Lights' },
          ]}
        />

        <header className="mt-5 max-w-3xl">
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
        </header>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: '2 hours' },
                { label: 'Group', value: 'Max 16' },
                { label: 'Location', value: 'Rovaniemi' },
                { label: 'Languages', value: 'EN & FI' },
              ]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
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
              <div className="mt-4">
                <ExperienceItinerary steps={itinerary} />
              </div>
            </section>

            <ExperienceInclusions
              included={INCLUDED}
              notIncluded={['Warm winter clothing (bring layered outdoor clothing)']}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
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
          </div>

          <aside id="book" className="lg:col-span-5">
            <div className="rn-sticky-book">
              <BookingAside
                priceFrom={price}
                trustLines={[
                  'Free cancellation up to 24h before',
                  'Secure Stripe payment',
                  'Hotel pickup in Rovaniemi',
                  'Shorter format for families — aurora not guaranteed',
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
                  tone="dark"
                />
              </BookingAside>
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
