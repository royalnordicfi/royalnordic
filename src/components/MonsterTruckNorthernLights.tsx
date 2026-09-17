import React, { useState } from 'react'
import { Mail } from 'lucide-react'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import ExperienceFacts from './experience/ExperienceFacts'
import ExperienceGallery from './ExperienceGallery'
import ExperienceInclusions from './experience/ExperienceInclusions'
import Footer from './Footer'

const GALLERY = [
  { src: '/monsteri1.jpg', alt: 'Monster truck Northern Lights experience in Lapland' },
  { src: '/monsteri2.jpg', alt: 'Arctic monster truck safari vehicle in snow' },
  { src: '/monsteri3.jpg', alt: 'Off-road aurora adventure with monster truck' },
]

const MonsterTruckNorthernLights: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    adults: 1,
    children: 0,
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const inputClass =
    'w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora/50 focus:outline-none focus:ring-1 focus:ring-aurora/30'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'adults' || name === 'children' ? parseInt(value) || 0 : value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const message = `Monster Truck Northern Lights Experience Request

Preferred Date: ${formData.preferredDate || 'Not specified'}
Adults: ${formData.adults}
Children: ${formData.children}
Total Participants: ${formData.adults + formData.children}

${formData.message ? `Additional Message:\n${formData.message}` : ''}`

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-customized-tour-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: message,
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'New Monster Truck Northern Lights Experience Request - ROYAL NORDIC',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send request')
      }

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        adults: 1,
        children: 0,
        message: '',
      })

      setTimeout(() => {
        setSubmitStatus('idle')
      }, 5000)
    } catch (error) {
      console.error('Error sending request:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const included = [
    'Professional guide and driver',
    'Specially built monster truck vehicle',
    'Remote Northern Lights viewing locations',
    "Insights about Lapland's nature and aurora phenomenon",
    'Designed for families, friends, and adventure seekers',
    'No previous experience required',
    'Deep into snowy wilderness away from city lights',
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <div className="rn-container rn-shell-pad pb-14 pt-6 sm:pt-8">
        <ExperienceBreadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Northern Lights', to: '/northern-lights-tours' },
            { label: 'Monster truck experience' },
          ]}
        />

        <header className="mt-5 max-w-3xl">
          <p className="rn-eyebrow">Rovaniemi · Partner aurora</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.75rem]">
            Monster Truck Northern Lights Experience
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
            Ride a giant monster truck deep into snowy wilderness, away from city lights, for aurora viewing with
            a local guide.
          </p>
        </header>

        <div className="mt-6">
          <ExperienceGallery images={GALLERY} />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-7">
            <ExperienceFacts
              items={[
                { label: 'Duration', value: '3 hours' },
                { label: 'Group', value: 'Flexible' },
                { label: 'Location', value: 'Rovaniemi' },
                { label: 'Format', value: 'Partner activity' },
              ]}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Overview</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Experience the Arctic night on board a giant monster truck. This adventure takes you deep into
                snowy wilderness, far from city lights, where you have a chance of spotting the Northern Lights.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Your guide leads you to remote viewing spots and shares insights about Lapland&apos;s nature and
                the aurora. Designed for families, friends, and adventure seekers — no previous experience
                required; dress warmly for the Arctic night.
              </p>
            </section>

            <ExperienceInclusions
              included={included}
              notIncluded={['Food & drinks', 'Warm winter clothing (bring Arctic layers for the night)']}
            />

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Practical information</h2>
              <div className="mt-4">
                <ExperienceAccordion
                  items={[
                    {
                      title: 'Northern Lights',
                      content:
                        'Aurora sightings are never guaranteed. This is a partner-led evening format — not our Guaranteed Northern Lights Tour with return-trip terms.',
                    },
                    {
                      title: 'Third-party activity',
                      content:
                        'This experience is provided by our trusted partner. After you submit your request, we coordinate with the provider and get back to you with availability and pricing details.',
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
                  <h2 className="font-display text-xl font-semibold text-panel-ink">Request monster truck experience</h2>
                  <p className="mt-1 text-sm text-text-muted">Partner activity — we confirm availability by email.</p>
                </div>
                <div className="p-4 sm:p-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Your full name"
                    />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="your.email@example.com"
                    />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="+358 45 1234567"
                    />
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className={inputClass}
                    />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Adults</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                          className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold text-white">{formData.adults}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}
                          className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">Children</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                          className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center font-semibold text-white">{formData.children}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                          className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className={`${inputClass} resize-none`}
                      placeholder="Any additional requests or information..."
                    />

                    {submitStatus === 'success' && (
                      <p className="rounded-lg bg-aurora/10 px-3 py-2 text-center text-sm text-aurora-soft">
                        Thank you! We&apos;ll get back to you as soon as possible with availability and pricing details.
                      </p>
                    )}

                    {submitStatus === 'error' && (
                      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-400">
                        Something went wrong. Please try again or contact us directly.
                      </p>
                    )}

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
                          Send request
                          <Mail className="h-5 w-5" aria-hidden />
                        </>
                      )}
                    </button>
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

export default MonsterTruckNorthernLights
