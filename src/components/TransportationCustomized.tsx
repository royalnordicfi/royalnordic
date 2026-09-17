import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceItinerary from './experience/ExperienceItinerary'
import Footer from './Footer'

const TransportationCustomized = () => {
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
          serviceType: 'Private Customized Transportation',
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'Custom Transportation Request - ROYAL NORDIC',
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
    'Custom routes throughout Lapland',
    'Flexible scheduling and timing',
    'Professional driver with local knowledge',
    'Private vehicle for your group only',
    'Airport transfers available',
    'Hotel pickup and drop-off',
    'Luggage assistance included',
    'Child safety seats upon request',
    'Multi-stop itineraries possible',
    'Scenic route options available',
  ]

  const itinerary = [
    {
      time: 'Flexible',
      title: 'Custom pickup location',
      text: "We'll collect you from your specified location in Lapland",
    },
    {
      title: 'Custom route and stops',
      text: 'Travel to your chosen destinations with stops as requested',
    },
    {
      title: 'Flexible drop-off',
      text: 'Drop-off at your final destination or return to starting point',
    },
  ]

  const popularRoutes = [
    {
      title: 'Airport transfers',
      text: 'Rovaniemi Airport to city center or hotels',
    },
    {
      title: 'Sightseeing tours',
      text: 'Multi-stop tours to Santa Claus Village, Ranua Zoo, and other attractions',
    },
    {
      title: 'Remote locations',
      text: 'Transportation to wilderness areas, fishing spots, and remote accommodations',
    },
    {
      title: 'Event transportation',
      text: 'Wedding parties, corporate events, and special occasions',
    },
  ]

  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Customized Transportation"
        subtitle="Tailored transfers for your route — airport pickups, multi-stop itineraries, and custom routes throughout Lapland."
        image="/transportation2.jpg"
        compact
      />

      <div className="rn-container pb-12 pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Transportation', to: '/transportation' },
            { label: 'Custom transfers' },
          ]}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: 'Flexible' },
                { label: 'Capacity', value: 'Up to 8' },
                { label: 'Coverage', value: 'Finland / Lapland' },
                { label: 'Booking', value: 'Quote on request' },
              ]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Our customized transportation service is designed to meet your specific travel needs throughout
                Lapland. Whether you need airport transfers, multi-stop sightseeing tours, or transportation to
                remote locations, we provide flexible and personalized service.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Our experienced drivers know Lapland&apos;s roads and destinations intimately, ensuring you reach
                your destinations safely and efficiently. We can accommodate various group sizes and provide
                vehicles suitable for different types of terrain and weather conditions.
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
              <h2 className="font-display text-2xl font-semibold text-white">Popular custom routes</h2>
              <ul className="mt-4 space-y-4">
                {popularRoutes.map((route) => (
                  <li key={route.title}>
                    <h3 className="font-semibold text-white">{route.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">{route.text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
              <div className="mt-4">
                <ExperienceAccordion
                  items={[
                    {
                      title: 'Quotes',
                      content:
                        'Pricing depends on route, timing, and vehicle needs. Send your details — we reply with a quote, typically within 24 hours.',
                    },
                    {
                      title: 'Fixed Levi route',
                      content: (
                        <>
                          For Rovaniemi–Levi/Kittilä transfers with published adult/child rates, see our{' '}
                          <Link to="/transportation-rovaniemi-levi" className="font-medium text-aurora-soft hover:underline">
                            Levi/Kittilä transfer page
                          </Link>
                          .
                        </>
                      ),
                    },
                  ]}
                />
              </div>
            </section>
          </div>

          <aside id="book" className="lg:col-span-5">
            <div className="rn-sticky-book">
              <div className="rn-book-panel-light rn-reveal">
                <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
                  <h2 className="font-display text-xl font-semibold text-panel-ink">Request custom transportation</h2>
                  <p className="mt-1 text-sm text-panel-muted">Tell us your route — we reply with a quote within 24 hours.</p>
                </div>
                <div className="p-4 sm:p-5">
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
                      placeholder="Group size & luggage"
                    />
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="Route & destination details"
                    />
                    <input
                      type="text"
                      id="pickupDetails"
                      name="pickupDetails"
                      value={formData.pickupDetails}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Pickup instructions"
                    />
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      rows={4}
                      className={`${inputClass} resize-none`}
                      placeholder="Child seats, multi-stop plans, special requirements…"
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
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default TransportationCustomized
