/**
 * Single source of truth for Small Group Northern Lights & Photography Tour
 * SEO + Product schema. Used by RoutePageMeta, RouteJsonLd, and the build-time
 * prerender script (mirrored in scripts/).
 */

export const SITE = 'https://royalnordic.fi'

export const GUARANTEED_NL_PATH = '/northern-lights-tour'

/** Full product title — H1, schema, booking draft name. */
export const GUARANTEED_NL_PRODUCT_NAME = 'Small Group Northern Lights & Photography Tour'

/** Shorter label for nav, cards, breadcrumbs, and compact UI. */
export const GUARANTEED_NL_SHORT_NAME = 'Small Group Northern Lights Tour'

/** Current bookable adult price (EUR). Must match tours.adult_price for tour id 1. */
export const GUARANTEED_NL_CATALOG_ADULT_PRICE = 139

/** Reference / was adult price shown with strikethrough (EUR). */
export const GUARANTEED_NL_REFERENCE_ADULT_PRICE = 179

/** Current bookable child price (EUR). Must match tours.child_price for tour id 1. */
export const GUARANTEED_NL_CATALOG_CHILD_PRICE = 119

/** Reference / was child price shown with strikethrough (EUR). */
export const GUARANTEED_NL_REFERENCE_CHILD_PRICE = 159

/** Rounded adult catalogue savings percentage for badges (179 → 139). */
export const GUARANTEED_NL_ADULT_SAVE_PERCENT = 22

/** Rounded child catalogue savings percentage for badges (159 → 119). */
export const GUARANTEED_NL_CHILD_SAVE_PERCENT = 25

/** Matches product copy: max 8 people per vehicle */
export const GUARANTEED_NL_MAX_PER_VEHICLE = 8

/** Season window (month-day). Matches BookingForm seasonStart/seasonEnd. */
export const GUARANTEED_NL_SEASON_START = '09-15'
export const GUARANTEED_NL_SEASON_END = '04-15'

/** Short hero promise — use on ads landing first viewport. */
export const GUARANTEED_NL_HERO_PROMISE = 'See the Aurora or get your money back.'

/** One-line guarantee for cards and trust strips. */
export const GUARANTEED_NL_GUARANTEE_SHORT =
  '100% refund if the Northern Lights are not captured on our professional cameras.'

/** Full operational guarantee (Terms, FAQ, accordion). */
export const GUARANTEED_NL_GUARANTEE_FULL =
  'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.'

export const GUARANTEED_NL_BENEFITS = [
  'Aurora Guarantee — full refund if cameras miss the lights',
  'Free professional photos of you with the aurora',
  'Hotel pickup and drop-off in Rovaniemi',
  'Small group — max 8 guests per vehicle',
  'Flexible 2–10 hour hunt for clearer skies',
] as const

/** Booking / email / promo aliases for tour id 1 (legacy + current titles). */
export const GUARANTEED_NL_NAME_ALIASES = [
  GUARANTEED_NL_PRODUCT_NAME,
  GUARANTEED_NL_SHORT_NAME,
  'Guaranteed Northern Lights Tour',
  'Guaranteed Northern Lights & Photography Tour',
  'Northern Lights Tour',
] as const

export function isGuaranteedNlTourName(tourName: string | null | undefined): boolean {
  if (!tourName) return false
  const n = tourName.trim()
  return (GUARANTEED_NL_NAME_ALIASES as readonly string[]).includes(n)
}

export const guaranteedNlMeta = {
  path: GUARANTEED_NL_PATH,
  title: 'Small Group Northern Lights & Photography Tour Rovaniemi | Royal Nordic',
  description:
    'Book a small-group Northern Lights & photography tour from Rovaniemi from €139: hotel pickup, expert guides, free professional photos, and a 100% camera-capture aurora guarantee. Free cancellation 24h.',
  ogImage: `${SITE}/nortti1.jpg`,
  h1: GUARANTEED_NL_PRODUCT_NAME,
  productName: GUARANTEED_NL_PRODUCT_NAME,
  productDescription:
    'Small-group Northern Lights & photography tour from Rovaniemi, Finnish Lapland: hotel pickup, English and Finnish guides, flexible 2–10 hour duration, and free professional photos of you with the aurora. If the Northern Lights cannot be captured by our professional DSLR cameras, you receive a 100% refund (see Terms).',
}

export const guaranteedNlFaqs = [
  {
    question: 'What happens if we don’t see the Northern Lights?',
    answer:
      'If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, you receive a 100% refund. If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.',
  },
  {
    question: 'How does the Aurora guarantee work?',
    answer: GUARANTEED_NL_GUARANTEE_FULL,
  },
  {
    question: 'Are professional photos included?',
    answer:
      'Yes — free. Your guide takes professional photos of you with the Northern Lights during the tour. This is not photography advice; we photograph you beneath the aurora.',
  },
  {
    question: 'How long does the tour take?',
    answer:
      'Duration is flexible based on aurora forecasts — typically around six hours, and between about 2 and 10 hours when we travel farther for clearer skies.',
  },
  {
    question: 'Why can the tour last 2–10 hours?',
    answer:
      'We chase clearer skies using live forecasts. Some nights the aurora appears nearby; other nights we drive farther (including across borders when conditions call for it) so the hunt can run longer.',
  },
  {
    question: 'Is hotel pickup included?',
    answer:
      'Yes. We offer hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 pickup window.',
  },
  {
    question: 'Where will we travel?',
    answer:
      'We leave city lights behind and drive to the best viewing areas for that night based on live solar and weather data — as far as needed for clearer skies.',
  },
  {
    question: 'What should I wear?',
    answer:
      'Dress in warm Arctic layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves. Tell us about snack allergies when you book.',
  },
  {
    question: 'Can the Aurora look different in photographs?',
    answer:
      'Yes. Auroras often look more colourful in long-exposure photographs than with the naked eye. Our guarantee is based on what our professional cameras capture during your tour.',
  },
  {
    question: 'What happens in extreme weather?',
    answer:
      'If conditions are unsafe, we may cancel or reschedule per our Terms & Conditions. Free cancellation is available up to 24 hours before departure.',
  },
  {
    question: 'When will I receive my pickup time?',
    answer:
      'We send detailed meeting instructions and your exact pickup time after booking, typically by the day before your tour. Standard pickup window starts from 18:30.',
  },
  {
    question: 'Is this suitable for children?',
    answer:
      'Children are welcome. Child pricing applies for ages 0–17. The evening can be long and cold outdoors, so warm clothing and stamina matter more than age alone.',
  },
  {
    question: 'When is the season?',
    answer:
      'This aurora hunt runs in the Northern Lights season, typically from mid-September through mid-April from Rovaniemi in Finnish Lapland.',
  },
] as const

export const guaranteedNlBreadcrumbs = [
  { name: 'Home', path: '/' },
  { name: 'Northern Lights Tours', path: '/northern-lights-tours' },
  { name: GUARANTEED_NL_SHORT_NAME, path: GUARANTEED_NL_PATH },
] as const

/** True when `date` falls in the Northern Lights booking season (cross-year). */
export function isGuaranteedNlSeason(date: Date = new Date()): boolean {
  const md = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  return md >= GUARANTEED_NL_SEASON_START || md <= GUARANTEED_NL_SEASON_END
}

export function guaranteedNlOfferAvailability(date: Date = new Date()): {
  availability: string
  availabilityStarts?: string
} {
  if (isGuaranteedNlSeason(date)) {
    return { availability: 'https://schema.org/InStock' }
  }
  const year = date.getUTCFullYear()
  return {
    availability: 'https://schema.org/PreOrder',
    availabilityStarts: `${year}-09-15`,
  }
}

export function buildGuaranteedNlProductJsonLd(date: Date = new Date()) {
  const { availability, availabilityStarts } = guaranteedNlOfferAvailability(date)
  const offer: Record<string, string> = {
    '@type': 'Offer',
    url: `${SITE}${GUARANTEED_NL_PATH}`,
    priceCurrency: 'EUR',
    price: GUARANTEED_NL_CATALOG_ADULT_PRICE.toFixed(2),
    availability,
    priceValidUntil: `${date.getUTCFullYear() + 1}-04-15`,
  }
  if (availabilityStarts) {
    offer.availabilityStarts = availabilityStarts
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: guaranteedNlMeta.productName,
    description: guaranteedNlMeta.productDescription,
    image: guaranteedNlMeta.ogImage,
    url: `${SITE}${GUARANTEED_NL_PATH}`,
    brand: {
      '@type': 'Brand',
      name: 'Royal Nordic',
    },
    offers: offer,
    provider: {
      '@id': `${SITE}/#organization`,
    },
  }
}

export function buildGuaranteedNlBreadcrumbJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: guaranteedNlBreadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path === '/' ? '' : crumb.path}`,
    })),
  }
}

export function buildGuaranteedNlFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guaranteedNlFaqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
