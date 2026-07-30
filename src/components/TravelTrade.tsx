import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Mail, Phone } from 'lucide-react'
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
    <div className="flex min-h-screen flex-col bg-black text-white">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.14),_transparent_55%)]" />
          <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-32 sm:px-6 sm:pb-16 sm:pt-36 lg:px-8">
            <Link
              to="/"
              className="mb-8 inline-flex min-h-[44px] items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-emerald-400/50 hover:text-emerald-300"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
            <p className="mb-3 font-clean text-sm uppercase tracking-[0.18em] text-emerald-400">
              Travel Trade
            </p>
            <h1 className="mb-4 font-luxury text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Partner With Royal Nordic
            </h1>
            <p className="max-w-2xl font-clean text-base leading-relaxed text-gray-300 sm:text-lg">
              For travel agencies, DMCs, and B2B partners looking for premium Lapland experiences
              from Rovaniemi — Northern Lights, daytime adventures, private itineraries, and
              transfers.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:space-y-14 sm:px-6 sm:py-16 lg:px-8">
          <section>
            <h2 className="mb-5 font-luxury text-2xl font-bold">Why partner with us</h2>
            <ul className="space-y-3">
              {reasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3 font-clean text-sm text-gray-300 sm:text-base">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 font-luxury text-2xl font-bold">Company introduction</h2>
            <div className="space-y-4 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
              <p>
                Royal Nordic is a Rovaniemi-based tour operator focused on premium Arctic
                experiences. We specialise in small-group and private tours with local guides,
                clear product pages, and direct online booking for travellers who prefer to confirm
                immediately.
              </p>
              <p>
                For agencies and partners, we support FIT and group requests, customized programmes,
                and clear communication around pickup, languages, and seasonal availability.
                Commercial terms are shared privately after we understand your market and volume.
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-5 font-luxury text-2xl font-bold">Our experiences</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {experiences.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-emerald-500/35"
                >
                  <h3 className="mb-1 text-base font-semibold text-white">{item.title}</h3>
                  <p className="font-clean text-sm leading-relaxed text-gray-400">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 border-y border-white/10 py-8 md:grid-cols-2 md:gap-10">
            <div>
              <h2 className="mb-3 font-luxury text-xl font-bold">Accommodation</h2>
              <p className="mb-3 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
                We help partners advise guests on where to stay in the Rovaniemi area and how lodging
                connects with hotel pickup. Detailed property contracts and rates are arranged case
                by case.
              </p>
              <Link
                to="/blog/where-to-stay-lapland-accommodation-guide"
                className="text-sm font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Lapland accommodation guide
              </Link>
            </div>
            <div>
              <h2 className="mb-3 font-luxury text-xl font-bold">Customized itineraries</h2>
              <p className="mb-3 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
                Multi-activity programmes combining aurora hunting, daytime adventures, and private
                transfers. Share guest profile, dates, and pace — we reply with a workable outline.
              </p>
              <Link
                to="/customized-tour"
                className="text-sm font-medium text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Request a customized tour
              </Link>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-luxury text-2xl font-bold">How partnerships work</h2>
            <ol className="list-inside list-decimal space-y-3 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
              <li>Send an enquiry with your company details and the products or dates you need.</li>
              <li>We confirm suitability, seasonal availability, and operational notes.</li>
              <li>Commercial terms (including any agency arrangements) are shared privately.</li>
              <li>We align on booking flow, guest communication, and pickup details.</li>
            </ol>
            <p className="mt-4 font-clean text-xs text-gray-500">
              Commission rates and net rates are agreed directly with partners — not published here.
            </p>
          </section>

          <section id="partnership-enquiry" className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-8">
            <h2 className="mb-2 font-luxury text-2xl font-bold">Partnership enquiry</h2>
            <p className="mb-6 font-clean text-sm text-gray-400">
              Prefer email? Write to{' '}
              <a href="mailto:contact@royalnordic.fi" className="text-emerald-400 hover:underline">
                contact@royalnordic.fi
              </a>{' '}
              or call{' '}
              <a href="tel:+3584578345138" className="text-emerald-400 hover:underline">
                +358 45 78345138
              </a>
              .
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                  className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  name="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company / agency"
                  className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="min-h-[48px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <textarea
                required
                name="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us about your agency, markets, and what you need (products, dates, group size)…"
                className="w-full resize-y rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[48px] w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? 'Sending…' : 'Send partnership enquiry'}
              </button>
              {submitStatus === 'success' && (
                <p className="text-sm text-emerald-400">
                  Thank you — check your email for confirmation. We will reply soon.
                </p>
              )}
              {submitStatus === 'error' && (
                <p className="text-sm text-red-400">
                  Something went wrong. Please email contact@royalnordic.fi directly.
                </p>
              )}
            </form>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-gray-400">
              <a href="mailto:contact@royalnordic.fi" className="inline-flex items-center gap-2 hover:text-emerald-400">
                <Mail size={16} /> contact@royalnordic.fi
              </a>
              <a href="tel:+3584578345138" className="inline-flex items-center gap-2 hover:text-emerald-400">
                <Phone size={16} /> +358 45 78345138
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
