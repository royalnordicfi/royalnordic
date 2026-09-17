import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tour: '',
    message: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Send email using Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Clear form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        tour: '',
        message: ''
      });

      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

    } catch (err) {
      console.error('Error sending message:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to send message. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30';

  return (
    <section id="contact" className="rn-section border-t border-white/10 bg-midnight">
      <div className="rn-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="rn-eyebrow">Contact</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            Questions before you book?
          </h2>
          <p className="rn-lede mx-auto mt-3">
            Reach our Rovaniemi team by phone, email, or the form below. We usually reply within a
            couple of hours during the day.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="rounded-rn border border-white/10 bg-surface p-6 lg:col-span-1">
            <h3 className="font-display text-xl font-semibold text-white">Get in touch</h3>

            <div className="mt-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora/15 text-aurora-soft">
                  <Phone className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Phone</h4>
                  <p className="mt-0.5 text-sm text-text-muted">+358 45 78345138</p>
                  <p className="text-xs text-text-dim">24/7 for urgent tour-day issues</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora/15 text-aurora-soft">
                  <Mail className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Email</h4>
                  <p className="mt-0.5 text-sm text-text-muted">contact@royalnordic.fi</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora/15 text-aurora-soft">
                  <MapPin className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Location</h4>
                  <p className="mt-0.5 text-sm text-text-muted">Rovaniemi, Finnish Lapland</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rn-panel p-6 shadow-rn-soft lg:col-span-2 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-panel-ink">Send a message</h3>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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

              <button type="submit" disabled={isSubmitting} className="rn-btn-primary w-full">
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send message
                    <Send className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </form>

            {submitError && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/30 p-3 text-center text-sm text-red-300">
                <p className="font-semibold">Could not send your message</p>
                <p className="mt-1">{submitError}</p>
                <p className="mt-2 text-xs text-red-400/90">
                  Try again or email contact@royalnordic.fi directly.
                </p>
              </div>
            )}

            {showSuccess && (
              <div className="mt-4 rounded-lg border border-aurora/30 bg-aurora/10 p-3 text-center text-sm text-aurora-soft">
                <p className="font-semibold text-panel-ink">Message sent</p>
                <p className="text-panel-muted">We will get back to you as soon as we can.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
