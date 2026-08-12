/**
 * Post-Vite build: emit route-specific HTML so crawlers see money-page meta/JSON-LD
 * instead of the homepage shell in dist/index.html.
 *
 * Vercel serves filesystem files before the SPA rewrite, so
 * dist/northern-lights-tour/index.html is returned for /northern-lights-tour.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')

const SITE = 'https://royalnordic.fi'
const PATH = '/northern-lights-tour'
const TITLE = 'Guaranteed Northern Lights Tour Rovaniemi | Royal Nordic'
const DESCRIPTION =
  'Book a guaranteed Northern Lights / aurora tour from Rovaniemi: small-group hunt, hotel pickup, English & Finnish guides, flexible duration. Free cancellation 24h. Pay securely online.'
const OG_IMAGE = `${SITE}/nortti1.jpg`
const CATALOG_ADULT_PRICE = 149

function isInSeason(date = new Date()) {
  const md = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  return md >= '09-15' || md <= '04-15'
}

function offerAvailability(date = new Date()) {
  if (isInSeason(date)) {
    return { availability: 'https://schema.org/InStock' }
  }
  return {
    availability: 'https://schema.org/PreOrder',
    availabilityStarts: `${date.getUTCFullYear()}-09-15`,
  }
}

function replaceMeta(html, { title, description, canonical, ogImage }) {
  let out = html
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  out = out.replace(
    /<meta name="title" content="[^"]*" \/>/,
    `<meta name="title" content="${title}" />`
  )
  out = out.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${description}" />`
  )
  out = out.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${canonical}" />`
  )
  out = out.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${title}" />`
  )
  out = out.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${description}" />`
  )
  out = out.replace(
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${ogImage}" />`
  )
  out = out.replace(
    /<meta property="og:image:alt" content="[^"]*" \/>/,
    `<meta property="og:image:alt" content="${title}" />`
  )
  out = out.replace(
    /<meta name="twitter:url" content="[^"]*" \/>/,
    `<meta name="twitter:url" content="${canonical}" />`
  )
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${title}" />`
  )
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${description}" />`
  )
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*" \/>/,
    `<meta name="twitter:image" content="${ogImage}" />`
  )
  out = out.replace(
    /<meta name="twitter:image:alt" content="[^"]*" \/>/,
    `<meta name="twitter:image:alt" content="${title}" />`
  )
  out = out.replace(
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonical}" />`
  )
  return out
}

function injectJsonLd(html, blocks) {
  const scripts = blocks
    .map(
      ({ id, data }) =>
        `<script id="jsonld-${id}" type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n    </script>`
    )
    .join('\n\n    ')
  return html.replace(
    '</head>',
    `\n    <!-- Route-specific structured data (prerender) -->\n    ${scripts}\n  </head>`
  )
}

function buildNlJsonLd(date = new Date()) {
  const { availability, availabilityStarts } = offerAvailability(date)
  const offer = {
    '@type': 'Offer',
    url: `${SITE}${PATH}`,
    priceCurrency: 'EUR',
    price: CATALOG_ADULT_PRICE.toFixed(2),
    availability,
    priceValidUntil: `${date.getUTCFullYear() + 1}-04-15`,
  }
  if (availabilityStarts) offer.availabilityStarts = availabilityStarts

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Guaranteed Northern Lights Tour',
    description:
      'Guaranteed Northern Lights (aurora) tour from Rovaniemi, Finnish Lapland: small-group hunt with hotel pickup, English and Finnish guides, flexible duration, and a free return trip if no lights appear (see Terms).',
    image: OG_IMAGE,
    url: `${SITE}${PATH}`,
    brand: { '@type': 'Brand', name: 'Royal Nordic' },
    offers: offer,
    provider: { '@id': `${SITE}/#organization` },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Northern Lights Tours',
        item: `${SITE}/northern-lights-tours`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Guaranteed Northern Lights Tour',
        item: `${SITE}${PATH}`,
      },
    ],
  }

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does the Northern Lights guarantee mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If no Northern Lights are visible during your tour, we offer a free return trip on the next available date. See our Terms & Conditions for the full promise.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where do you pick us up?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer hotel pickup and drop-off in the Rovaniemi area. Exact pickup time is confirmed after booking — please be ready 10–30 minutes before the standard 18:30 pickup window.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long is the tour?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Duration is flexible based on aurora forecasts — typically around six hours, and between about 2 and 12 hours when we need to travel farther for clearer skies.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is this suitable for children?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Children are welcome. Child pricing applies for ages 0–17. The evening can be long and cold outdoors, so warm clothing and stamina matter more than age alone.',
        },
      },
      {
        '@type': 'Question',
        name: 'When is the season?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'This aurora hunt runs in the Northern Lights season, typically from mid-September through mid-April from Rovaniemi in Finnish Lapland.',
        },
      },
    ],
  }

  return [
    { id: 'product', data: product },
    { id: 'breadcrumb', data: breadcrumb },
    { id: 'nl-faq', data: faq },
  ]
}

function main() {
  const indexPath = path.join(distDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('prerender-routes: dist/index.html missing — run vite build first')
    process.exit(1)
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf8')
  const canonical = `${SITE}${PATH}`
  let html = replaceMeta(baseHtml, {
    title: TITLE,
    description: DESCRIPTION,
    canonical,
    ogImage: OG_IMAGE,
  })
  html = injectJsonLd(html, buildNlJsonLd())

  // Lightweight crawlable landmark (SPA still mounts into #root).
  if (!html.includes('id="prerender-nl-landmark"')) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>
    <noscript>
      <div id="prerender-nl-landmark">
        <h1>Guaranteed Northern Lights Tour</h1>
        <p>${DESCRIPTION}</p>
        <p><a href="${canonical}">Book the Guaranteed Northern Lights Tour in Rovaniemi</a></p>
      </div>
    </noscript>`
    )
  }

  const outDir = path.join(distDir, 'northern-lights-tour')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'index.html')
  fs.writeFileSync(outPath, html, 'utf8')
  console.log(`prerender-routes: wrote ${path.relative(root, outPath)}`)
}

main()
