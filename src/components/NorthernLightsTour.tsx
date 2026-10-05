import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import BookingForm from './BookingForm'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ReviewCarousel from './ReviewCarousel'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import SafeRichText from './SafeRichText'
import TourSection from './tour/TourSection'
import TourGuarantee from './tour/TourGuarantee'
import { reviewsFor } from '../data/reviews'
import { useTourCms } from '../hooks/useTourCms'
import { displayName, getDisplayPricing } from '../lib/tourCms'
import {
  GUARANTEED_NL_BENEFITS,
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_FULL,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_MAX_PER_VEHICLE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_SEASON_END,
  GUARANTEED_NL_SEASON_START,
  guaranteedNlFaqs,
} from '../seo/guaranteedNorthernLightsTour'

const FALLBACK_GALLERY = [
  { src: '/nortti1.jpg', alt: 'Guests watching the Northern Lights on a Royal Nordic tour' },
  { src: '/nortti3.jpg', alt: 'Aurora display over Finnish Lapland wilderness' },
  { src: '/nortti5.jpg', alt: 'Green aurora ribbons above snowy forest near Rovaniemi' },
  { src: '/lights7.jpg', alt: 'Northern Lights over snowy Lapland forest' },
  { src: '/lights8.jpg', alt: 'Aurora Borealis reflecting above Arctic landscape' },
  { src: '/nortti9.jpg', alt: 'Clear winter night during an aurora hunt' },
]

const NorthernLightsTour = () => {
  const { tour, loading } = useTourCms(1)

  const pricing = useMemo(() => {
    if (!tour) {
      return {
        current: GUARANTEED_NL_CATALOG_ADULT_PRICE,
        child: GUARANTEED_NL_CATALOG_ADULT_PRICE,
        saleActive: true,
        reference: GUARANTEED_NL_REFERENCE_ADULT_PRICE,
        saveAmount: GUARANTEED_NL_REFERENCE_ADULT_PRICE - GUARANTEED_NL_CATALOG_ADULT_PRICE,
        label: 'Special offer',
      }
    }
    return getDisplayPricing(tour)
  }, [tour])

  const title = tour ? displayName(tour) : 'Guaranteed Northern Lights Tour'
  const lede = tour?.tagline?.trim() || GUARANTEED_NL_HERO_PROMISE
  const benefits =
    tour?.highlights?.length > 0
      ? tour.highlights.map((h) => h.text)
      : [...GUARANTEED_NL_BENEFITS]
  const gallery =
    tour?.gallery?.length > 0
      ? tour.gallery.map((g) => ({ src: g.url, alt: g.alt }))
      : FALLBACK_GALLERY
  const included =
    tour?.included_items?.length > 0
      ? tour.included_items.map((i) => i.text)
      : [
          'Hotel pickup and drop-off',
          'Professional photos of you with the Northern Lights',
          'Warm transportation',
          'Hot drinks and snacks',
          'Expert Aurora guide',
          '100% Aurora Guarantee',
        ]
  const excluded =
    tour?.excluded_items?.length > 0
      ? tour.excluded_items.map((i) => i.text)
      : ['Arctic clothing', 'Personal equipment']
  const guarantee = tour?.guarantee_info?.trim() || GUARANTEED_NL_GUARANTEE_FULL
  const faqs =
    tour?.faq?.length > 0
      ? tour.faq.map((f) => ({ question: f.question, answer: f.answer }))
      : [...guaranteedNlFaqs]

  useEffect(() => {
    if (!tour?.seo_title && !tour?.seo_description) return
    if (tour.seo_title) document.title = tour.seo_title
    const desc = document.querySelector('meta[name="description"]')
    if (desc && tour.seo_description) desc.setAttribute('content', tour.seo_description)
  }, [tour])

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const adultPrice = tour?.adult_price ?? GUARANTEED_NL_CATALOG_ADULT_PRICE
  const childPrice = tour?.child_price ?? GUARANTEED_NL_CATALOG_ADULT_PRICE
  const maxCapacity = tour?.max_capacity ?? GUARANTEED_NL_MAX_PER_VEHICLE

  const itinerary = [
    {
      time: '18:30',
      title: 'Pickup',
      text: 'Hotel pickup in the Rovaniemi area. Exact time confirmed after booking.',
    },
    {
      title: 'Aurora hunt',
      text: 'We chase clearer skies using live forecasts — farther when conditions call for it.',
    },
    {
      title: 'Photo stops',
      text: 'Warm drinks and time outdoors while your guide photographs you with the aurora.',
    },
    {
      time: 'Return',
      title: 'Drop-off',
      text: 'Return to your hotel — usually between midnight and early morning.',
    },
  ]

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Northern Lights', to: '/northern-lights-tours' },
          { label: title },
        ]}
        eyebrow="Rovaniemi · Finnish Lapland"
        title={title}
        lede={lede}
        benefits={benefits}
        proof={
          <p>
            <strong>★★★★★</strong> Real guest reviews · Small groups · Free professional photos
          </p>
        }
        heroAction={
          <>
            <button type="button" onClick={scrollToBook} className="rn-btn-primary min-h-[48px] px-8">
              Check availability
            </button>
            {pricing.saleActive && pricing.reference != null ? (
              <p className="text-sm text-text-muted">
                <span className="line-through decoration-sale/70 text-text-dim">€{pricing.reference}</span>{' '}
                <span className="font-semibold text-white">€{pricing.current}</span>
                <span> / adult</span>
                {pricing.saveAmount > 0 ? (
                  <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-sale-soft">
                    Save €{pricing.saveAmount}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-text-muted">
                <span className="font-semibold text-white">€{pricing.current}</span> / adult
              </p>
            )}
          </>
        }
        images={gallery}
        facts={[
          { label: 'Duration', value: tour?.duration_text || '2–10 hours' },
          { label: 'Group', value: tour?.group_size_text || 'Max 8 / vehicle' },
          { label: 'Pickup', value: 'Rovaniemi hotels' },
          { label: 'Guarantee', value: '100% refund*' },
        ]}
        booking={
          <BookingAside
            priceFrom={pricing.current}
            referencePrice={pricing.saleActive ? pricing.reference ?? undefined : undefined}
            priceNote="/ adult"
            trustLines={[
              'Free cancellation',
              'Secure payment',
              'Free photos',
              'Aurora Guarantee',
            ]}
          >
            {loading && !tour ? (
              <p className="py-8 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingForm
                tourId={1}
                tourName="Guaranteed Northern Lights Tour"
                adultPrice={adultPrice}
                childPrice={childPrice}
                maxCapacity={maxCapacity}
                seasonStart={GUARANTEED_NL_SEASON_START}
                seasonEnd={GUARANTEED_NL_SEASON_END}
                chrome="embedded"
                tone="light"
              />
            )}
          </BookingAside>
        }
        bookingBelow={
          <p className="text-center text-[12px] text-text-muted">
            <Link to="/northern-lights-tours" className="font-medium text-aurora-soft hover:underline">
              Compare Northern Lights tours
            </Link>
          </p>
        }
        afterContent={
          <>
            <section className="border-t border-white/[0.06] py-12 sm:py-14">
              <div className="rn-container">
                <p className="rn-eyebrow">Real memories from our tours</p>
                <h2 className="rn-h2 mt-2 text-white">Professional photos included free</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-muted">
                  Your guide takes professional photographs of you with the Northern Lights.
                </p>
                <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                  {gallery.slice(0, 6).map((img) => (
                    <figure key={img.src} className="overflow-hidden rounded-rn">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="aspect-[4/3] h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </figure>
                  ))}
                </div>
              </div>
            </section>
            <ReviewCarousel
              reviews={reviewsFor('northern-lights', 7)}
              eyebrow="From real guests"
              title="Guests on this experience"
              className="border-t border-white/[0.06]"
            />
            <section className="border-t border-white/[0.06] py-12 sm:py-14">
              <div className="rn-container flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-lg">
                  <h2 className="rn-h2 text-white">Ready for the Aurora?</h2>
                  <p className="mt-2 text-[15px] text-text-muted">
                    {pricing.saleActive ? `Special offer €${pricing.current}` : `From €${pricing.current}`} per
                    adult. Check dates and book in minutes.
                  </p>
                </div>
                <button type="button" onClick={scrollToBook} className="rn-btn-primary min-h-[48px] px-8">
                  Check availability
                </button>
              </div>
            </section>
          </>
        }
      >
        <TourSection eyebrow="Promise" title="Aurora guarantee">
          <TourGuarantee detail={guarantee} />
        </TourSection>

        <TourSection eyebrow="About" title="About this experience">
          {tour?.full_description ? (
            <SafeRichText text={tour.full_description} />
          ) : (
            <p className="leading-relaxed text-text-muted">
              Hunt the Aurora from Rovaniemi with local guides who read live solar and weather data, then drive as
              far as needed for clearer skies. Hotel pickup, warm drinks, and professional photos of you with the
              Northern Lights are included.
            </p>
          )}
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why you’ll love it" tone="band">
          <ul className="rn-benefit-rail !mt-0">
            {benefits.map((item) => (
              <li key={item}>
                <span className="rn-benefit-rail__mark" aria-hidden>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </TourSection>

        <TourSection eyebrow="Itinerary" title="How the experience works">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={included} notIncluded={excluded} />
        </TourSection>

        {(tour?.important_info ||
          tour?.know_before ||
          tour?.what_to_bring ||
          tour?.pickup_info ||
          tour?.cancellation_info) && (
          <TourSection eyebrow="Plan ahead" title="Important information">
            <ExperienceAccordion
              items={[
                tour?.pickup_info
                  ? { title: 'Pickup & meeting', content: tour.pickup_info }
                  : null,
                tour?.what_to_bring
                  ? { title: 'What to bring', content: tour.what_to_bring }
                  : {
                      title: 'What to bring',
                      content:
                        'Warm Arctic layers: thermal base, insulating mid-layer, windproof outerwear, boots, hat, gloves.',
                    },
                tour?.know_before
                  ? { title: 'Know before you go', content: tour.know_before }
                  : null,
                tour?.important_info
                  ? { title: 'Good to know', content: tour.important_info }
                  : null,
                tour?.cancellation_info
                  ? { title: 'Cancellation', content: tour.cancellation_info }
                  : {
                      title: 'Cancellation',
                      content: 'Free cancellation up to 24 hours before departure.',
                    },
              ].filter(Boolean) as { title: string; content: string }[]}
            />
          </TourSection>
        )}

        <div className="rn-tour-section">
          <ProductFaq items={faqs} schemaId="nl-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar
        priceFrom={pricing.current}
        referencePrice={pricing.saleActive ? pricing.reference ?? undefined : undefined}
        onBook={scrollToBook}
        label="Check availability"
      />
    </div>
  )
}

export default NorthernLightsTour
