import React, { useState } from 'react'
import { Mail } from 'lucide-react'
import Footer from './Footer'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'

const GALLERY = [
  { src: '/snowmobiling1.jpeg', alt: 'Snowmobile safari in Lapland wilderness' },
  { src: '/snowmobiling2.jpeg', alt: 'Snowmobiling through snowy forest near Rovaniemi' },
]

const HIGHLIGHTS = [
  'Partner-led safaris from 30 minutes to 3 hours',
  'Routes through Lapland forest — briefing and gear from the provider',
  'Request by form; we confirm availability and price by email',
]

const SnowmobileSafari: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    duration: '1',
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
      const message = `Snowmobile Safari Request

Duration: ${formData.duration} hour(s)
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
          subject: 'New Snowmobile Safari Request - ROYAL NORDIC',
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
        duration: '1',
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
    'Professional snowmobile equipment provided',
    'Experienced guides for safety',
    'Scenic routes through Lapland wilderness',
    'Suitable for all skill levels',
    'Safety briefing included',
    'Warm clothing available if needed',
  ]

  const itinerary = [
    {
      title: 'Send your request',
      text: 'Preferred date, duration (0.5–3 h), and group size via the form.',
    },
    {
      title: 'We coordinate with our partner',
      text: 'Royal Nordic confirms availability and pricing by email.',
    },
    {
      title: 'Briefing & ride',
      text: 'On-site safety briefing, then guided route through snowy forest with the partner team.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Snowmobile Safari' },
        ]}
        eyebrow="Rovaniemi · Partner activity"
        title="Snowmobile Safari"
        lede="Snowmobiling through Lapland forest with our partner — request date, duration, and group size by form."
        images={GALLERY}
        facts={[
          { label: 'Duration', value: '0.5h, 1h, 2h, or 3h' },
          { label: 'Location', value: 'Rovaniemi' },
          { label: 'Format', value: 'Partner-led' },
          { label: 'Booking', value: 'Request by form' },
        ]}
        booking={
          <div className="rn-book-panel-light rn-reveal">
            <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
              <h2 className="font-display text-xl font-semibold text-panel-ink">Request snowmobile safari</h2>
              <p className="mt-1 text-sm text-panel-muted">Partner activity — we confirm availability by email.</p>
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
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  className={inputClass}
                >
                  <option value="0.5">0.5 hours</option>
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                </select>

                <div>
                  <label className="mb-2 block text-sm font-medium text-panel-ink">Adults</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                      className="h-10 w-10 rounded-lg border border-black/10 bg-black/[0.03] text-panel-ink hover:bg-black/[0.06]"
                    >
                      -
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-panel-ink">{formData.adults}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}
                      className="h-10 w-10 rounded-lg border border-black/10 bg-black/[0.03] text-panel-ink hover:bg-black/[0.06]"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-panel-ink">Children</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                      className="h-10 w-10 rounded-lg border border-black/10 bg-black/[0.03] text-panel-ink hover:bg-black/[0.06]"
                    >
                      -
                    </button>
                    <span className="min-w-[2rem] text-center font-semibold text-panel-ink">{formData.children}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                      className="h-10 w-10 rounded-lg border border-black/10 bg-black/[0.03] text-panel-ink hover:bg-black/[0.06]"
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
        }
      >
        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Overview</h2>
          <p className="mt-3 leading-relaxed text-text-muted">
            Snowmobile safaris are run by our trusted partner near Rovaniemi. Routes cross snowy forest and open
            Lapland terrain with a safety briefing before you ride.
          </p>
          <p className="mt-3 leading-relaxed text-text-muted">
            Beginners and experienced riders are welcome. Submit the form with your preferred date and duration;
            we reply with availability and pricing — no payment on this form.
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
                  title: 'Third-party activity',
                  content:
                    'This snowmobile safari is provided by our trusted partner. After you submit your request, we coordinate with the provider and get back to you with availability and pricing details.',
                },
                {
                  title: 'How booking works',
                  content:
                    'Send your preferred date, duration, and group size. We reply by email — no payment on this form.',
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

export default SnowmobileSafari
