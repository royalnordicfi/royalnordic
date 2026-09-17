import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Mail, Phone } from 'lucide-react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const TravelTrade: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30'

  const reasons = [
    'Local operator based in Rovaniemi, Finnish Lapland',
    'Small groups and private experiences with clear service standards',
    'Online booking for guests who prefer to confirm direct',
    'Flexible customized itineraries for agencies and private groups',
    'Hotel pickup with English & Finnish guiding',
  ]

  const experiences = [
    {
      title: 'Guaranteed Northern Lights Tour',
      detail: 'Aurora hunt with hotel pickup and a free return trip if no lights appear (see Terms).',
      to: '/northern-lights-tour',
    },
    {
      title: 'Family-Friendly Northern Lights',
      detail: 'Shorter 2-hour evening format for families and mixed-age groups.',
      to: '/family-friendly-northern-lights',
    },
    {
      title: 'Daytime Lapland experiences',
      detail: 'Ice fishing, Ranua Wildlife Park, and Korouoma Canyon day trips from Rovaniemi.',
      to: '/daytime-experiences',
    },
    {
      title: 'Private & customized tours',
      detail: 'Tailored itineraries for agencies, incentives, and private travellers.',
      to: '/customized-tour',
    },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-customized-tour-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'partner',
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: [
              'Travel trade / partnership enquiry',
              formData.company ? `Company: ${formData.company}` : null,
              formData.message,
            ]
              .filter(Boolean)
              .join('\n\n'),
            to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
            subject: 'Travel Trade Partnership Enquiry - ROYAL NORDIC',
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to send request')

      setSubmitStatus('success')
      setFormData({ name: '', company: '', email: '', phone: '', message: '' })
      window.setTimeout(() => setSubmitStatus('idle'), 6000)
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rn-page flex min-h-screen flex-col">
      <CategoryHero
        title="Partner With Royal Nordic"
        subtitle="For travel agencies, DMCs, and B2B partners looking for premium Lapland experiences from Rovaniemi."
        image="/nortti5.jpg"
        compact
      />

      <main className="rn-container rn-page-pad flex-1 pb-12 pt-6 sm:pt-8">
        <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Travel trade</li>
          </ol>
        </nav>

        <div className="mx-auto max-w-3xl space-y-12">
          <section>
            <h2 className="font-display text-2xl font-semibold text-white">Why partner with us</h2>
            <ul className="mt-4 space-y-3">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3 text-sm text-text-muted sm:text-base">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-aurora" aria-hidden />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-white">Company introduction</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-text-muted sm:text-base">
              <p>
                Royal Nordic is a Rovaniemi-based tour operator focused on premium Arctic experiences. We
                specialise in small-group and private tours with local guides, clear product pages, and direct
                online booking for travellers who prefer to confirm immediately.
              </p>
              <p>
                For agencies and partners, we support FIT and group requests, customized programmes, and clear
                communication around pickup, languages, and seasonal availability. Commercial terms are shared
                privately after we understand your market and volume.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-white">Our experiences</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {experiences.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-rn border border-white/10 bg-surface p-4 transition-colors hover:border-aurora/30"
                >
                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-8 border-y border-white/10 py-8 md:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Accommodation</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                We help partners advise guests on where to stay in the Rovaniemi area and how lodging connects
                with hotel pickup. Detailed property contracts and rates are arranged case by case.
              </p>
              <Link
                to="/blog/where-to-stay-lapland-accommodation-guide"
                className="mt-3 inline-block text-sm font-medium text-aurora-soft hover:underline"
              >
                Lapland accommodation guide
              </Link>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Customized itineraries</h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                Multi-activity programmes combining aurora hunting, daytime adventures, and private transfers.
                Share guest profile, dates, and pace — we reply with a workable outline.
              </p>
              <Link
                to="/customized-tour"
                className="mt-3 inline-block text-sm font-medium text-aurora-soft hover:underline"
              >
                Request a customized tour
              </Link>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-white">How partnerships work</h2>
            <ol className="mt-4 list-inside list-decimal space-y-3 text-sm leading-relaxed text-text-muted sm:text-base">
              <li>Send an enquiry with your company details and the products or dates you need.</li>
              <li>We confirm suitability, seasonal availability, and operational notes.</li>
              <li>Commercial terms (including any agency arrangements) are shared privately.</li>
              <li>We align on booking flow, guest communication, and pickup details.</li>
            </ol>
            <p className="mt-4 text-xs text-text-dim">
              Commission rates and net rates are agreed directly with partners — not published here.
            </p>
          </section>

          <section id="partnership-enquiry" className="rn-panel p-5 shadow-rn sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-panel-ink">Partnership enquiry</h2>
            <p className="mt-2 text-sm text-panel-muted">
              Prefer email? Write to{' '}
              <a href="mailto:contact@royalnordic.fi" className="font-medium text-aurora hover:underline">
                contact@royalnordic.fi
              </a>{' '}
              or call{' '}
              <a href="tel:+3584578345138" className="font-medium text-aurora hover:underline">
                +358 45 78345138
              </a>
              .
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className={inputClass}
                />
                <input
                  name="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company / agency"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Work email"
                  className={inputClass}
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className={inputClass}
                />
              </div>
              <textarea
                required
                name="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your agency, markets, and what you need (products, dates, group size)…"
                className={`${inputClass} resize-y`}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="rn-btn-primary min-h-[48px] w-full disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {isSubmitting ? 'Sending…' : 'Send partnership enquiry'}
              </button>
              {submitStatus === 'success' && (
                <p className="text-sm text-aurora-soft">
                  Thank you — check your email for confirmation. We will reply soon.
                </p>
              )}
              {submitStatus === 'error' && (
                <p className="text-sm text-red-400">
                  Something went wrong. Please email contact@royalnordic.fi directly.
                </p>
              )}
            </form>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-panel-muted">
              <a href="mailto:contact@royalnordic.fi" className="inline-flex items-center gap-2 hover:text-aurora">
                <Mail size={16} aria-hidden /> contact@royalnordic.fi
              </a>
              <a href="tel:+3584578345138" className="inline-flex items-center gap-2 hover:text-aurora">
                <Phone size={16} aria-hidden /> +358 45 78345138
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TravelTrade
