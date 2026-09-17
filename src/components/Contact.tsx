import React, { useState } from 'react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tour: '',
    message: '',
  })

  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
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
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        tour: '',
        message: '',
      })

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 5000)
    } catch (err) {
      console.error('Error sending message:', err)
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again or contact us directly.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30'

  return (
    <section id="contact" className="rn-section-tight border-t border-white/10 bg-midnight">
      <div className="rn-container">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="rn-eyebrow">Contact</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Questions before you book?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Reach our Rovaniemi team by phone, email, or the form. We usually reply within a couple
              of hours during the day.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <p>
                <span className="text-text-dim">Phone </span>
                <a className="text-white hover:text-aurora-soft" href="tel:+3584578345138">
                  +358 45 78345138
                </a>
              </p>
              <p>
                <span className="text-text-dim">Email </span>
                <a className="text-white hover:text-aurora-soft" href="mailto:contact@royalnordic.fi">
                  contact@royalnordic.fi
                </a>
              </p>
              <p className="text-text-muted">Rovaniemi, Finnish Lapland</p>
            </div>
          </div>

          <div className="rn-panel p-5 sm:p-6 lg:col-span-8">
            <h3 className="text-base font-semibold text-panel-ink">Send a message</h3>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
              <div className="grid gap-3.5 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-panel-ink">
                    Full name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-panel-ink">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="you@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="mb-1 block text-sm font-medium text-panel-ink">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="+358 …"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-1 block text-sm font-medium text-panel-ink">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className={inputClass}
                  placeholder="Dates, group size, or questions about a tour…"
                />
              </div>

              {submitError && <p className="text-sm text-red-600">{submitError}</p>}
              {showSuccess && (
                <p className="text-sm text-emerald-700">Message sent. We’ll get back to you soon.</p>
              )}

              <button type="submit" disabled={isSubmitting} className="rn-btn-panel">
                {isSubmitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
