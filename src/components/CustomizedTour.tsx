import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import CategorySectionHeader from './CategorySectionHeader'
import Footer from './Footer'
import ExperienceAccordion from './experience/ExperienceAccordion'
import { buildCustomInquiryMessage } from '../lib/customInquiry'

const EXPERIENCES = [
  {
    title: 'Northern Lights experiences',
    description: 'Private aurora evenings, photography hunts, and small-group Northern Lights tours from Rovaniemi.',
    image: '/nortti1.jpg',
    imageAlt: 'Northern Lights over Finnish Lapland',
    to: '/northern-lights-tours',
  },
  {
    title: 'Private wilderness adventures',
    description: 'Canyon hikes, ice fishing, and guided days in Lapland’s quieter landscapes.',
    image: '/korouoma1.jpg',
    imageAlt: 'Korouoma Canyon winter landscape',
    to: '/daytime-experiences',
  },
  {
    title: 'Family experiences',
    description: 'Shorter evenings and daytime activities planned for mixed ages and a gentler pace.',
    image: '/family1.jpg',
    imageAlt: 'Family-friendly Lapland experience',
    to: '/family-friendly-northern-lights',
  },
  {
    title: 'Photography journeys',
    description: 'Aurora photography with professional guidance — including free photos on our Guaranteed tour.',
    image: '/nordicci1.jpg',
    imageAlt: 'Guests photographed under the Northern Lights',
    to: '/northern-lights-tour',
  },
  {
    title: 'Multi-day Lapland itineraries',
    description: 'Combine evenings, day tours, and transfers into one private schedule around your dates.',
    image: '/nordicci7.jpg',
    imageAlt: 'Couple walking under aurora in Lapland',
    to: '#inquiry',
  },
] as const

const STEPS = [
  {
    n: '01',
    title: 'Tell us your plans',
    text: 'Share your dates, group size and interests.',
  },
  {
    n: '02',
    title: 'We design your experience',
    text: 'Our local team prepares a tailored proposal.',
  },
  {
    n: '03',
    title: 'Enjoy Lapland your way',
    text: 'Confirm the details and experience your private journey.',
  },
] as const

const FAQ = [
  {
    title: 'Is payment required to send an inquiry?',
    content: 'No. This form is only a planning request. We reply with ideas and next steps — no payment is taken here.',
  },
  {
    title: 'What should I include in my message?',
    content:
      'Dates or a flexible window, group size, and what you hope to experience (aurora, day tours, family pace, photography, transfers). The more context you share, the clearer our proposal.',
  },
  {
    title: 'Who is this for?',
    content:
      'Couples, families, private groups, and travellers who want a Lapland itinerary built around their schedule rather than a fixed catalogue tour.',
  },
]

type FormState = {
  name: string
  email: string
  phone: string
  dates: string
  guests: string
  interests: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  phone: '',
  dates: '',
  guests: '',
  interests: '',
}

const CustomizedTour: React.FC = () => {
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

    const message = buildCustomInquiryMessage({
      dates: formData.dates,
      guests: formData.guests,
      interests: formData.interests,
    })

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
          message,
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'New Customized Tour Request - ROYAL NORDIC',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send request')
      }

      setSubmitStatus('success')
      setFormData(emptyForm)
      window.setTimeout(() => setSubmitStatus('idle'), 6000)
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
        title="Your Lapland. Your Experience."
        subtitle="Private journeys across Finnish Lapland, thoughtfully designed around your interests, schedule and group."
        image="/nordicci7.jpg"
        eyebrow="Royal Nordic · Private & custom"
        actions={
          <>
            <a href="#inquiry" className="rn-btn-primary min-h-[48px] px-7">
              Plan your private experience
            </a>
            <Link to="/northern-lights-tours" className="rn-btn-secondary min-h-[48px] px-6">
              View Northern Lights tours
            </Link>
          </>
        }
      />

      <section className="rn-section-follow" aria-labelledby="rn-private-exp-heading">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-60" aria-hidden />
        <div className="rn-container relative">
          <CategorySectionHeader
            eyebrow="Experiences we tailor"
            title="Customizable Lapland experiences"
            titleId="rn-private-exp-heading"
            lede="Built from the journeys we already run — aurora evenings, day adventures, family formats, and private multi-day schedules."
          />

          <div className="rn-private-exp-grid mt-7 sm:mt-8">
            {EXPERIENCES.map((item) => {
              const className = 'rn-private-exp-card group'
              const body = (
                <>
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
                </>
              )
              if (item.to.startsWith('#')) {
                return (
                  <a key={item.title} href={item.to} className={className}>
                    {body}
                  </a>
                )
              }
              return (
                <Link key={item.title} to={item.to} className={className}>
                  {body}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rn-section-band" aria-labelledby="rn-private-steps-heading">
        <div className="rn-container">
          <CategorySectionHeader
            eyebrow="How it works"
            title="How private planning works"
            titleId="rn-private-steps-heading"
          />
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
        id="inquiry"
        className="rn-section-tight border-t border-white/[0.06] bg-surface scroll-mt-[calc(var(--rn-chrome-h)+1rem)]"
        aria-labelledby="rn-inquiry-heading"
      >
        <div className="rn-container">
          <div className="rn-inquiry">
            <CategorySectionHeader
              eyebrow="Inquiry"
              title="Let's plan something extraordinary."
              titleId="rn-inquiry-heading"
              lede="Tell us what you have in mind. We'll create a personalized proposal for your time in Lapland. No payment is required to submit this inquiry."
            />

            <form onSubmit={handleSubmit} className="rn-inquiry-form mt-8" noValidate={false}>
              <div className="rn-inquiry-form__grid">
                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">Full name</span>
                  <input
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
                  <span className="rn-inquiry-field__label">Email</span>
                  <input
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    value={formData.email}
                    onChange={update('email')}
                    className="rn-inquiry-field__input"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">
                    Phone <span className="rn-inquiry-field__optional">optional</span>
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={update('phone')}
                    className="rn-inquiry-field__input"
                    placeholder="+358 …"
                  />
                </label>

                <label className="rn-inquiry-field">
                  <span className="rn-inquiry-field__label">
                    Preferred dates <span className="rn-inquiry-field__optional">optional</span>
                  </span>
                  <input
                    type="text"
                    name="dates"
                    value={formData.dates}
                    onChange={update('dates')}
                    className="rn-inquiry-field__input"
                    placeholder="e.g. 12–18 March, or flexible"
                  />
                </label>

                <label className="rn-inquiry-field rn-inquiry-field--full">
                  <span className="rn-inquiry-field__label">
                    Number of guests <span className="rn-inquiry-field__optional">optional</span>
                  </span>
                  <input
                    type="text"
                    name="guests"
                    value={formData.guests}
                    onChange={update('guests')}
                    className="rn-inquiry-field__input"
                    placeholder="e.g. 2 adults, 1 child"
                  />
                </label>

                <label className="rn-inquiry-field rn-inquiry-field--full">
                  <span className="rn-inquiry-field__label">Experience interests / special requests</span>
                  <textarea
                    name="interests"
                    required
                    rows={5}
                    value={formData.interests}
                    onChange={update('interests')}
                    className="rn-inquiry-field__input rn-inquiry-field__textarea"
                    placeholder="Aurora photography, family pace, wilderness days, transfers…"
                  />
                </label>
              </div>

              {submitStatus === 'success' ? (
                <p className="rn-inquiry-form__status rn-inquiry-form__status--ok" role="status">
                  Thank you — we received your inquiry and will reply with a personalized proposal.
                </p>
              ) : null}

              {submitStatus === 'error' ? (
                <p className="rn-inquiry-form__status rn-inquiry-form__status--err" role="alert">
                  Something went wrong. Please try again or email contact@royalnordic.fi.
                </p>
              ) : null}

              <div className="rn-inquiry-form__actions">
                <button type="submit" disabled={isSubmitting} className="rn-btn-primary min-h-[48px] px-8 disabled:opacity-55">
                  {isSubmitting ? 'Sending…' : 'Send inquiry'}
                </button>
                <p className="rn-inquiry-form__note">We reply personally. No payment on this form.</p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="rn-section-tight border-t border-white/[0.06] bg-midnight pb-6" aria-labelledby="rn-private-faq-heading">
        <div className="rn-container">
          <CategorySectionHeader title="Practical questions" titleId="rn-private-faq-heading" />
          <div className="mt-5 max-w-3xl">
            <ExperienceAccordion items={FAQ} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default CustomizedTour
