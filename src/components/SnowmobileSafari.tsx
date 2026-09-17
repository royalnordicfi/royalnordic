import React, { useState } from 'react'
import { CheckCircle, Clock, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

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
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30'

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

  const features = [
    'Professional snowmobile equipment provided',
    'Experienced guides for safety',
    'Scenic routes through Lapland wilderness',
    'Suitable for all skill levels',
    'Safety briefing included',
    'Warm clothing available if needed',
  ]

  return (
    <div className="rn-page">
      <CategoryHero
        title="Snowmobile Safari"
        subtitle="Experience the thrill of snowmobiling through Lapland's pristine wilderness with our partner provider."
        image="/snowmobiling1.jpg"
        compact
      />

      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/daytime-experiences" className="hover:text-white">Daytime experiences</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Snowmobile Safari</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-rn border border-white/10 bg-surface p-3.5">
                <Clock size={16} className="text-aurora" aria-hidden />
                <p className="mt-2 text-[11px] uppercase tracking-wide text-text-dim">Duration</p>
                <p className="mt-0.5 text-sm font-semibold text-white">0.5h, 1h, 2h, or 3h</p>
              </div>
              <div className="rounded-rn border border-white/10 bg-surface p-3.5">
                <MapPin size={16} className="text-aurora" aria-hidden />
                <p className="mt-2 text-[11px] uppercase tracking-wide text-text-dim">Location</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Rovaniemi</p>
              </div>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">About snowmobile safari</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                Experience the thrill of snowmobiling through Lapland&apos;s pristine wilderness! Our snowmobile
                safaris are provided by our trusted partner, offering you an authentic Arctic adventure.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Wind through snowy forests, explore frozen landscapes, and discover Finnish Lapland from the seat
                of a powerful snowmobile. Whether you&apos;re a beginner or experienced rider, professional guides
                help keep the ride safe and memorable.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">What&apos;s included</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-muted">
                    <CheckCircle className="mt-0.5 shrink-0 text-aurora" size={16} aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-rn border border-white/10 bg-surface p-5">
              <h3 className="font-display text-lg font-semibold text-white">Third-party activity</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                This snowmobile safari is provided by our trusted partner. After you submit your request,
                we&apos;ll coordinate with the provider and get back to you with availability and pricing details.
              </p>
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="rn-panel p-5 shadow-rn sm:p-6">
                <h2 className="font-display text-xl font-semibold text-panel-ink">Request snowmobile safari</h2>
                <p className="mt-1 text-sm text-panel-muted">Partner activity — we confirm availability by email.</p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
                        className="h-10 w-10 rounded-lg border border-black/10 bg-white text-panel-ink hover:bg-black/5"
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center font-semibold text-panel-ink">{formData.adults}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}
                        className="h-10 w-10 rounded-lg border border-black/10 bg-white text-panel-ink hover:bg-black/5"
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
                        className="h-10 w-10 rounded-lg border border-black/10 bg-white text-panel-ink hover:bg-black/5"
                      >
                        -
                      </button>
                      <span className="min-w-[2rem] text-center font-semibold text-panel-ink">{formData.children}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                        className="h-10 w-10 rounded-lg border border-black/10 bg-white text-panel-ink hover:bg-black/5"
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
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default SnowmobileSafari
