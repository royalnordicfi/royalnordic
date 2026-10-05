import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import BookingForm from './BookingForm'
import Footer from './Footer'
import MobileBookingBar from './MobileBookingBar'
import ProductFaq from './seo/ProductFaq'
import ReviewCarousel from './ReviewCarousel'
import ExperienceProductLayout from './experience/ExperienceProductLayout'
import ExperienceHighlights from './experience/ExperienceHighlights'
import ExperienceItinerary from './experience/ExperienceItinerary'
import ExperienceInclusions from './experience/ExperienceInclusions'
import ExperienceAccordion from './experience/ExperienceAccordion'
import BookingAside from './experience/BookingAside'
import SafeRichText from './SafeRichText'
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
    tour?.highlights?.length
      ? tour.highlights.map((h) => h.text)
      : [...GUARANTEED_NL_BENEFITS]
  const gallery =
    tour?.gallery?.length
      ? tour.gallery.map((g) => ({ src: g.url, alt: g.alt }))
      : FALLBACK_GALLERY
  const included =
    tour?.included_items?.length
      ? tour.included_items.map((i) => i.text)
      : [
          '100% Aurora Guarantee — full refund if not captured on our cameras (see Terms)',
          'Free professional photos of you with the Northern Lights',
          'Small group — max 8 people per vehicle',
          'Hotel pickup and drop-off in the Rovaniemi area',
          'Flexible 2–10 hour hunt based on live aurora forecasts',
          'English & Finnish speaking local guides',
          'Warm drinks and snacks',
        ]
  const excluded =
    tour?.excluded_items?.length
      ? tour.excluded_items.map((i) => i.text)
      : ['Clothing and personal equipment (bring warm Arctic layers)']
  const guarantee = tour?.guarantee_info?.trim() || GUARANTEED_NL_GUARANTEE_FULL
  const faqs =
    tour?.faq?.length
      ? tour.faq.map((f) => ({ question: f.question, answer: f.answer }))
      : [...guaranteedNlFaqs]

  useEffect(() => {
    if (!tour?.seo_title && !tour?.seo_description) return
    if (tour.seo_title) document.title = tour.seo_title
    const desc = document.querySelector('meta[name="description"]')
    if (desc && tour.seo_description) {
      desc.setAttribute('content', tour.seo_description)
    }
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
      text:
        tour?.pickup_info?.trim() ||
        'Standard pickup from 18:30. Exact time confirmed after booking — be ready 10–30 minutes before.',
    },
    {
      title: 'Aurora hunt',
      text:
        tour?.what_to_expect?.trim() ||
        'We drive to the best viewing spots for that night based on live forecasts — farther when skies are clearer.',
    },
    {
      title: 'Photo stops',
      text: 'Warm drinks, snacks, and time outdoors while your guide takes professional photos of you with the Northern Lights.',
    },
    {
      time: 'Return',
      title: 'Drop-off',
      text: 'Return depends on distance traveled — usually between midnight and early morning.',
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
            <strong>★★★★★</strong> Real guest reviews · Small groups · Free professional aurora photos
          </p>
        }
        heroAction={
          <>
            <button type="button" onClick={scrollToBook} className="rn-btn-primary min-h-[48px] px-8">
              Check availability
            </button>
            <p className="text-sm text-text-muted">
              {pricing.saleActive && pricing.reference != null ? (
                <>
                  <span className="line-through decoration-sale/70 text-text-dim">
                    €{pricing.reference}
                  </span>{' '}
                </>
              ) : null}
              <span className="font-semibold text-white">€{pricing.current}</span>
              <span className="text-text-muted"> / adult</span>
            </p>
          </>
        }
        images={gallery}
        facts={[
          { label: 'Duration', value: tour?.duration_text || '2–10 h (~6h)' },
          { label: 'Group', value: tour?.group_size_text || 'Max 8 / vehicle' },
          { label: 'Pickup', value: tour?.meeting_point ? 'Hotel included' : 'Hotel included' },
          { label: 'Guarantee', value: '100% refund' },
        ]}
        booking={
          <>
            <BookingAside
              priceFrom={pricing.current}
              referencePrice={pricing.saleActive ? pricing.reference ?? undefined : undefined}
              priceNote="/ adult"
              offerLine={
                pricing.saleActive && pricing.saveAmount > 0
                  ? `${pricing.label || 'Special offer'} · Save €${pricing.saveAmount}`
                  : undefined
              }
              trustLines={[
                'Free cancellation 24h before',
                'Secure Stripe payment',
                'Hotel pickup & drop-off',
                'Free professional photos included',
                '100% refund if aurora not captured on camera',
              ]}
            >
              {loading && !tour ? (
                <p className="py-10 text-center text-sm text-panel-muted">Loading availability…</p>
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
            <p className="mt-3 text-center text-sm text-text-muted">
              <Link to="/northern-lights-tours" className="font-medium text-aurora-soft hover:underline">
                Compare Northern Lights tours
              </Link>
            </p>
          </>
        }
        afterContent={
          <>
            <section className="border-t border-white/[0.06] bg-black/20 py-14 sm:py-16">
              <div className="rn-container">
                <p className="rn-eyebrow">Real memories from our tours</p>
                <h2 className="rn-h2 mt-2 text-white">Professional photos included free</h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-text-muted">
                  Your guide takes professional photographs of you with the Northern Lights — not tips for your
                  own camera.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:gap-4">
                  {gallery.slice(0, 6).map((img) => (
                    <figure key={img.src} className="rn-reveal overflow-hidden rounded-rn">
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
            <section className="border-t border-white/[0.06] py-14 sm:py-16">
              <div className="rn-container flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="max-w-lg">
                  <h2 className="rn-h2 text-white">Ready for the Aurora?</h2>
                  <p className="mt-2 text-[15px] text-text-muted">
                    From €{pricing.current} per adult. Check dates and book in minutes.
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
        <section className="rn-reveal">
          <div className="rn-guarantee-callout">
            <h2 className="rn-guarantee-callout__title">100% Aurora Guarantee</h2>
            <p className="rn-guarantee-callout__body">{guarantee}</p>
          </div>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Why Royal Nordic</h2>
          {tour?.full_description ? (
            <div className="mt-3">
              <SafeRichText text={tour.full_description} />
            </div>
          ) : (
            <p className="mt-3 leading-relaxed text-text-muted">
              Hunt the Aurora Borealis from Rovaniemi with local guides who read live solar and weather data, then
              drive as far as needed for clearer skies. Hotel pickup, a warm vehicle, hot drinks, and professional
              photos of you with the Northern Lights are included.
            </p>
          )}
          <div className="mt-5">
            <ExperienceHighlights
              items={
                benefits.length
                  ? benefits.slice(0, 3).map((b) => b)
                  : [
                      'Live aurora and weather data — we drive as far as needed for clearer skies',
                      'Your guide takes professional photos of you beneath the aurora — included free',
                      'See the Aurora or get your money back — based on what our DSLR cameras capture',
                    ]
              }
            />
          </div>
        </section>

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">How the aurora hunt works</h2>
          <div className="mt-5">
            <ExperienceItinerary steps={itinerary} />
          </div>
        </section>

        <section className="rn-reveal">
          <ExperienceInclusions included={included} notIncluded={excluded} />
        </section>

        {(tour?.important_info || tour?.know_before || tour?.what_to_bring || tour?.cancellation_info) && (
          <section className="rn-reveal space-y-6">
            {tour.important_info ? (
              <div>
                <h2 className="font-display font-semibold text-white">Important information</h2>
                <div className="mt-3">
                  <SafeRichText text={tour.important_info} />
                </div>
              </div>
            ) : null}
            {tour.know_before ? (
              <div>
                <h2 className="font-display font-semibold text-white">Know before you go</h2>
                <div className="mt-3">
                  <SafeRichText text={tour.know_before} />
                </div>
              </div>
            ) : null}
            {tour.what_to_bring ? (
              <div>
                <h2 className="font-display font-semibold text-white">What to bring</h2>
                <div className="mt-3">
                  <SafeRichText text={tour.what_to_bring} />
                </div>
              </div>
            ) : null}
            {tour.cancellation_info ? (
              <div>
                <h2 className="font-display font-semibold text-white">Cancellation</h2>
                <div className="mt-3">
                  <SafeRichText text={tour.cancellation_info} />
                </div>
              </div>
            ) : null}
          </section>
        )}

        <section className="rn-reveal">
          <h2 className="font-display font-semibold text-white">Practical information</h2>
          <div className="mt-4">
            <ExperienceAccordion
              items={[
                {
                  title: 'What to bring',
                  content:
                    tour?.what_to_bring?.trim() ||
                    'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves.',
                },
                {
                  title: 'Good to know',
                  content: (
                    <ul className="space-y-2">
                      <li>Auroras often look more colourful in photos than with the naked eye.</li>
                      <li>Our guarantee is based on what our professional cameras capture during your tour.</li>
                      <li>Free cancellation up to 24 hours before departure.</li>
                    </ul>
                  ),
                },
                {
                  title: 'Guarantee & cancellation',
                  content: (
                    <p>
                      {guarantee} See our{' '}
                      <Link
                        to="/terms-conditions"
                        className="font-semibold text-aurora-soft underline-offset-2 hover:underline"
                      >
                        Terms &amp; Conditions
                      </Link>
                      .
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </section>

        <ProductFaq items={faqs} schemaId="nl-faq" tone="dark" />
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
