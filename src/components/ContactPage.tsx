import { Link } from 'react-router-dom'
import { Mail, Phone } from 'lucide-react'
import CategoryHero from './CategoryHero'
import ContactForm from './ContactForm'
import Footer from './Footer'
import { CONTACT } from '../lib/contactInfo'

const TOPICS = [
  {
    title: 'General questions',
    text: 'Tour details, timing, pickup areas, and planning a stay around Rovaniemi.',
  },
  {
    title: 'Existing bookings',
    text: 'Changes, pickup confirmation, or anything about a booking you already hold.',
  },
  {
    title: 'Private & custom',
    text: 'Tailored itineraries, private groups, and multi-day programmes.',
  },
  {
    title: 'Travel trade',
    text: 'Agency, DMC, hotel, and concierge partnerships — or use Partner With Us.',
  },
]

const ContactPage = () => {
  return (
    <div className="rn-page flex min-h-screen flex-col">
      <CategoryHero
        title="Contact Royal Nordic"
        subtitle="Phone, email, or the form — for general questions, existing bookings, private tours, and partner enquiries."
        image="/nortti5.jpg"
        compact
      />

      <main className="rn-section-tight rn-hero-follow relative flex-1 bg-midnight pt-0 pb-14 sm:pb-16">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-70" aria-hidden />
        <div className="rn-container relative z-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 lg:items-start">
            <div className="space-y-8 lg:col-span-4">
              <div>
                <p className="rn-eyebrow">Direct lines</p>
                <ul className="mt-4 space-y-3 text-sm">
                  <li>
                    <a
                      href={CONTACT.phoneHref}
                      className="inline-flex items-center gap-2.5 text-white transition hover:text-aurora-soft"
                    >
                      <Phone className="h-4 w-4 text-aurora-soft" aria-hidden />
                      {CONTACT.phoneDisplay}
                    </a>
                  </li>
                  <li>
                    <a
                      href={CONTACT.emailHref}
                      className="inline-flex items-center gap-2.5 text-white transition hover:text-aurora-soft"
                    >
                      <Mail className="h-4 w-4 text-aurora-soft" aria-hidden />
                      {CONTACT.email}
                    </a>
                  </li>
                  <li className="pl-6 text-text-muted">{CONTACT.location}</li>
                </ul>
              </div>

              <div>
                <p className="rn-eyebrow">What we can help with</p>
                <ul className="mt-4 space-y-0">
                  {TOPICS.map((item) => (
                    <li key={item.title} className="border-t border-white/[0.08] py-3.5 first:border-t-0 first:pt-0">
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-text-muted">{item.text}</p>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-text-muted">
                Travel agencies and hotels:{' '}
                <Link to="/travel-trade" className="text-aurora-soft hover:underline">
                  Partner With Us
                </Link>
              </p>
            </div>

            <div className="lg:col-span-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default ContactPage
