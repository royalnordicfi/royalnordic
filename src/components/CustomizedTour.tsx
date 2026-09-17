import React, { useState } from 'react'
import { CheckCircle, Mail, MapPin, Clock, Users, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const CustomizedTour: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const customizationOptions = [
    'Northern Lights photography tours',
    'Private wilderness expeditions',
    'Cultural experiences with locals',
    'Adventure sports (ice climbing, snowmobiling)',
    'Family-friendly activities',
    'Luxury VIP experiences',
    'Multi-day expeditions',
    'Seasonal special events',
  ]

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
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
          message: formData.message,
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'New Customized Tour Request - ROYAL NORDIC',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send request')
      }

      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', message: '' })

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

  return (
    <div className="rn-page">
      <CategoryHero
        title="Customized Tours"
        subtitle="Create your perfect Lapland adventure with personalized experiences tailored to your group, dates, and interests."
        image="/slideshow3.jpg"
        compact
      />

      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Customized Tours</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-9 lg:col-span-7">
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Clock, label: 'Duration', value: 'Flexible' },
                { icon: Users, label: 'Group', value: 'Any size' },
                { icon: MapPin, label: 'Location', value: 'Lapland' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="rounded-rn border border-white/10 bg-surface p-3.5">
                  <Icon size={16} className="text-aurora" aria-hidden />
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-text-dim">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">About customized tours</h2>
              <p className="mt-3 leading-relaxed text-text-muted">
                At Royal Nordic, we believe every traveler has unique dreams and preferences. Our customized
                tour service allows you to create the perfect Lapland experience that matches your vision,
                schedule, and interests.
              </p>
              <p className="mt-3 leading-relaxed text-text-muted">
                Whether you&apos;re planning a romantic getaway, a family adventure, a photography expedition,
                or a corporate retreat, our team works with you to design an itinerary that fits your group.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">What we can customize</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {customizationOptions.map((option) => (
                  <li key={option} className="flex items-start gap-2 text-sm text-text-muted">
                    <CheckCircle className="mt-0.5 shrink-0 text-aurora" size={16} aria-hidden />
                    {option}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-white">Why choose us</h2>
              <div className="mt-4 space-y-4">
                {[
                  {
                    icon: Star,
                    title: 'Personalized planning',
                    text: 'Every tour is designed for your group — interests, fitness levels, and preferences.',
                  },
                  {
                    icon: MapPin,
                    title: 'Local expertise',
                    text: 'Deep knowledge of Lapland helps you reach authentic locations away from the crowds.',
                  },
                  {
                    icon: Users,
                    title: 'Flexible group sizes',
                    text: 'From intimate private tours to larger groups with personalized attention.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-3">
                    <Icon className="mt-0.5 shrink-0 text-aurora" size={18} aria-hidden />
                    <div>
                      <h3 className="font-semibold text-white">{title}</h3>
                      <p className="mt-1 text-sm text-text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:col-span-5" id="request">
            <div className="lg:sticky lg:top-24">
              <div className="rn-panel p-5 shadow-rn sm:p-6">
                <h2 className="font-display text-xl font-semibold text-panel-ink">Request your custom tour</h2>
                <p className="mt-1 text-sm text-panel-muted">We reply with ideas and next steps — no payment on this form.</p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass}
                    placeholder="Your full name"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    placeholder="your.email@example.com"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                    placeholder="+358 45 1234567"
                  />
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className={`${inputClass} resize-none`}
                    placeholder="Describe your ideal Lapland experience..."
                  />

                  {submitStatus === 'success' && (
                    <p className="rounded-lg bg-aurora/10 px-3 py-2 text-center text-sm text-aurora-soft">
                      Thank you! We&apos;ll get back to you as soon as possible to discuss your custom tour.
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
                        Send custom tour request
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

export default CustomizedTour
