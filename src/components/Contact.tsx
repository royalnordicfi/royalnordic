import { Link } from 'react-router-dom'
import { CONTACT } from '../lib/contactInfo'
import ContactForm from './ContactForm'

/** Homepage contact / get-in-touch — final substantive section before footer. */
const Contact = () => {
  return (
    <section id="contact" className="rn-section relative border-t border-white/[0.07] bg-midnight">
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-50" aria-hidden />
      <div className="rn-container relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
          <div className="lg:col-span-4">
            <p className="rn-eyebrow">Get in touch</p>
            <h2 className="mt-2.5 font-display text-2xl font-semibold text-white sm:text-[1.75rem]">
              Questions before you book?
            </h2>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-text-muted">
              Reach our Rovaniemi team by phone, email, or the form — for tour questions, existing
              bookings, private itineraries, and partner enquiries.
            </p>

            <div className="mt-7 space-y-3 text-sm">
              <p>
                <span className="text-text-dim">Phone </span>
                <a className="text-white transition hover:text-aurora-soft" href={CONTACT.phoneHref}>
                  {CONTACT.phoneDisplay}
                </a>
              </p>
              <p>
                <span className="text-text-dim">Email </span>
                <a className="text-white transition hover:text-aurora-soft" href={CONTACT.emailHref}>
                  {CONTACT.email}
                </a>
              </p>
              <p className="text-text-muted">{CONTACT.location}</p>
            </div>

            <Link to="/contact" className="rn-btn-secondary mt-7 inline-flex">
              Contact page
            </Link>
          </div>

          <div className="lg:col-span-8">
            <ContactForm compact />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
