import { useEffect, useState } from 'react'
import BookingForm from './BookingForm'
import ExperienceGallery from './ExperienceGallery'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import { getAllTours } from '../lib/api'

const GALLERY = [
  { src: '/icefishing.jpeg', alt: 'Ice fishing on a frozen Lapland lake' },
  { src: '/icefishing2.jpg', alt: 'Traditional ice fishing with a local guide' },
  { src: '/icefishing3.jpg', alt: 'Winter ice fishing experience near Rovaniemi' },
]

const INCLUDED = [
  'Hotel pick-up and drop-off',
  'Professional local guide',
  'Fishing equipment',
  'Hot drinks and snacks by the fire',
  'Information about local culture of Lapland',
  'Small group experience (max 8 people)',
  'Multiple fishing spots',
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
      answer: 'About 3–4 hours, typically with pickup around 10:00 and return between 13:00 and 14:00 depending on distance.',
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
      title: 'Pick up from hotel',
      text: "We'll collect you from your accommodation in Rovaniemi",
    },
    {
      title: 'Drive to fishing location',
      text: 'Head to our secret ice fishing spots on frozen lakes',
    },
    {
      title: 'Safety briefing and setup',
      text: 'Learn proper ice fishing techniques and safety procedures',
    },
    {
      title: 'Ice fishing experience',
      text: 'Enjoy traditional ice fishing with professional equipment',
    },
    {
      time: '13:00 – 14:00',
      title: 'Return to accommodation',
      text: 'Drop off between 13:00 and 14:00 depending on distance traveled',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-shell-pad pb-14 pt-6 sm:pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Daytime experiences', to: '/daytime-experiences' },
            { label: 'Ice Fishing Experience' },
          ]}
        />

        <header className="mt-5 max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Winter day trip</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.6rem]">
            Ice Fishing Experience
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Traditional Lapland ice fishing on frozen lakes with expert guidance, equipment, and hot
            drinks by the fire.
          </p>
        </header>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: '3–4 hours' },
                { label: 'Group', value: 'Max 8' },
                { label: 'Pickup', value: 'Rovaniemi' },
                { label: 'Languages', value: 'English · Finnish' },
              ]}
            />

            <section className="rn-reveal">
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Experience the traditional art of ice fishing in the pristine wilderness of Finnish Lapland. Our
                expert guides take you to the best fishing spots on frozen lakes, where you learn techniques used
                by locals for generations.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                This authentic Lapland experience combines adventure with cultural immersion — a true taste of
                Arctic life while enjoying the peaceful beauty of frozen landscapes.
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
                notIncluded={['Warm winter clothing (bring layered outdoor clothing)']}
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
                        'Dress warmly for Arctic conditions: thermal layers, waterproof outerwear, warm boots, gloves, and a hat.',
                    },
                    {
                      title: 'Good to know',
                      content: (
                        <ul className="space-y-2">
                          <li>Free cancellation up to 24 hours before departure.</li>
                          <li>Pickup time and fishing location depend on ice and weather conditions that day.</li>
                        </ul>
                      ),
                    },
                  ]}
                />
              </div>
            </section>

            <ProductFaq items={faqs} schemaId="ice-faq" tone="dark" />
          </div>

          <aside className="lg:col-span-5" id="book">
            <div className="rn-sticky-book">
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
                  <p className="py-10 text-center text-text-muted">Loading availability…</p>
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
                    tone="dark"
                  />
                )}
              </BookingAside>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
      <MobileBookingBar priceFrom={price} onBook={scrollToBook} />
    </div>
  )
}

export default IceFishingTour
