import { Link } from 'react-router-dom'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BokunExperienceCalendar from './bokun/BokunExperienceCalendar'
import RnPromoCodeCard from './bokun/RnPromoCodeCard'
import SalePrice from './SalePrice'
import {
  BOKUN_SNOWMOBILE_EXPERIENCE_ID,
  RN_SNOWMOBILE_PROMO,
} from '../lib/bokun'

const GALLERY = [
  {
    src: '/snowmobiling1.jpg',
    alt: 'Snowmobile riders on a snowy trail through Arctic forest near Rovaniemi',
  },
  {
    src: '/snowmobiling5.jpg',
    alt: 'Guided snowmobile safari across open Lapland winter landscape',
  },
  {
    src: '/snowmobiling.jpg',
    alt: 'Arctic snowmobile adventure in Finnish Lapland',
  },
  {
    src: '/snowmobiling2.jpg',
    alt: 'Snowmobiles parked in deep snow during a wilderness stop',
  },
  {
    src: '/snowmobiling3.jpg',
    alt: 'Travellers enjoying a snowmobile safari in Rovaniemi',
  },
  {
    src: '/snowmobiling4.jpg',
    alt: 'Winter forest trail on a guided Lapland snowmobile tour',
  },
  {
    src: '/snowmobiling6.jpg',
    alt: 'Snowmobile convoy through snow-covered trees in Lapland',
  },
]

const BENEFITS = [
  '~75 minutes of guided driving',
  'Two adults per snowmobile',
  'Thermal clothing & helmet included',
  'Hot berry juice & cookies',
  'Return transfers by the operator',
]

const HIGHLIGHTS = [
  'Guided ride through Rovaniemi’s Arctic forests',
  'About 75 minutes of snowmobile driving',
  'Safety briefing and driving instruction',
  'Thermal gear provided',
  'Warm refreshment stop on the route',
]

const INCLUDED = [
  'Guided safari with local guide',
  '~75 minutes of driving',
  'Shared snowmobile (two adults)',
  'Thermal overalls, boots, gloves, balaclava, helmet',
  'Hot berry juice and cookies',
  'Return transfers',
]

const NOT_INCLUDED = [
  `Single-driver supplement (€${RN_SNOWMOBILE_PROMO.singleDriverSupplement}, where available)`,
  'Personal purchases',
]

const scrollToBook = () => {
  document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Partner snowmobile safari — marketed by Royal Nordic, operated by Lapland Legacy.
 * Booking and payment run entirely in the Bókun widget (no Stripe for this product).
 */
const SnowmobileSafari = () => {
  const { adultRegular, adultWithCode, code, percent } = RN_SNOWMOBILE_PROMO

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Arctic Snowmobile Safari' },
        ]}
        eyebrow="Rovaniemi · Lapland Legacy"
        title="Arctic Snowmobile Safari"
        lede="Guided wilderness ride through snowy forests near Rovaniemi — about 75 minutes of driving, gear included."
        benefits={BENEFITS}
        proof={
          <p>
            Exclusive −{percent}% with code <strong className="text-aurora-soft">{code}</strong>
          </p>
        }
        heroAction={
          <>
            <button type="button" onClick={scrollToBook} className="rn-btn-primary min-h-[48px] px-8">
              Check availability
            </button>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-text-muted">
              <span className="rn-tour-card__was text-[1.05rem]">€{adultRegular}</span>
              <span className="font-display text-xl font-semibold text-[var(--rn-sale)]">
                €{adultWithCode.toFixed(2)}
              </span>
              <span>/ adult · {code}</span>
            </div>
          </>
        }
        images={GALLERY}
        afterGallery={
          <aside className="rn-notice" role="note">
            <p className="rn-notice__label">To drive</p>
            <p className="rn-notice__text">
              A valid Category B driving licence accepted in Finland is required. Guests without a
              licence may join as passengers. Two adults normally share one snowmobile.
            </p>
          </aside>
        }
        facts={[
          { label: 'Total time', value: 'About 2.5 hours' },
          { label: 'Driving', value: '~75 minutes' },
          { label: 'Group', value: '2 per sled' },
          { label: 'Transfers', value: 'Included' },
        ]}
        booking={
          <div className="rn-book-panel-light rn-book-signature rn-book-aside">
            <div className="rn-book-aside__summary">
              <SalePrice
                current={adultWithCode}
                reference={adultRegular}
                note={`/ adult with ${code}`}
                size="sm"
                tone="light"
                compact
                showBadge
                saveAsPercent
              />
              <ul className="rn-book-aside__trust" aria-label="Booking reassurances">
                <li>
                  <span className="rn-book-aside__trust-mark" aria-hidden>
                    ✓
                  </span>
                  <span>Secure Bókun checkout</span>
                </li>
                <li>
                  <span className="rn-book-aside__trust-mark" aria-hidden>
                    ✓
                  </span>
                  <span>Gear included</span>
                </li>
                <li>
                  <span className="rn-book-aside__trust-mark" aria-hidden>
                    ✓
                  </span>
                  <span>Local guide</span>
                </li>
              </ul>
            </div>
            <div className="rn-book-aside__body space-y-3">
              <RnPromoCodeCard />
              <BokunExperienceCalendar experienceId={BOKUN_SNOWMOBILE_EXPERIENCE_ID} />
            </div>
          </div>
        }
        bookingBelow={
          <p className="text-center text-[12px] text-text-muted">
            <Link to="/daytime-experiences" className="font-medium text-aurora-soft hover:underline">
              More day tours →
            </Link>
          </p>
        }
      >
        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">About</p>
          <h2 className="rn-tour-section__title">The experience</h2>
          <div className="rn-tour-section__body space-y-3 text-[15px] leading-relaxed text-text-muted">
            <p>
              See Lapland from a snowmobile on a guided safari through the winter wilderness around
              Rovaniemi. After a clear safety briefing and driving instruction, follow your local
              guide along snow-covered forest trails and across quiet frozen landscapes.
            </p>
            <p>
              The route is designed as a welcoming introduction for first-time riders, with time to
              settle into the machine and take in the nature and winter life around you. You get
              approximately 1 hour 15 minutes of driving — two adults normally share each snowmobile
              and can switch drivers along the way. Your guide sets the pace to the group and the
              conditions of the day.
            </p>
            <p>
              Warm winter clothing and safety equipment are provided. A short stop with hot berry
              juice and cookies closes the outing before your return transfer.
            </p>
            <p>
              Sold by Royal Nordic · Operated by Lapland Legacy · Booked in Bókun on this page.
            </p>
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">Highlights</p>
          <h2 className="rn-tour-section__title">At a glance</h2>
          <div className="mt-5">
            <ExperienceHighlights items={HIGHLIGHTS} />
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">Details</p>
          <h2 className="rn-tour-section__title">What’s included</h2>
          <div className="mt-5">
            <ExperienceInclusions included={INCLUDED} notIncluded={NOT_INCLUDED} />
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">Good to know</p>
          <h2 className="rn-tour-section__title">Before you book</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Children',
                  content:
                    'Small children may travel in a sleigh pulled by the guide. Children taller than 130 cm may ride behind an adult at the adult rate, subject to operator confirmation.',
                },
                {
                  title: 'Single driver',
                  content: `Optional €${RN_SNOWMOBILE_PROMO.singleDriverSupplement} supplement to drive your own snowmobile — select in Bókun when offered.`,
                },
                {
                  title: 'Transfers',
                  content:
                    'Return transfers are arranged by Lapland Legacy. Pickup details are confirmed with your Bókun booking.',
                },
                {
                  title: 'Cancellation',
                  content:
                    'Cancellation, weather changes, insurance, and liability follow Lapland Legacy’s terms in the Bókun checkout — not Royal Nordic’s Northern Lights guarantee.',
                },
              ]}
            />
          </div>
        </section>
      </ExperienceProductLayout>

      <MobileBookingBar
        priceFrom={adultWithCode}
        referencePrice={adultRegular}
        label="Check availability"
        onBook={scrollToBook}
      />
      <Footer />
    </div>
  )
}

export default SnowmobileSafari
