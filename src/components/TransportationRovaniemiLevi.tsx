import { Mail } from 'lucide-react'
import { useState } from 'react'
import Footer from './Footer'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'

const GALLERY = [{ src: '/transportation1.jpg', alt: 'Private transfer between Rovaniemi and Levi' }]

const HIGHLIGHTS = [
  'Private vehicle with driver — up to 8 passengers',
  'Direct Rovaniemi ↔ Levi/Kittilä route, about 2–3 hours',
  'Flexible pickup times; quote confirmed by email after request',
]

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
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Transportation', to: '/transportation' },
          { label: 'Rovaniemi – Levi/Kittilä' },
        ]}
        eyebrow="Lapland · Ski resort transfer"
        title="Private Transportation: Rovaniemi – Levi/Kittilä"
        lede="Private transfer between Rovaniemi and Levi/Kittilä — from €399/adult, up to 8 passengers."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '2–3 hours' },
          { label: 'Capacity', value: 'Up to 8' },
          { label: 'Route', value: 'Rovaniemi → Levi/Kittilä' },
          { label: 'From', value: `€${pricing.adult} adult` },
        ]}
        booking={
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
                <p className="text-center text-sm text-aurora-soft">Request sent — we&apos;ll contact you soon.</p>
              )}
              {submitStatus === 'error' && (
                <p className="text-center text-sm text-red-400">
                  Failed to send. Please try again or email contact@royalnordic.fi.
                </p>
              )}
            </form>
          </BookingAside>
        }
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Private door-to-door transfer between Rovaniemi and the Levi/Kittilä ski areas. One vehicle for your
            group, luggage help, and drivers who know winter road conditions on the 2–3 hour route.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Published rates start at €{pricing.adult} per adult and €{pricing.child} per child (0–17). Send your
            details for final confirmation.
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
          <ExperienceInclusions included={included} />
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
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
      </ExperienceProductLayout>

      <Footer />
    </div>
  )
}

export default TransportationRovaniemiLevi
