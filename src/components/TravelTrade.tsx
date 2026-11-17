import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CategoryPageEnd from './CategoryPageEnd'
import Footer from './Footer'
import PartnerApplicationForm from '../account/partners/PartnerApplicationForm'
import { RewardsAuthProvider, useRewardsAuth } from '../rewards/RewardsAuthContext'
import { fetchPartnerAccess, type PartnerAccess } from '../account/partnerAccess'
import { CONTACT } from '../lib/contactInfo'

const TRUST = [
  { title: 'Trusted local operator', text: 'Rovaniemi-based team' },
  { title: 'Wide range of experiences', text: 'Aurora, day tours, private' },
  { title: 'Dedicated partner support', text: 'Direct coordination' },
] as const

const BENEFITS = [
  {
    title: 'Authentic Lapland experiences',
    text: 'Northern Lights evenings, daytime adventures, private programmes and transfers — ready to recommend to your clients.',
  },
  {
    title: 'Reliable operations',
    text: 'Professional local guides and clear operational standards for the Arctic season.',
  },
  {
    title: 'Flexible cooperation',
    text: 'Built for travel agencies, DMCs, hotels and concierge teams — commercial terms agreed privately.',
  },
  {
    title: 'Partner support',
    text: 'Coordinate bookings, pickups and group needs directly with our Rovaniemi team.',
  },
] as const

const PORTAL_NAV = ['Overview', 'Bookings', 'Availability', 'Company'] as const

function TravelTradeInner() {
  const location = useLocation()
  const { isSignedIn, loading, user } = useRewardsAuth()
  const [partner, setPartner] = useState<PartnerAccess>('none')

  useEffect(() => {
    if (!isSignedIn) {
      setPartner('none')
      return
    }
    void fetchPartnerAccess().then((r) => setPartner(r.access))
  }, [isSignedIn, user?.id])

  useEffect(() => {
    const id = location.hash.replace(/^#/, '')
    if (!id) return
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(t)
  }, [location.hash, location.pathname])

  const signInTo =
    !loading && isSignedIn && partner === 'approved'
      ? '/partners/dashboard'
      : !loading && isSignedIn && partner === 'pending'
        ? '/partners/status'
        : '/account/signin?intent=partners'

  const signInLabel =
    !loading && isSignedIn && partner === 'approved'
      ? 'Open partner dashboard'
      : !loading && isSignedIn && partner === 'pending'
        ? 'View application status'
        : 'Partner Sign In'

  return (
    <div className="rn-page rn-partner-landing">
      <section className="rn-partner-hero relative flex items-end overflow-hidden">
        <img
          src="/nortti5.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          fetchPriority="high"
          onError={(e) => {
            e.currentTarget.src = '/nortti1.jpg'
          }}
        />
        <div className="rn-partner-hero__veil" aria-hidden />
        <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36" aria-hidden />

        <div className="rn-container relative z-10 w-full pb-10 pt-[calc(var(--rn-chrome-h)+1.5rem)] sm:pb-12 sm:pt-[calc(var(--rn-chrome-h)+1.75rem)] lg:pb-14">
          <p className="rn-eyebrow rn-reveal text-aurora-soft">Travel trade · Partners</p>
          <h1 className="rn-partner-hero__title rn-reveal mt-3 max-w-[16ch] font-display font-semibold text-white">
            Partner with Royal Nordic
          </h1>
          <p className="rn-reveal mt-4 max-w-xl text-[15px] leading-relaxed text-white/78 sm:mt-5 sm:text-[16.5px] sm:leading-[1.6]">
            Work with a trusted local operator in Rovaniemi — Northern Lights, daytime experiences,
            private itineraries and transfers for your clients.
          </p>

          <ul className="rn-partner-trust rn-reveal mt-7 sm:mt-8" aria-label="Why partners choose us">
            {TRUST.map((item) => (
              <li key={item.title} className="rn-partner-trust__item">
                <span className="rn-partner-trust__dot" aria-hidden />
                <span>
                  <span className="rn-partner-trust__title">{item.title}</span>
                  <span className="rn-partner-trust__text">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="rn-reveal mt-8 flex flex-wrap items-center gap-3">
            <a href="#apply" className="rn-btn-primary min-h-[48px] px-7 sm:px-8">
              Become a Partner
            </a>
            <Link to={signInTo} className="rn-btn-secondary min-h-[48px] px-6">
              {signInLabel}
            </Link>
            <a
              href="#portal"
              className="inline-flex min-h-[48px] items-center px-2 text-sm font-medium text-white/75 transition hover:text-white"
            >
              About the partner portal
            </a>
          </div>
        </div>
      </section>

      <section
        className="rn-section-follow relative scroll-mt-[calc(var(--rn-chrome-h)+1rem)]"
        aria-labelledby="rn-partner-main-heading"
      >
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-45" aria-hidden />
        <div className="rn-container relative">
          <h2 id="rn-partner-main-heading" className="sr-only">
            Partner portal preview and application
          </h2>

          <div className="rn-partner-split">
            <div className="rn-partner-split__main space-y-12 sm:space-y-14">
              <div id="portal" className="scroll-mt-[calc(var(--rn-chrome-h)+1rem)]">
                <p className="rn-eyebrow">Partner Portal</p>
                <h3 className="rn-h2-tight mt-2.5 text-white">Your partner workspace</h3>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-muted">
                  A dedicated portal for approved partners — booking tools, availability and company
                  details. Launching soon; access opens only after Royal Nordic approval.
                </p>

                <div className="rn-partner-portal rn-reveal mt-7 sm:mt-8">
                  <div className="rn-partner-portal__badge">
                    <span className="rn-partner-portal__badge-dot" aria-hidden />
                    Launching soon
                  </div>
                  <div className="rn-partner-portal__window" aria-hidden>
                    <div className="rn-partner-portal__chrome">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="rn-partner-portal__body">
                      <aside className="rn-partner-portal__nav">
                        <p className="rn-partner-portal__brand">Partners</p>
                        <ul>
                          {PORTAL_NAV.map((item, i) => (
                            <li key={item} className={i === 0 ? 'is-active' : undefined}>
                              {item}
                              {i > 0 ? <em>Soon</em> : null}
                            </li>
                          ))}
                        </ul>
                      </aside>
                      <div className="rn-partner-portal__content">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                          Overview
                        </p>
                        <p className="mt-2 font-display text-lg font-semibold text-white">
                          Partner dashboard
                        </p>
                        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-text-muted">
                          Manage company details today. Bookings, availability and reports arrive with
                          the portal launch — not exposed before approval.
                        </p>
                        <div className="rn-partner-portal__tiles">
                          {['Bookings', 'Availability', 'Reports'].map((label) => (
                            <div key={label} className="rn-partner-portal__tile">
                              <span>{label}</span>
                              <em>Coming soon</em>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="rn-eyebrow">Why partner with us</p>
                <h3 className="rn-h2-tight mt-2.5 text-white">Built for professional travel partners</h3>
                <ul className="rn-partner-benefits mt-7 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
                  {BENEFITS.map((item) => (
                    <li key={item.title} className="rn-partner-benefits__item rn-reveal">
                      <span className="rn-partner-benefits__mark" aria-hidden />
                      <div>
                        <h4 className="rn-partner-benefits__title">{item.title}</h4>
                        <p className="rn-partner-benefits__text">{item.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside
              id="apply"
              className="rn-partner-split__aside scroll-mt-[calc(var(--rn-chrome-h)+1rem)]"
            >
              <div className="rn-partner-apply-panel">
                <PartnerApplicationForm embedded />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section
        className="border-t border-white/[0.06] bg-midnight/50 py-12 sm:py-14"
        aria-labelledby="rn-partner-contact-heading"
      >
        <div className="rn-container">
          <div className="rn-partner-contact">
            <div>
              <p className="rn-eyebrow">Contact</p>
              <h2 id="rn-partner-contact-heading" className="rn-h2-tight mt-2.5 text-white">
                Prefer to talk first?
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-text-muted">
                Reach our Rovaniemi team for partnership questions. Commercial terms stay private.
              </p>
            </div>
            <ul className="rn-partner-contact__channels">
              <li>
                <span className="rn-partner-contact__label">Email</span>
                <a href={CONTACT.emailHref} className="rn-partner-contact__value">
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <span className="rn-partner-contact__label">Phone</span>
                <a href={CONTACT.phoneHref} className="rn-partner-contact__value">
                  {CONTACT.phoneDisplay}
                </a>
              </li>
              <li>
                <span className="rn-partner-contact__label">Location</span>
                <span className="rn-partner-contact__value rn-partner-contact__value--muted">
                  {CONTACT.location}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <CategoryPageEnd
        title="Ready to partner?"
        lede="Submit an application today. Access and trade rates open only after Royal Nordic approval."
        links={[
          { to: '#apply', label: 'Become a Partner', primary: true },
          { to: signInTo, label: signInLabel },
          { to: '/northern-lights-tours', label: 'Northern Lights' },
          { to: '/contact', label: 'Contact' },
        ]}
      />

      <Footer />
    </div>
  )
}

const TravelTrade = () => (
  <RewardsAuthProvider>
    <TravelTradeInner />
  </RewardsAuthProvider>
)

export default TravelTrade
