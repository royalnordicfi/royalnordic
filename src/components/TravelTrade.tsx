import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle,
  Briefcase,
  Sparkles,
  Users,
  Compass,
  Building2,
  Mail,
  Phone,
} from 'lucide-react'
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
    'Small groups and private experiences with premium service standards',
    'Clear product pages with online booking for guests who prefer to book direct',
    'Flexible customized itineraries for agencies and private groups',
    'Reliable hotel pickup and English & Finnish guiding',
  ]

  const experiences = [
    {
      title: 'Guaranteed Northern Lights Tour',
      detail: 'Dedicated aurora hunt with hotel pickup and a free return trip if no lights appear (see Terms).',
      to: '/northern-lights-tour',
    },
    {
      title: 'Family-Friendly Northern Lights',
      detail: 'Shorter 2-hour evening format designed for families and mixed-age groups.',
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
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: [
              `Travel trade / partnership enquiry`,
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
    <div className="min-h-screen bg-black">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.18),_transparent_55%)]" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 sm:pt-36 sm:pb-20">
          <Link
            to="/"
            className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-colors font-medium px-4 py-2 rounded-lg mb-8 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <p className="text-emerald-400 text-sm tracking-[0.2em] uppercase font-clean mb-3">
            Travel Trade
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-luxury font-bold text-white mb-4 leading-tight">
            Partner With Royal Nordic
          </h1>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl font-clean leading-relaxed">
            A professional landing point for travel agencies, DMCs, and B2B partners who want
            premium Lapland experiences operated from Rovaniemi — Northern Lights, daytime
            adventures, private itineraries, and transfers.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10 sm:space-y-14">
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="text-emerald-400" size={22} />
            <h2 className="text-2xl font-luxury font-bold text-white">Why partner with Royal Nordic</h2>
          </div>
          <ul className="space-y-3">
            {reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-3 text-gray-300 font-clean text-sm sm:text-base">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="text-emerald-400" size={22} />
            <h2 className="text-2xl font-luxury font-bold text-white">Company introduction</h2>
          </div>
          <div className="space-y-4 text-gray-300 font-clean text-sm sm:text-base leading-relaxed">
            <p>
              Royal Nordic is a Rovaniemi-based tour operator focused on premium Arctic experiences.
              We specialise in small-group and private tours with local guides, careful product
              presentation, and direct online booking for travellers who prefer to confirm
              immediately.
            </p>
            <p>
              For agencies and partners, we can support FIT and group requests, customized
              programmes, and clear communication around pickup, languages, and seasonal
              availability. Commercial terms are shared privately after we understand your market
              and volume.
            </p>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <Sparkles className="text-emerald-400" size={22} />
            <h2 className="text-2xl font-luxury font-bold text-white">Our experiences</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {experiences.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border border-white/10 bg-black/30 p-4 hover:border-emerald-500/40 transition-colors"
              >
                <h3 className="text-white font-semibold text-base mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm font-clean leading-relaxed">{item.detail}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="text-emerald-400" size={22} />
              <h2 className="text-xl font-luxury font-bold text-white">Accommodation</h2>
            </div>
            <p className="text-gray-300 font-clean text-sm sm:text-base leading-relaxed mb-4">
              We can help partners advise guests on where to stay in the Rovaniemi area and how
              lodging connects with hotel pickup for our tours. Detailed property contracts and
              rates are arranged case by case.
            </p>
            <Link
              to="/blog/where-to-stay-lapland-accommodation-guide"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline underline-offset-2"
            >
              Read our Lapland accommodation guide
            </Link>
            <p className="text-gray-500 text-xs mt-3 font-clean">
              Partner-specific accommodation inventory and contracting details available on request.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Compass className="text-emerald-400" size={22} />
              <h2 className="text-xl font-luxury font-bold text-white">Customized itineraries</h2>
            </div>
            <p className="text-gray-300 font-clean text-sm sm:text-base leading-relaxed mb-4">
              Build multi-activity programmes combining aurora hunting, daytime adventures, and
              private transfers. Tell us your guest profile, dates, and preferred pace — we reply
              with a workable outline.
            </p>
            <Link
              to="/customized-tour"
              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium underline underline-offset-2"
            >
              Request a customized tour
            </Link>
          </div>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-emerald-400" size={22} />
            <h2 className="text-2xl font-luxury font-bold text-white">Small groups & private tours</h2>
          </div>
          <p className="text-gray-300 font-clean text-sm sm:text-base leading-relaxed">
            Our products are designed around small groups and attentive guiding. Private departures
            and exclusive vehicle arrangements can be requested for agencies and VIP guests when
            capacity allows. Exact group limits vary by product and vehicle.
          </p>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h2 className="text-2xl font-luxury font-bold text-white mb-4">How partnerships work</h2>
          <ol className="space-y-3 text-gray-300 font-clean text-sm sm:text-base list-decimal list-inside leading-relaxed">
            <li>Send an enquiry with your company details and the products or dates you need.</li>
            <li>We confirm suitability, seasonal availability, and operational notes.</li>
            <li>Commercial terms (including any agency arrangements) are shared privately.</li>
            <li>We align on booking flow, guest communication, and pickup details.</li>
          </ol>
          <p className="text-gray-500 text-xs mt-4 font-clean">
            Commission rates and net rates are not published on this page — they are agreed
            directly with partners.
          </p>
        </section>

        <section id="partnership-enquiry" className="bg-white/5 border border-white/10 rounded-2xl p-5 sm:p-8">
          <h2 className="text-2xl font-luxury font-bold text-white mb-2">Partnership enquiry</h2>
          <p className="text-gray-400 font-clean text-sm mb-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                name="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
              <input
                name="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Company / agency"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Work email"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone (optional)"
                className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
              />
            </div>
            <textarea
              required
              name="message"
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about your agency, markets, and what you need (products, dates, group size)…"
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-lg min-h-[48px] transition-colors"
            >
              {isSubmitting ? 'Sending…' : 'Send partnership enquiry'}
            </button>
            {submitStatus === 'success' && (
              <p className="text-emerald-400 text-sm">Thank you — we will reply as soon as possible.</p>
            )}
            {submitStatus === 'error' && (
              <p className="text-red-400 text-sm">
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

      <Footer />
    </div>
  )
}

export default TravelTrade
