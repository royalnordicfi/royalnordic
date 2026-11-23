import { useMemo } from 'react'
import BookingWidget from './booking/BookingWidget'
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
import TourSection from './tour/TourSection'
import TourGuarantee from './tour/TourGuarantee'
import { reviewsFor } from '../data/reviews'
import { useCmsTourPresentation, type TourPageFallback } from '../hooks/useCmsTourPresentation'
import {
  GUARANTEED_NL_ADULT_SAVE_PERCENT,
  GUARANTEED_NL_BENEFITS,
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_CATALOG_CHILD_PRICE,
  GUARANTEED_NL_CHILD_SAVE_PERCENT,
  GUARANTEED_NL_GUARANTEE_FULL,
  GUARANTEED_NL_HERO_PROMISE,
  GUARANTEED_NL_MAX_PER_VEHICLE,
  GUARANTEED_NL_PRODUCT_NAME,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_CHILD_PRICE,
  GUARANTEED_NL_SEASON_END,
  GUARANTEED_NL_SEASON_START,
  GUARANTEED_NL_SHORT_NAME,
  guaranteedNlFaqs,
} from '../seo/guaranteedNorthernLightsTour'

const FALLBACK: TourPageFallback = {
  title: GUARANTEED_NL_PRODUCT_NAME,
  lede: GUARANTEED_NL_HERO_PROMISE,
  adultPrice: GUARANTEED_NL_CATALOG_ADULT_PRICE,
  childPrice: GUARANTEED_NL_CATALOG_CHILD_PRICE,
  maxCapacity: GUARANTEED_NL_MAX_PER_VEHICLE,
  duration: '2–10 hours',
  groupSize: 'Max 8 / vehicle',
  pickupFact: 'Rovaniemi hotels',
  description:
    'Hunt the Aurora from Rovaniemi with local guides who read live solar and weather data, then drive as far as needed for clearer skies. Hotel pickup, warm drinks, and professional photos of you with the Northern Lights are included.',
  benefits: [...GUARANTEED_NL_BENEFITS],
  included: [
    'Hotel pickup and drop-off',
    'Professional photos of you with the Northern Lights',
    'Warm transportation',
    'Hot drinks and snacks',
    'Expert Aurora guide',
    '100% Aurora Guarantee',
  ],
  excluded: ['Arctic clothing', 'Personal equipment'],
  gallery: [
    { src: '/nortti1.jpg', alt: 'Guests watching the Northern Lights on a Royal Nordic tour' },
    { src: '/nortti3.jpg', alt: 'Aurora display over Finnish Lapland wilderness' },
    { src: '/nortti5.jpg', alt: 'Green aurora ribbons above snowy forest near Rovaniemi' },
    { src: '/lights7.jpg', alt: 'Northern Lights over snowy Lapland forest' },
    { src: '/lights8.jpg', alt: 'Aurora Borealis reflecting above Arctic landscape' },
    { src: '/nortti9.jpg', alt: 'Clear winter night during an aurora hunt' },
  ],
  faqs: [...guaranteedNlFaqs],
  whatToBring:
    'Warm Arctic layers: thermal base, insulating mid-layer, windproof outerwear, boots, hat, gloves.',
  knowBefore: 'Free cancellation up to 24 hours before departure.',
  seasonStart: GUARANTEED_NL_SEASON_START,
  seasonEnd: GUARANTEED_NL_SEASON_END,
}

const NorthernLightsTour = () => {
  const cms = useCmsTourPresentation(1, FALLBACK)

  const pricing = useMemo(() => {
    if (cms.tour) return cms.pricing
    return {
      current: GUARANTEED_NL_CATALOG_ADULT_PRICE,
      child: GUARANTEED_NL_CATALOG_CHILD_PRICE,
      saleActive: true,
      reference: GUARANTEED_NL_REFERENCE_ADULT_PRICE,
      saveAmount: GUARANTEED_NL_REFERENCE_ADULT_PRICE - GUARANTEED_NL_CATALOG_ADULT_PRICE,
      label: 'Special offer',
    }
  }, [cms.tour, cms.pricing])

  const saleActive = pricing.saleActive
  const adultRef = saleActive ? GUARANTEED_NL_REFERENCE_ADULT_PRICE : undefined
  const childRef = saleActive ? GUARANTEED_NL_REFERENCE_CHILD_PRICE : undefined
  const adultSave = saleActive ? `Save ${GUARANTEED_NL_ADULT_SAVE_PERCENT}%` : undefined
  const childSave = saleActive ? `Save ${GUARANTEED_NL_CHILD_SAVE_PERCENT}%` : undefined

  const scrollToBook = () => {
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  const guarantee = cms.guaranteeInfo || GUARANTEED_NL_GUARANTEE_FULL

  return (
    <div className="rn-page pb-24 lg:pb-0">
      <ExperienceProductLayout
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Northern Lights', to: '/northern-lights-tours' },
          { label: GUARANTEED_NL_SHORT_NAME },
        ]}
        eyebrow="Rovaniemi · Finnish Lapland"
        title={GUARANTEED_NL_PRODUCT_NAME}
        lede={cms.lede}
        benefits={cms.benefits.slice(0, 4)}
        cinematic={{
          image: cms.gallery[0]?.src || '/nortti1.jpg',
          imageAlt: cms.gallery[0]?.alt || 'Northern Lights over Finnish Lapland',
          imageSecondary: cms.gallery[1]?.src,
        }}
        proof={
          <p>
            <strong>★★★★★</strong> Guest reviews · Small groups · Free professional photos
          </p>
        }
        heroAction={
          <button type="button" onClick={scrollToBook} className="rn-btn-primary min-h-[50px] px-8">
            Check availability
          </button>
        }
        images={cms.gallery.slice(1)}
        facts={[
          { label: 'Duration', value: cms.duration || '2–10 hours' },
          { label: 'Group', value: cms.groupSize || 'Max 8 / vehicle' },
          { label: 'Pickup', value: cms.pickupFact || 'Rovaniemi hotels' },
          { label: 'Guarantee', value: '100% refund*' },
        ]}
        booking={
          <BookingAside
            priceFrom={pricing.current}
            referencePrice={saleActive ? pricing.reference ?? adultRef : undefined}
            priceNote="/ adult"
            childPriceFrom={cms.childPrice || GUARANTEED_NL_CATALOG_CHILD_PRICE}
            childReferencePrice={childRef}
            childPriceNote="/ child"
            adultSaveLabel={adultSave}
            childSaveLabel={childSave}
            trustLines={['Free cancellation 24h', 'Secure payment', 'Aurora Guarantee']}
          >
            {cms.loading && !cms.tour ? (
              <p className="py-8 text-center text-sm text-panel-muted">Loading availability…</p>
            ) : (
              <BookingWidget
                tourId={1}
                tourName={GUARANTEED_NL_PRODUCT_NAME}
                adultPrice={cms.adultPrice}
                childPrice={cms.childPrice}
                maxCapacity={cms.maxCapacity}
                seasonStart={cms.seasonStart || GUARANTEED_NL_SEASON_START}
                seasonEnd={cms.seasonEnd || GUARANTEED_NL_SEASON_END}
                adultReferencePrice={adultRef}
                childReferencePrice={childRef}
                adultSaveLabel={adultSave}
                childSaveLabel={childSave}
              />
            )}
          </BookingAside>
        }
        afterContent={
          <ReviewCarousel
            reviews={reviewsFor('northern-lights', 10)}
            eyebrow="Guest stories"
            title="What travellers remember"
            className="border-t border-white/[0.06]"
          />
        }
      >
        <TourSection eyebrow="Promise" title="Aurora guarantee">
          <TourGuarantee detail={guarantee} />
        </TourSection>

        <TourSection eyebrow="About" title="About this experience">
          {cms.fullDescription ? (
            <SafeRichText text={cms.fullDescription} />
          ) : (
            <p className="leading-relaxed text-text-muted">{FALLBACK.description}</p>
          )}
        </TourSection>

        <TourSection eyebrow="Highlights" title="Why travellers choose this tour" tone="band">
          <ExperienceHighlights items={cms.benefits} />
        </TourSection>

        <TourSection eyebrow="Itinerary" title="How the evening unfolds">
          <ExperienceItinerary steps={itinerary} />
        </TourSection>

        <TourSection eyebrow="Details" title="What’s included">
          <ExperienceInclusions included={cms.included} notIncluded={cms.excluded} />
        </TourSection>

        <TourSection eyebrow="Plan ahead" title="Important information">
          <ExperienceAccordion
            items={[
              cms.pickupInfo
                ? { title: 'Pickup & meeting', content: cms.pickupInfo }
                : {
                    title: 'Pickup & meeting',
                    content:
                      'Hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 window.',
                  },
              {
                title: 'What to bring',
                content: cms.whatToBring || FALLBACK.whatToBring || '',
              },
              cms.knowBefore
                ? { title: 'Know before you go', content: cms.knowBefore }
                : null,
              cms.importantInfo ? { title: 'Good to know', content: cms.importantInfo } : null,
              {
                title: 'Cancellation',
                content: cms.cancellationInfo || FALLBACK.knowBefore || '',
              },
            ].filter(Boolean) as { title: string; content: string }[]}
          />
        </TourSection>

        <div className="rn-tour-section">
          <ProductFaq items={cms.faqs} schemaId="nl-faq" tone="dark" />
        </div>
      </ExperienceProductLayout>

      <Footer />
      <MobileBookingBar
        priceFrom={pricing.current}
        referencePrice={saleActive ? pricing.reference ?? adultRef : undefined}
        onBook={scrollToBook}
        label="Check availability"
      />
    </div>
  )
}

export default NorthernLightsTour
