/**
 * Single source of truth for Guaranteed Northern Lights Tour SEO + Product schema.
 * Used by RoutePageMeta, RouteJsonLd, and the build-time prerender script (mirrored in scripts/).
 */

export const SITE = 'https://royalnordic.fi'

export const GUARANTEED_NL_PATH = '/northern-lights-tour'

/** Catalog adult list price (EUR). Promo codes like WINTER20 apply at checkout — not in Offer.price. */
export const GUARANTEED_NL_CATALOG_ADULT_PRICE = 149

/** Matches product copy: max 8 people per vehicle */
export const GUARANTEED_NL_MAX_PER_VEHICLE = 8

/** Season window (month-day). Matches BookingForm seasonStart/seasonEnd. */
export const GUARANTEED_NL_SEASON_START = '09-15'
export const GUARANTEED_NL_SEASON_END = '04-15'

export const guaranteedNlMeta = {
  path: GUARANTEED_NL_PATH,
  title: 'Guaranteed Northern Lights Tour Rovaniemi | Royal Nordic',
  description:
    'Book a guaranteed Northern Lights / aurora tour from Rovaniemi: small-group hunt, hotel pickup, English & Finnish guides, flexible duration. Free cancellation 24h. Pay securely online.',
  ogImage: `${SITE}/nortti1.jpg`,
  h1: 'Guaranteed Northern Lights Tour',
  productName: 'Guaranteed Northern Lights Tour',
  productDescription:
    'Guaranteed Northern Lights (aurora) tour from Rovaniemi, Finnish Lapland: small-group hunt with hotel pickup, English and Finnish guides, flexible duration, and a free return trip if no lights appear (see Terms).',
}

export const guaranteedNlFaqs = [
  {
    question: 'What does the Northern Lights guarantee mean?',
    answer:
      'If no Northern Lights are visible during your tour, we offer a free return trip on the next available date. See our Terms & Conditions for the full promise.',
  },
  {
    question: 'Where do you pick us up?',
    answer:
      'We offer hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 pickup window.',
  },
  {
    question: 'How long is the tour?',
    answer:
      'Duration is flexible based on aurora forecasts — typically around six hours, and between about 2 and 12 hours when we need to travel farther for clearer skies.',
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
  { name: 'Guaranteed Northern Lights Tour', path: GUARANTEED_NL_PATH },
] as const

/** True when `date` falls in the Northern Lights booking season (cross-year). */
export function isGuaranteedNlSeason(date: Date = new Date()): boolean {
  const md = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  // Season spans year boundary: Sep 15 → Dec 31 OR Jan 1 → Apr 15
  return md >= GUARANTEED_NL_SEASON_START || md <= GUARANTEED_NL_SEASON_END
}

export function guaranteedNlOfferAvailability(date: Date = new Date()): {
  availability: string
  availabilityStarts?: string
} {
  if (isGuaranteedNlSeason(date)) {
    return { availability: 'https://schema.org/InStock' }
  }
  // Off-season (after 15 Apr, before 15 Sep): next season opens 15 Sep of the current year.
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
