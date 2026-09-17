import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import CategoryHero from './CategoryHero'
import ExperienceAccordion from './experience/ExperienceAccordion'
import ExperienceBreadcrumb from './experience/ExperienceBreadcrumb'
import Footer from './Footer'

const OPERATIONS = [
  {
    title: 'Product pages you can link to',
    text: 'Each experience has a public page with duration, pickup, and inclusions — share URLs with clients or embed in proposals.',
  },
  {
    title: 'Direct guest booking',
    text: 'Travellers can confirm online on royalnordic.fi; partners can still route FIT and group requests through us for alignment.',
  },
  {
    title: 'Pickup & timing',
    text: 'We confirm hotel pickup zones in Rovaniemi and realistic start windows for aurora evenings and daytime departures.',
  },
  {
    title: 'Languages & on-the-ground contact',
    text: 'English-led tours with WhatsApp and email support for last-minute changes when operations allow.',
  },
]

const AUDIENCES = [
  {
    title: 'Travel agencies & tour operators',
    text: 'FIT and group products with clear pickup, languages, and seasonal availability for your clients visiting Rovaniemi.',
  },
  {
    title: 'DMCs & inbound partners',
    text: 'Combine aurora hunts, daytime adventures, and private transfers into multi-day programmes tailored to your brief.',
  },
  {
    title: 'Hotels & accommodation',
    text: 'Recommend bookable experiences with hotel pickup — we help you advise guests on timing and what fits their stay.',
  },
  {
    title: 'Concierges & guest services',
    text: 'Direct online booking for guests who want to confirm immediately, plus enquiry support for custom requests.',
  },
]

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

  const inputClass = 'rn-form-input'

  const sellable = [
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
      title: 'Private transfers & custom tours',
      detail: 'Levi/Kittilä routes, airport pickups, and tailored itineraries for agencies and private travellers.',
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
        subtitle="For travel agencies, DMCs, hotels, and concierges selling premium Lapland experiences from Rovaniemi."
        image="/nortti5.jpg"
        compact
      />

      <main className="rn-section rn-hero-follow relative flex-1 bg-midnight pt-0 pb-12">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-75" aria-hidden />
        <div className="rn-container relative z-10">
        <ExperienceBreadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Travel trade' }]} />

        <div className="mx-auto mt-6 max-w-3xl space-y-12 sm:mt-8">
          <section className="rn-reveal">
            <p className="rn-eyebrow">Who we work with</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">Built for B2B partners</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {AUDIENCES.map((item) => (
                <div key={item.title} className="border-t border-white/[0.08] pt-4">
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rn-reveal">
            <p className="rn-eyebrow">Product catalogue</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">What you can sell</h2>
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {sellable.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rn-b2b-card group rounded-rn border border-white/[0.07] bg-surface/60 p-4 hover:border-aurora/25 hover:bg-surface/90"
                >
                  <h3 className="text-base font-semibold text-white transition group-hover:text-aurora-soft">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rn-reveal">
            <p className="rn-eyebrow">Operations</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
              What partners can count on
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {OPERATIONS.map((item) => (
                <div key={item.title} className="rounded-rn border border-white/[0.06] bg-surface/40 p-4">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link to="/terms-conditions" className="font-medium text-aurora-soft hover:underline">
                Terms &amp; guarantee
              </Link>
              <Link to="/northern-lights-tours" className="font-medium text-aurora-soft hover:underline">
                Northern Lights catalogue
              </Link>
              <Link to="/daytime-experiences" className="font-medium text-aurora-soft hover:underline">
                Day experiences
              </Link>
            </div>
          </section>

          <section className="rn-reveal">
            <p className="rn-eyebrow">Onboarding</p>
            <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">How cooperation works</h2>
            <div className="mt-4">
              <ExperienceAccordion
                items={[
                  {
                    title: '1. Tell us about your business',
                    content:
                      'Send an enquiry with your company details, markets, and the products or dates you need.',
                  },
                  {
                    title: '2. We confirm fit & operations',
                    content:
                      'We confirm suitability, seasonal availability, pickup zones, and languages for your clients.',
                  },
                  {
                    title: '3. Commercial terms in private',
                    content:
                      'Commission rates and net rates are agreed directly with partners — not published on this site.',
                  },
                  {
                    title: '4. Align on booking flow',
                    content:
                      'We align on how guests book, what they receive before arrival, and who handles on-the-ground communication.',
                  },
                ]}
              />
            </div>
          </section>

          <section className="rn-reveal border-y border-white/[0.08] py-7">
            <h2 className="font-display text-lg font-semibold text-white sm:text-xl">Royal Nordic at a glance</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-text-muted sm:text-base">
              <p>
                Royal Nordic is a Rovaniemi-based tour operator focused on premium Arctic experiences. We
                specialise in small-group and private tours with local guides, clear product pages, and direct
                online booking for travellers who prefer to confirm immediately.
              </p>
              <p>
                For partners, we support FIT and group requests, customized programmes, and clear communication
                around pickup, languages, and seasonal availability.
              </p>
              <Link
                to="/blog/where-to-stay-lapland-accommodation-guide"
                className="inline-block text-sm font-medium text-aurora-soft hover:underline"
              >
                Lapland accommodation guide for guest advice
              </Link>
            </div>
          </section>

          <section id="partnership-enquiry">
            <div className="rn-book-panel-light rn-reveal p-5 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-panel-ink">Partnership enquiry</h2>
              <p className="mt-2 text-sm text-panel-muted">
                Prefer email? Write to{' '}
                <a href="mailto:contact@royalnordic.fi" className="font-medium text-aurora-soft hover:underline">
                  contact@royalnordic.fi
                </a>{' '}
                or call{' '}
                <a href="tel:+3584578345138" className="font-medium text-aurora-soft hover:underline">
                  +358 45 78345138
                </a>
                .
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tt-name" className="rn-form-label">
                      Your name *
                    </label>
                    <input
                      required
                      id="tt-name"
                      name="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="tt-company" className="rn-form-label">
                      Company
                    </label>
                    <input
                      id="tt-company"
                      name="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Agency or DMC"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tt-email" className="rn-form-label">
                      Work email *
                    </label>
                    <input
                      required
                      id="tt-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@agency.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="tt-phone" className="rn-form-label">
                      Phone
                    </label>
                    <input
                      id="tt-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+358 …"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="tt-message" className="rn-form-label">
                    Enquiry *
                  </label>
                  <textarea
                    required
                    id="tt-message"
                    name="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Markets, products, dates, group size, and how you prefer to book…"
                    className={`${inputClass} resize-y`}
                  />
                </div>
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
                <a href="mailto:contact@royalnordic.fi" className="inline-flex items-center gap-2 hover:text-aurora-soft">
                  <Mail size={16} aria-hidden /> contact@royalnordic.fi
                </a>
                <a href="tel:+3584578345138" className="inline-flex items-center gap-2 hover:text-aurora-soft">
                  <Phone size={16} aria-hidden /> +358 45 78345138
                </a>
              </div>
            </div>
          </section>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default TravelTrade
