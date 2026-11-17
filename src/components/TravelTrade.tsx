import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const EXPERIENCES = [
  {
    title: 'Northern Lights Experiences',
    description:
      'Guaranteed, family-friendly, and private aurora tours from Rovaniemi — ready to recommend or book for your clients.',
    image: '/nortti1.jpg',
    imageAlt: 'Northern Lights over Finnish Lapland',
    to: '/northern-lights-tours',
  },
  {
    title: 'Daytime Lapland Adventures',
    description:
      'Ice fishing, wildlife parks, canyon days and seasonal adventures that fit neatly into a Lapland itinerary.',
    image: '/korouoma1.jpg',
    imageAlt: 'Winter day tour in Finnish Lapland',
    to: '/daytime-experiences',
  },
  {
    title: 'Private & Customized Tours',
    description:
      'Tailored programmes for private groups and travellers who need a schedule built around their brief.',
    image: '/nordicci7.jpg',
    imageAlt: 'Private Lapland experience under the aurora',
    to: '/customized-tour',
  },
  {
    title: 'Private Transportation',
    description:
      'Door-to-door transfers across Lapland resorts and airports, including fixed routes and custom arrangements.',
    image: '/royal-trans-1.jpg',
    imageAlt: 'Private transfer vehicle in Finnish Lapland',
    to: '/transportation',
  },
] as const

const BENEFITS = [
  {
    title: 'Local Expertise',
    text: "Rovaniemi-based operations with knowledge of Lapland's experiences and conditions.",
  },
  {
    title: 'Flexible Arrangements',
    text: 'Support for individual travellers, private groups and customized programmes, subject to operational availability.',
  },
  {
    title: 'Direct Communication',
    text: 'Coordinate booking details, pickup arrangements and group requirements directly with our team.',
  },
] as const

const STEPS = [
  {
    n: '01',
    title: 'Tell us about your business',
    text: 'Share your agency details, client markets and requirements.',
  },
  {
    n: '02',
    title: 'Agree on the arrangements',
    text: 'We discuss suitable experiences, availability, commercial terms and booking procedures.',
  },
  {
    n: '03',
    title: 'Start working together',
    text: 'Coordinate your first enquiries and bookings with our team.',
  },
] as const

type FormState = {
  name: string
  company: string
  email: string
  phone: string
  message: string
}

const emptyForm: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  message: '',
}

const TravelTrade: React.FC = () => {
  const [formData, setFormData] = useState<FormState>(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const update = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
  }

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
      setFormData(emptyForm)
      window.setTimeout(() => setSubmitStatus('idle'), 6000)
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rn-page">
      <CategoryHero
        title="Your Local Experience Partner in Finnish Lapland"
        subtitle="Partner with Royal Nordic to bring unforgettable Arctic experiences to your clients — from Northern Lights adventures to private tours and tailored group arrangements."
        image="/nortti5.jpg"
        compact
        eyebrow="Royal Nordic · Travel trade"
        actions={
          <>
            <a href="#partnership-enquiry" className="rn-btn-primary min-h-[48px] px-7">
              Become a Partner
            </a>
            <a href="#experiences" className="rn-btn-secondary min-h-[48px] px-6">
              Explore Our Experiences
            </a>
          </>
        }
      />

      <section
        id="experiences"
        className="rn-section-tight rn-hero-follow relative scroll-mt-[calc(var(--rn-chrome-h)+1rem)] pt-0 pb-10 sm:pb-12"
        aria-labelledby="rn-trade-exp-heading"
      >
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-60" aria-hidden />
        <div className="rn-container relative">
          <header className="max-w-rn-measure">
            <p className="rn-eyebrow">Experience catalogue</p>
            <h2 id="rn-trade-exp-heading" className="rn-h2-tight mt-2 text-white">
              Experiences your clients can enjoy
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-text-muted">
              Premium Lapland products with clear public pages — ready to share with agencies, DMCs, hotels and
              concierge teams.
            </p>
          </header>

          <div className="rn-private-exp-grid rn-private-exp-grid--four mt-7 sm:mt-8">
            {EXPERIENCES.map((item) => (
              <Link key={item.to} to={item.to} className="rn-private-exp-card group">
                <div className="rn-private-exp-card__media">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    className="rn-private-exp-card__img"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = '/nortti1.jpg'
                    }}
                  />
                  <div className="rn-private-exp-card__shade" aria-hidden />
                </div>
                <div className="rn-private-exp-card__body">
                  <h3 className="rn-private-exp-card__title">{item.title}</h3>
                  <p className="rn-private-exp-card__desc">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/[0.06] bg-midnight py-10 sm:py-12"
        aria-labelledby="rn-trade-why-heading"
      >
        <div className="rn-container">
          <header className="max-w-rn-measure">
            <p className="rn-eyebrow">Why partner with us</p>
            <h2 id="rn-trade-why-heading" className="rn-h2-tight mt-2 text-white">
              Built for professional travel partners
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-text-muted">
              We work with travel agencies, international tour operators, DMCs, hotels and concierge services
              looking for a reliable local partner in Rovaniemi.
            </p>
          </header>

          <ul className="rn-transfer-benefits mt-8">
            {BENEFITS.map((item) => (
              <li key={item.title} className="rn-transfer-benefits__item">
                <h3 className="rn-transfer-benefits__title">{item.title}</h3>
                <p className="rn-transfer-benefits__text">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rn-section-tight border-t border-white/[0.06] bg-midnight" aria-labelledby="rn-trade-mid-cta">
        <div className="rn-container">
          <div className="rn-page-end">
            <h2 id="rn-trade-mid-cta" className="rn-h2-tight text-white">
              Ready to discuss a partnership?
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-text-muted">
              Share a little about your business and the experiences your clients need. We&apos;ll follow up with
              next steps.
            </p>
            <div className="mt-5 flex flex-col gap-3.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
              <a href="#partnership-enquiry" className="rn-btn-primary min-h-[48px] justify-center px-7">
                Become a Partner
              </a>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link to="/northern-lights-tours" className="rn-page-end__link">
                  Northern Lights
                </Link>
                <Link to="/daytime-experiences" className="rn-page-end__link">
                  Day Tours
                </Link>
                <Link to="/transportation" className="rn-page-end__link">
                  Transfers
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/[0.06] bg-midnight py-10 sm:py-12"
        aria-labelledby="rn-trade-steps-heading"
      >
        <div className="rn-container">
          <header className="max-w-rn-measure">
            <p className="rn-eyebrow">How cooperation works</p>
            <h2 id="rn-trade-steps-heading" className="rn-h2-tight mt-2 text-white">
              A clear path to working together
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-text-muted">
              Commercial terms stay private. We agree rates, booking flow and communication directly with each
              partner.
            </p>
          </header>

          <ol className="rn-private-steps mt-8">
            {STEPS.map((step) => (
              <li key={step.n} className="rn-private-steps__item">
                <span className="rn-private-steps__n" aria-hidden>
                  {step.n}
                </span>
                <div>
                  <h3 className="rn-private-steps__title">{step.title}</h3>
                  <p className="rn-private-steps__text">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="partnership-enquiry"
        className="rn-section-tight border-t border-white/[0.06] bg-surface scroll-mt-[calc(var(--rn-chrome-h)+1rem)]"
        aria-labelledby="rn-trade-enquiry-heading"
      >
        <div className="rn-container">
          <div className="rn-inquiry">
            <header className="max-w-rn-measure">
              <p className="rn-eyebrow">Partnership enquiry</p>
              <h2 id="rn-trade-enquiry-heading" className="rn-h2 mt-2 text-white">
                Let&apos;s Build Something Together
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-text-muted">
                Tell us a little about your business and what you&apos;re looking for. Our team will be happy to
                discuss a potential partnership. Prefer email? Write to{' '}
                <a href="mailto:contact@royalnordic.fi" className="font-medium text-aurora-soft hover:underline">
                  contact@royalnordic.fi
                </a>{' '}
                or call{' '}
                <a href="tel:+3584578345138" className="font-medium text-aurora-soft hover:underline">
                  +358 45 78345138
                </a>
                .
              </p>
            </header>

            <form onSubmit={handleSubmit} className="rn-inquiry-form mt-8">
              <div className="rn-inquiry-form__grid">
                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">Full name</span>
                  <input
                    id="tt-name"
                    type="text"
                    name="name"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={update('name')}
                    className="rn-inquiry-field__input"
                    placeholder="Your full name"
                  />
                </label>

                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">Company / agency</span>
                  <input
                    id="tt-company"
                    type="text"
                    name="company"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={update('company')}
                    className="rn-inquiry-field__input"
                    placeholder="Agency, DMC or hotel"
                  />
                </label>

                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">Work email</span>
                  <input
                    id="tt-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={update('email')}
                    className="rn-inquiry-field__input"
                    placeholder="you@agency.com"
                  />
                </label>

                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">
                    Phone <span className="rn-inquiry-field__optional">optional</span>
                  </span>
                  <input
                    id="tt-phone"
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={update('phone')}
                    className="rn-inquiry-field__input"
                    placeholder="+358 …"
                  />
                </label>

                <label className="rn-inquiry-field rn-inquiry-field--full">
                  <span className="rn-inquiry-field__label">Partnership requirements / message</span>
                  <textarea
                    id="tt-message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={update('message')}
                    className="rn-inquiry-field__input rn-inquiry-field__textarea"
                    placeholder="Markets, products, dates, group size, and how you prefer to book…"
                  />
                </label>
              </div>

              {submitStatus === 'success' ? (
                <p className="rn-inquiry-form__status rn-inquiry-form__status--ok" role="status">
                  Thank you — check your email for confirmation. We will reply soon.
                </p>
              ) : null}

              {submitStatus === 'error' ? (
                <p className="rn-inquiry-form__status rn-inquiry-form__status--err" role="alert">
                  Something went wrong. Please email contact@royalnordic.fi directly.
                </p>
              ) : null}

              <div className="rn-inquiry-form__actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rn-btn-primary min-h-[48px] px-8 disabled:opacity-55"
                >
                  {isSubmitting ? 'Sending…' : 'Send Partnership Enquiry'}
                </button>
                <p className="rn-inquiry-form__note">We reply personally. Commercial terms are discussed privately.</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default TravelTrade
