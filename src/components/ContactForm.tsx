import React, { useState } from 'react'
import { CONTACT_TOPICS, contactTopicLabel, type ContactTopic } from '../lib/contactInfo'

type ContactFormProps = {
  /** Compact homepage panel vs fuller page form */
  compact?: boolean
  className?: string
  defaultTopic?: ContactTopic
}

const ContactForm: React.FC<ContactFormProps> = ({
  compact = false,
  className = '',
  defaultTopic = 'general',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: defaultTopic,
    message: '',
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setShowSuccess(false)

    const topicLabel = contactTopicLabel(formData.topic)
    const messageWithTopic = `Topic: ${topicLabel}\n\n${formData.message.trim()}`

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          topic: formData.topic,
          topicLabel,
          message: messageWithTopic,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          typeof result.error === 'string' ? result.error : 'Failed to send message'
        )
      }

      setFormData({
        name: '',
        email: '',
        phone: '',
        topic: defaultTopic,
        message: '',
      })
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 6000)
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to send message. Please try again or email us directly.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'rn-form-input'
  const idPrefix = compact ? 'home-contact' : 'page-contact'

  return (
    <div className={`rn-panel ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'} ${className}`}>
      <h3 className={`font-semibold text-panel-ink ${compact ? 'text-base' : 'font-display text-xl'}`}>
        Send a message
      </h3>
      <p className="mt-1.5 text-sm text-panel-muted">
        General questions, existing bookings, private tours, and partner enquiries.
      </p>

      <form onSubmit={handleSubmit} className={`mt-5 space-y-4 ${compact ? '' : 'sm:space-y-5'}`}>
        <div className="grid gap-3.5 md:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-name`} className="rn-form-label">
              Full name *
            </label>
            <input
              type="text"
              id={`${idPrefix}-name`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              autoComplete="name"
              className={inputClass}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-email`} className="rn-form-label">
              Email *
            </label>
            <input
              type="email"
              id={`${idPrefix}-email`}
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="you@email.com"
            />
          </div>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-phone`} className="rn-form-label">
              Phone
            </label>
            <input
              type="tel"
              id={`${idPrefix}-phone`}
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              autoComplete="tel"
              className={inputClass}
              placeholder="+358 …"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-topic`} className="rn-form-label">
              Topic *
            </label>
            <select
              id={`${idPrefix}-topic`}
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              required
              className={inputClass}
            >
              {CONTACT_TOPICS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-message`} className="rn-form-label">
            Message *
          </label>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={compact ? 4 : 5}
            className={inputClass}
            placeholder="Dates, booking reference, group size, or partnership details…"
          />
        </div>

        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        {showSuccess ? (
          <p className="text-sm text-emerald-700">Message sent. We’ll get back to you soon.</p>
        ) : null}

        <button type="submit" disabled={isSubmitting} className="rn-btn-panel">
          {isSubmitting ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}

export default ContactForm
