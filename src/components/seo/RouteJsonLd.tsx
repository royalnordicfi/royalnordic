import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import JsonLd from './JsonLd'
import {
  buildGuaranteedNlBreadcrumbJsonLd,
  buildGuaranteedNlProductJsonLd,
  GUARANTEED_NL_PATH,
} from '../../seo/guaranteedNorthernLightsTour'

const SITE = 'https://royalnordic.fi'

const organization = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  '@id': `${SITE}/#organization`,
  name: 'Royal Nordic',
  url: SITE,
  logo: `${SITE}/royalnordiclogotransparent.png`,
  image: `${SITE}/nortti1.jpg`,
  description:
    'Premium Lapland tours from Rovaniemi — Northern Lights, daytime adventures, and private transfers in Finnish Lapland.',
  telephone: '+3584578345138',
  email: 'contact@royalnordic.fi',
  priceRange: '€59-€399',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Rovaniemi',
    addressRegion: 'Lapland',
    addressCountry: 'FI',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 66.5039,
    longitude: 25.7294,
  },
  areaServed: {
    '@type': 'City',
    name: 'Rovaniemi',
  },
  sameAs: [
    'https://www.instagram.com/royalnordic.fi/',
    'https://www.tiktok.com/@royalnordic',
  ],
}

type ProductDef = {
  path: string
  name: string
  description: string
  image: string
  price: number
  breadcrumbs: { name: string; path: string }[]
}

const PRODUCTS: ProductDef[] = [
  {
    path: '/family-friendly-northern-lights',
    name: 'Family-Friendly Northern Lights Tour',
    description:
      '2-hour family aurora evening from Rovaniemi with hotel pickup, warm drinks, and an English & Finnish guide. Aurora not guaranteed.',
    image: `${SITE}/family1.jpg`,
    price: 79,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Northern Lights Tours', path: '/northern-lights-tours' },
      { name: 'Family-Friendly Northern Lights Tour', path: '/family-friendly-northern-lights' },
    ],
  },
  {
    path: '/ice-fishing',
    name: 'Ice Fishing Experience',
    description:
      'Traditional Lapland ice fishing on frozen lakes near Rovaniemi with guide, equipment, and hot drinks.',
    image: `${SITE}/icefishing2.jpg`,
    price: 119,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Daytime Experiences', path: '/daytime-experiences' },
      { name: 'Ice Fishing Experience', path: '/ice-fishing' },
    ],
  },
  {
    path: '/ranua-zoo',
    name: 'Nordic Animals of Ranua Zoo',
    description:
      'Day trip from Rovaniemi to Ranua Wildlife Park with hotel pickup, entrance tickets, and Arctic wildlife.',
    image: `${SITE}/ranua1.jpg`,
    price: 99,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Daytime Experiences', path: '/daytime-experiences' },
      { name: 'Ranua Wildlife Park Tour', path: '/ranua-zoo' },
    ],
  },
  {
    path: '/korouoma-canyon',
    name: 'Korouoma Canyon Winter Adventure',
    description:
      '6-hour canyon hike to frozen waterfalls from Rovaniemi with hotel pickup, guide, and campfire picnic.',
    image: `${SITE}/korouoma1.jpg`,
    price: 129,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Daytime Experiences', path: '/daytime-experiences' },
      { name: 'Korouoma Canyon Tour', path: '/korouoma-canyon' },
    ],
  },
  {
    path: '/snowshoe-rental',
    name: 'Snowshoe Adventure',
    description:
      'Quality snowshoe rental delivered to your accommodation in Rovaniemi for independent Lapland exploration.',
    image: `${SITE}/snowshoe1.jpg`,
    price: 79,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Renting Equipment', path: '/renting-equipment' },
      { name: 'Snowshoe Adventure', path: '/snowshoe-rental' },
    ],
  },
]

function breadcrumbList(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE}${crumb.path === '/' ? '' : crumb.path}`,
    })),
  }
}

function productOffer(product: ProductDef) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    url: `${SITE}${product.path}`,
    brand: {
      '@type': 'Brand',
      name: 'Royal Nordic',
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE}${product.path}`,
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2027-04-15',
    },
    provider: {
      '@id': `${SITE}/#organization`,
    },
  }
}

/**
 * Site-wide Organization / TravelAgency JSON-LD plus per-route Product + BreadcrumbList.
 */
export default function RouteJsonLd() {
  const { pathname } = useLocation()
  const product = PRODUCTS.find((p) => p.path === pathname)

  const website = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Royal Nordic',
      url: SITE,
      description:
        'Premium Lapland tours and Northern Lights adventures in Rovaniemi, Finnish Lapland.',
      publisher: { '@id': `${SITE}/#organization` },
    }),
    []
  )

  const isGuaranteedNl = pathname === GUARANTEED_NL_PATH

  return (
    <>
      <JsonLd id="organization" data={organization} />
      <JsonLd id="website" data={website} />
      {isGuaranteedNl && (
        <>
          <JsonLd id="product" data={buildGuaranteedNlProductJsonLd()} />
          <JsonLd id="breadcrumb" data={buildGuaranteedNlBreadcrumbJsonLd()} />
        </>
      )}
      {product && (
        <>
          <JsonLd id="product" data={productOffer(product)} />
          <JsonLd id="breadcrumb" data={breadcrumbList(product.breadcrumbs)} />
        </>
      )}
    </>
  )
}
