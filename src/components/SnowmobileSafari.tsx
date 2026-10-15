import { Link } from 'react-router-dom'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceItinerary from './experience/ExperienceItinerary'
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
  'About 75 minutes of guided snowmobile driving',
  'Shared snowmobile for two adults',
  'Thermal clothing and safety gear included',
  'Hot berry juice and cookies on the route',
  'Return transfers with the operator',
]

const HIGHLIGHTS = [
  'Explore Rovaniemi’s Arctic wilderness by snowmobile.',
  'Enjoy approximately 75 minutes of guided snowmobile driving.',
  'Ride through peaceful snow-covered forests and winter landscapes.',
  'Learn to operate a snowmobile with professional instruction.',
  'Experience Finnish Lapland from a different perspective.',
  'Stay comfortable with provided thermal clothing and safety equipment.',
  'Enjoy a warming refreshment break during the adventure.',
]

const INCLUDED = [
  'Guided snowmobile safari',
  'Approximately 75 minutes of snowmobile driving',
  'Shared snowmobile for two adults',
  'Professional local guide',
  'Safety briefing and driving instructions',
  'Thermal overalls',
  'Winter boots',
  'Gloves',
  'Balaclava',
  'Helmet',
  'Hot berry juice and cookies',
  'Return transfers arranged by the operator',
]

const NOT_INCLUDED = [
  `Optional single-driver supplement (€${RN_SNOWMOBILE_PROMO.singleDriverSupplement} per person, where available)`,
  'Personal purchases',
  'Services not listed in your selected booking option',
]

const ITINERARY = [
  {
    title: 'Meet & prepare',
    text: 'Join the Lapland Legacy team for pickup or meeting arrangements confirmed in your booking. Receive thermal clothing and a clear safety briefing.',
  },
  {
    title: 'Drive into the wilderness',
    text: 'Follow your guide along snowy forest trails with about 75 minutes of snowmobile driving. Two adults normally share one machine and may switch drivers.',
  },
  {
    title: 'Arctic pause',
    text: 'Stop for warm berry juice and cookies while taking in the winter landscape.',
  },
  {
    title: 'Return',
    text: 'Ride back with the group and transfer to your pickup or drop-off point according to the operator’s arrangements.',
  },
]

const scrollToBook = () => {
  document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * Partner snowmobile safari — marketed by Royal Nordic, operated by Lapland Legacy.
 * Booking and payment run entirely in the Bókun widget (no Stripe for this product).
 */
const SnowmobileSafari = () => {
  const { adultRegular, adultWithCode, childRegular, childWithCode, privateFrom, code, percent } =
    RN_SNOWMOBILE_PROMO

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Day Tours', to: '/daytime-experiences' },
          { label: 'Arctic Snowmobile Safari' },
        ]}
        eyebrow="Rovaniemi · Operated by Lapland Legacy"
        title="Rovaniemi: Arctic Snowmobile Safari – 2-Hour Wilderness Adventure"
        lede="Experience the thrill of snowmobiling through snow-covered forests and breathtaking Arctic scenery in Finnish Lapland."
        benefits={BENEFITS}
        proof={
          <p>
            Sold by Royal Nordic · Delivered by Lapland Legacy · Book online with exclusive code{' '}
            <strong className="text-aurora-soft">{code}</strong> (−{percent}%)
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
              <span>/ adult with {code}</span>
              <span className="text-text-dim">
                · child €{childRegular} → €{childWithCode.toFixed(2)}
              </span>
            </div>
          </>
        }
        images={GALLERY}
        facts={[
          { label: 'Total time', value: 'About 2.5 hours' },
          { label: 'Driving', value: '~75 minutes' },
          { label: 'Group', value: 'Shared / 2 per sled' },
          { label: 'Transfers', value: 'Operator return' },
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
              />
              <p className="mt-2 text-[11.5px] leading-snug text-panel-muted">
                Child €{childRegular} → €{childWithCode.toFixed(2)} with {code} · Private from €
                {privateFrom}. Retail matches Lapland Legacy; enter {code} in Bókun for the discount.
              </p>
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
                <li>
                  <span className="rn-book-aside__trust-mark" aria-hidden>
                    ✓
                  </span>
                  <span>Partner-operated</span>
                </li>
              </ul>
            </div>
            <div className="rn-book-aside__body space-y-3">
              <RnPromoCodeCard />
              <BokunExperienceCalendar experienceId={BOKUN_SNOWMOBILE_EXPERIENCE_ID} />
              <p className="text-[11px] leading-snug text-panel-muted">
                Payment is processed in Bókun — not through Royal Nordic Stripe. Booking terms,
                cancellation, and liability follow Lapland Legacy’s checkout.
              </p>
            </div>
          </div>
        }
        bookingBelow={
          <p className="text-center text-[12px] text-text-muted">
            Prefer another day adventure?{' '}
            <Link to="/daytime-experiences" className="font-medium text-aurora-soft hover:underline">
              Browse day tours
            </Link>
          </p>
        }
      >
        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">About</p>
          <h2 className="rn-tour-section__title">About this experience</h2>
          <div className="rn-tour-section__body space-y-3 text-[15px] leading-relaxed text-text-muted">
            <p>
              Discover the excitement of snowmobiling in Finnish Lapland on a guided adventure through
              the winter wilderness surrounding Rovaniemi.
            </p>
            <p>
              Your experience begins with a safety briefing and an introduction to snowmobile driving.
              An experienced local guide explains how to operate the machine and ensures everyone is
              comfortable before setting off.
            </p>
            <p>
              Once ready, follow your guide into snowy forests — peaceful Arctic scenery and winding
              winter trails create the setting for an outdoor adventure with about 75 minutes of
              snowmobile driving. Two adults normally share one snowmobile, with the chance to switch
              drivers along the way.
            </p>
            <p>
              A short break with warm berry juice and cookies lets you take in the atmosphere of the
              Arctic wilderness. Thermal winter clothing and essential safety equipment are provided.
            </p>
            <p>
              Royal Nordic markets this safari; Lapland Legacy operates and delivers it. Booking and
              payment run through the Bókun calendar on this page.
            </p>
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">Highlights</p>
          <h2 className="rn-tour-section__title">Why you’ll love it</h2>
          <div className="mt-5">
            <ExperienceHighlights items={HIGHLIGHTS} />
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">Itinerary</p>
          <h2 className="rn-tour-section__title">How the experience works</h2>
          <div className="mt-5">
            <ExperienceItinerary steps={ITINERARY} />
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
          <p className="rn-tour-section__eyebrow">Plan ahead</p>
          <h2 className="rn-tour-section__title">Important information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'Driving licence & passengers',
                  content:
                    'Snowmobile drivers must hold a valid Category B driving licence accepted in Finland. Guests without a licence may join as passengers where permitted. Two adults normally share one snowmobile; driver changes may be possible during the safari.',
                },
                {
                  title: 'Children',
                  content:
                    'Children participate according to Lapland Legacy’s age, height, and safety rules. Small children may travel in a sleigh pulled by the guide’s snowmobile. Children taller than 130 cm may ride behind an adult at the adult rate, subject to operator confirmation.',
                },
                {
                  title: 'Single-driver option',
                  content: `A single-driver supplement (€${RN_SNOWMOBILE_PROMO.singleDriverSupplement} per person) may be available so you can drive your own snowmobile throughout the safari. Select it in Bókun when offered.`,
                },
                {
                  title: 'Meeting point & transfers',
                  content:
                    'Comfortable return transfers are included and arranged by Lapland Legacy. Exact pickup or meeting details are confirmed with your Bókun booking — do not assume Royal Nordic hotel-pickup rules from other tours.',
                },
                {
                  title: 'Weather & routes',
                  content:
                    'Snowmobile routes and timing can vary with weather and safety conditions. All participants must follow the guide’s instructions.',
                },
                {
                  title: 'Cancellation & liability',
                  content:
                    'Cancellation deadlines, refunds, weather cancellations, insurance, and snowmobile damage excess follow Lapland Legacy’s terms shown in the Bókun checkout. This product does not use Royal Nordic’s Northern Lights guarantee or Stripe booking policies.',
                },
                {
                  title: 'Duration',
                  content:
                    'The safari is marketed as a 2-hour style outing. Partner details indicate about 2.5 hours total including briefing, transfers, and a break, with approximately 75 minutes of actual snowmobile driving — not 2.5 hours of continuous driving.',
                },
              ]}
            />
          </div>
        </section>

        <section className="rn-tour-section rn-reveal">
          <p className="rn-tour-section__eyebrow">FAQ</p>
          <h2 className="rn-tour-section__title">Questions</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'How much driving is there?',
                  content:
                    'Approximately 1 hour 15 minutes of actual driving time, with two adults sharing each snowmobile and the chance to switch drivers.',
                },
                {
                  title: 'Do I need a driving licence?',
                  content:
                    'Yes, to drive. Category B licences valid for driving in Finland are required. Guests may join as passengers without driving.',
                },
                {
                  title: 'Is this suitable for first-time riders?',
                  content:
                    'Yes. The route is chosen as an introduction, with safety briefing and driving instruction before you set off.',
                },
                {
                  title: 'How do I get the Royal Nordic discount?',
                  content: `Copy code ${code} from the booking panel and enter it during Bókun checkout. Final discounted totals are confirmed by Bókun when the promotion is active and eligible.`,
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
