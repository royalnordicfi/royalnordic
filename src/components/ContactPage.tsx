import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import ContactForm from './ContactForm'
import Footer from './Footer'
import { CONTACT } from '../lib/contactInfo'

const LINKS = [
  {
    to: '/customized-tour',
    label: 'Private & Custom Tours',
    hint: 'Tailored itineraries',
  },
  {
    to: '/travel-trade',
    label: 'Partner With Us',
    hint: 'Agencies & hotels',
  },
] as const

const ContactPage = () => {
  return (
    <div className="rn-page">
      <CategoryHero
        title="Contact us"
        subtitle="Reach our Rovaniemi team by phone, email, or the form — for tours, bookings, and private planning."
        image="/nortti5.jpg"
        eyebrow="Royal Nordic · Contact"
      />

      <section
        className="rn-section-follow"
        aria-labelledby="rn-contact-heading"
      >
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-55" aria-hidden />
        <div className="rn-container relative">
          <h2 id="rn-contact-heading" className="sr-only">
            Contact details and message form
          </h2>

          <div className="rn-contact">
            <aside className="rn-contact__aside">
              <p className="rn-eyebrow">Direct contact</p>

              <ul className="rn-contact__channels mt-5">
                <li className="rn-contact__channel">
                  <span className="rn-contact__channel-label">Phone</span>
                  <a href={CONTACT.phoneHref} className="rn-contact__channel-value">
                    {CONTACT.phoneDisplay}
                  </a>
                </li>
                <li className="rn-contact__channel">
                  <span className="rn-contact__channel-label">Email</span>
                  <a href={CONTACT.emailHref} className="rn-contact__channel-value">
                    {CONTACT.email}
                  </a>
                </li>
                <li className="rn-contact__channel">
                  <span className="rn-contact__channel-label">Location</span>
                  <span className="rn-contact__channel-value rn-contact__channel-value--muted">
                    {CONTACT.location}
                  </span>
                </li>
              </ul>

              <div className="mt-8 sm:mt-9">
                <p className="rn-eyebrow">Also useful</p>
                <ul className="rn-contact__nav mt-3">
                  {LINKS.map((item) => (
                    <li key={item.to} className="rn-contact__nav-item">
                      <Link to={item.to} className="rn-contact__nav-link">
                        <span>{item.label}</span>
                        <span className="rn-contact__nav-hint">{item.hint}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            <div className="rn-contact__form">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default ContactPage
