import { Mail } from 'lucide-react'
import { useState } from 'react'
import BookingAside from './experience/BookingAside'
import CategoryHero from './CategoryHero'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceItinerary from './experience/ExperienceItinerary'
import Footer from './Footer'

const TransportationRovaniemiLevi = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    pickupDetails: '',
    preferredDate: '',
    preferredTime: '',
    groupSize: '',
    additionalInfo: '',
  })

  const pricing = {
    adult: 399,
    child: 299,
  }
  const inputClass =
    'w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora/50 focus:outline-none focus:ring-1 focus:ring-aurora/30'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState('')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-transportation-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: formData.destination,
          pickupDetails: formData.pickupDetails,
          preferredDate: formData.preferredDate || null,
          preferredTime: formData.preferredTime || '',
          groupSize: formData.groupSize || '',
          additionalInfo: formData.additionalInfo,
          serviceType: 'Private Transportation: Rovaniemi - Levi/Kittilä',
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'Transportation Request: Rovaniemi to Levi/Kittilä - ROYAL NORDIC',
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          phone: '',
          destination: '',
          pickupDetails: '',
          preferredDate: '',
          preferredTime: '',
          groupSize: '',
          additionalInfo: '',
        })
      } else {
        console.error('Response not ok:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('Error response:', errorData)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Request failed:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const included = [
    'Private vehicle with professional driver',
    'Comfortable seating for up to 8 passengers',
    'Flexible departure times',
    'Direct route to Levi/Kittilä ski resorts',
    'Luggage assistance',
    'Child safety seats available upon request',
    'Hotel pickup and drop-off',
    'Scenic route through Lapland countryside',
  ]

  const itinerary = [
    {
      time: 'Flexible',
      title: 'Pickup from Rovaniemi',
      text: "We'll collect you from your hotel or specified location in Rovaniemi",
    },
    {
      title: 'Scenic drive to Levi/Kittilä',
      text: 'Enjoy the beautiful Lapland landscape during the 2–3 hour journey',
    },
    {
      title: 'Arrival at destination',
      text: 'Drop-off at your hotel or specified location in Levi or Kittilä',
    },
  ]

  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Transportation: Rovaniemi – Levi/Kittilä"
        subtitle="Comfortable private transfers between Rovaniemi and the ski resorts of Levi and Kittilä."
        image="/transportation1.jpg"
        compact
      />

      <div className="rn-container pb-12 pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Transportation', to: '/transportation' },
            { label: 'Rovaniemi – Levi/Kittilä' },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: '2–3 hours' },
                { label: 'Capacity', value: 'Up to 8' },
                { label: 'Route', value: 'Rovaniemi → Levi/Kittilä' },
                { label: 'From', value: `€${pricing.adult} adult` },
              ]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Our private transportation service provides a comfortable and reliable way to travel between
                Rovaniemi and the popular ski resorts of Levi and Kittilä. Whether you&apos;re heading to the slopes
                for skiing or snowboarding, or simply want to explore these beautiful destinations, we ensure a
                smooth and enjoyable journey.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Our professional drivers are familiar with the routes and weather conditions, ensuring your safety
                and comfort throughout the journey. The scenic drive through Lapland&apos;s countryside offers
                beautiful views of snow-covered forests and frozen lakes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Itinerary</h2>
              <div className="mt-4">
                <ExperienceItinerary steps={itinerary} />
              </div>
            </section>

            <ExperienceInclusions included={included} />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
              <div className="mt-4">
                <ExperienceAccordion
                  items={[
                    {
                      title: 'Pricing',
                      content: (
                        <>
                          From €{pricing.adult} per adult and €{pricing.child} per child (0–17). Final quote
                          confirmed after you send your request.
                        </>
                      ),
                    },
                    {
                      title: 'Response time',
                      content: 'We aim to reply with confirmation details within 24 hours of your request.',
                    },
                  ]}
                />
              </div>
            </section>
          </div>

          <aside id="book" className="lg:col-span-5">
            <div className="rn-sticky-book">
              <BookingAside
                priceFrom={pricing.adult}
                priceNote="/ adult"
                trustLines={[
                  `Child rate €${pricing.child} (0–17)`,
                  'Private vehicle up to 8 passengers',
                  'Flexible pickup times',
                  'Quote confirmed by email',
                ]}
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="Your full name"
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="your.email@example.com"
                  />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="+358 40 123 4567"
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      id="preferredDate"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                    <input
                      type="time"
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className={inputClass}
                    />
                  </div>
                  <input
                    type="text"
                    id="groupSize"
                    name="groupSize"
                    value={formData.groupSize}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Group size & luggage (e.g. 4 adults, 6 bags)"
                  />
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    value={formData.destination}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="Route details (from → to)"
                  />
                  <input
                    type="text"
                    id="pickupDetails"
                    name="pickupDetails"
                    value={formData.pickupDetails}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Pickup instructions (hotel, flight, etc.)"
                  />
                  <textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Dates, child seats, special requirements…"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rn-btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending request…
                      </>
                    ) : (
                      <>
                        Send transportation request
                        <Mail className="h-5 w-5" aria-hidden />
                      </>
                    )}
                  </button>

                  {submitStatus === 'success' && (
                    <p className="text-center text-sm text-aurora-soft">
                      Request sent — we&apos;ll contact you soon.
                    </p>
                  )}
                  {submitStatus === 'error' && (
                    <p className="text-center text-sm text-red-400">
                      Failed to send. Please try again or email contact@royalnordic.fi.
                    </p>
                  )}
                </form>
              </BookingAside>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TransportationRovaniemiLevi
