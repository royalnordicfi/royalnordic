import { useLocation } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const META: Record<
  string,
  { title: string; description: string; ogImage?: string; noIndex?: boolean }
> = {
  '/': {
    title: 'Royal Nordic | Lavish Experiences in Lapland — Northern Lights Tours Rovaniemi',
    description:
      'Premium Lapland tours from Rovaniemi: guaranteed Northern Lights, ice fishing, Ranua Zoo, Korouoma Canyon, and private transfers. Book direct.',
    ogImage: 'https://royalnordic.fi/nortti1.jpg',
  },
  '/northern-lights-tour': {
    title: 'Guaranteed Northern Lights Tour Rovaniemi | Royal Nordic',
    description:
      'Small-group aurora hunt from Rovaniemi with hotel pickup, English & Finnish guides, flexible 2–12 hour duration. Free cancellation 24h. Book & pay securely.',
    ogImage: 'https://royalnordic.fi/nortti1.jpg',
  },
  '/family-friendly-northern-lights': {
    title: 'Family-Friendly Northern Lights Tour Rovaniemi | Royal Nordic',
    description:
      '2-hour family aurora tour from Rovaniemi: hotel pickup, English & Finnish guide, hot drinks. Aurora not guaranteed. Free cancellation 24h.',
    ogImage: 'https://royalnordic.fi/family1.jpg',
  },
  '/northern-lights-tours': {
    title: 'Northern Lights Tours Rovaniemi | Royal Nordic',
    description:
      'Compare guaranteed and family-friendly aurora experiences from Royal Nordic in Rovaniemi, Finnish Lapland.',
    ogImage: 'https://royalnordic.fi/nortti5.jpg',
  },
  '/ice-fishing': {
    title: 'Ice Fishing Tour Rovaniemi | Royal Nordic',
    description:
      'Traditional Lapland ice fishing on frozen lakes near Rovaniemi with guide, equipment, and hot drinks. Free cancellation 24h. Book online.',
    ogImage: 'https://royalnordic.fi/icefishing2.jpg',
  },
  '/ranua-zoo': {
    title: 'Ranua Wildlife Park Tour from Rovaniemi | Royal Nordic',
    description:
      'About 5-hour Ranua Wildlife Park day trip from Rovaniemi: hotel pickup, entrance tickets, polar bears and 50+ Arctic species. Free cancellation 24h.',
    ogImage: 'https://royalnordic.fi/ranua1.jpg',
  },
  '/korouoma-canyon': {
    title: 'Korouoma Canyon Tour from Rovaniemi | Royal Nordic',
    description:
      '6-hour canyon hike to frozen waterfalls from Rovaniemi: hotel pickup, English & Finnish guide, campfire picnic. Free cancellation 24h. Book & pay securely.',
    ogImage: 'https://royalnordic.fi/korouoma1.jpg',
  },
  '/snowshoe-rental': {
    title: 'Snowshoe Rental Rovaniemi | Royal Nordic',
    description:
      'Quality snowshoe rental delivered to your accommodation in Rovaniemi. Explore Lapland at your own pace. Book your date online.',
    ogImage: 'https://royalnordic.fi/snowshoe1.jpg',
  },
  '/daytime-experiences': {
    title: 'Daytime Experiences Lapland | Royal Nordic',
    description: 'Ice fishing, Ranua Zoo, Korouoma Canyon, and snowmobile safari options from Rovaniemi.',
    ogImage: 'https://royalnordic.fi/icefishing3.jpg',
  },
  '/renting-equipment': {
    title: 'Equipment Rental Lapland | Royal Nordic',
    description: 'Rent quality snowshoes for your Lapland adventure — delivery to your lodging in Rovaniemi.',
    ogImage: 'https://royalnordic.fi/snowshoe2.jpg',
  },
  '/customized-tour': {
    title: 'Customized Private Tours Lapland | Royal Nordic',
    description: 'Request a tailored Lapland experience — private groups, flexible itineraries, quote within 24 hours.',
  },
  '/snowmobile-safari': {
    title: 'Snowmobile Safari Rovaniemi | Request Availability | Royal Nordic',
    description: 'Partner snowmobile safari near Rovaniemi. Request availability and a personalized quote.',
    ogImage: 'https://royalnordic.fi/snowmobiling.jpg',
  },
  '/monster-truck-northern-lights': {
    title: 'Monster Truck Northern Lights | Request Availability | Royal Nordic',
    description: 'Partner monster-truck aurora experience from Rovaniemi. Request availability and a quote.',
  },
  '/transportation': {
    title: 'Private Transportation Lapland | Royal Nordic',
    description: 'Private transfers between Rovaniemi, Levi, Kittilä, and customized Lapland routes.',
  },
  '/transportation-rovaniemi-levi': {
    title: 'Rovaniemi to Levi Private Transfer | Royal Nordic',
    description: 'Private transportation between Rovaniemi and Levi / Kittilä. Request a quote.',
  },
  '/transportation-customized': {
    title: 'Custom Private Transfer Lapland | Royal Nordic',
    description: 'Customized private transportation across Finnish Lapland. Request a personalized quote.',
  },
  '/blog': {
    title: 'Lapland Travel Blog | Royal Nordic',
    description: 'Guides to Northern Lights, packing, seasons, and the best things to do in Finnish Lapland.',
  },
  '/blog/best-time-northern-lights-lapland-2025': {
    title: 'Best Time for Northern Lights in Lapland | Royal Nordic',
    description: 'When to see the Aurora Borealis in Finnish Lapland — seasons, weather, and practical tips from Rovaniemi guides.',
  },
  '/blog/what-to-pack-lapland-winter-adventure': {
    title: 'What to Pack for Lapland Winter | Royal Nordic',
    description: 'Practical packing list for Lapland winters — layers, boots, and essentials for Northern Lights and daytime tours.',
  },
  '/blog/northern-lights-photography-tips-beginners': {
    title: 'Northern Lights Photography Tips for Beginners | Royal Nordic',
    description: 'Simple aurora photography tips for beginners visiting Rovaniemi and Finnish Lapland.',
  },
  '/blog/lapland-wildlife-animals-ranua-zoo': {
    title: 'Lapland Wildlife & Ranua Zoo Guide | Royal Nordic',
    description: 'Meet Arctic animals around Rovaniemi — polar bears, reindeer, and what to expect at Ranua Wildlife Park.',
  },
  '/blog/traditional-ice-fishing-finnish-lapland': {
    title: 'Traditional Ice Fishing in Finnish Lapland | Royal Nordic',
    description: 'How ice fishing works in Lapland — what to expect on a guided winter fishing experience from Rovaniemi.',
  },
  '/blog/snowshoe-adventure-exploring-lapland-wilderness': {
    title: 'Snowshoe Adventure in Lapland | Royal Nordic',
    description: 'Explore Lapland’s winter trails on snowshoes — tips for independent adventures near Rovaniemi.',
  },
  '/blog/lapland-winter-activities-complete-guide': {
    title: 'Lapland Winter Activities Guide | Royal Nordic',
    description: 'A practical guide to winter activities in Finnish Lapland — Northern Lights, daytime tours, and more.',
  },
  '/blog/what-to-wear-lapland-winter-clothing-guide': {
    title: 'What to Wear in Lapland Winter | Royal Nordic',
    description: 'Clothing guide for Lapland winters — layers, boots, and how to stay warm on outdoor tours.',
  },
  '/blog/best-time-visit-lapland-seasonal-guide': {
    title: 'Best Time to Visit Lapland | Royal Nordic',
    description: 'Seasonal guide to visiting Finnish Lapland — Northern Lights season, snow, and family-friendly timing.',
  },
  '/blog/where-to-stay-lapland-accommodation-guide': {
    title: 'Where to Stay in Lapland | Royal Nordic',
    description: 'Accommodation ideas for Lapland trips — hotels, cabins, and what works for Rovaniemi-based tours.',
  },
  '/blog/glass-igloos-lapland-complete-guide': {
    title: 'Glass Igloos in Lapland Guide | Royal Nordic',
    description: 'What to know about glass igloo stays in Lapland — timing, expectations, and nearby experiences.',
  },
  '/blog/finnish-cabins-lapland-authentic-guide': {
    title: 'Finnish Cabins in Lapland Guide | Royal Nordic',
    description: 'Authentic Finnish cabin stays in Lapland — what to expect and how to plan around winter tours.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy | Royal Nordic',
    description: 'How Royal Nordic handles personal data for bookings and website visitors.',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions | Royal Nordic',
    description: 'Booking terms, cancellation policy, and Northern Lights guarantee details for Royal Nordic tours.',
  },
  '/payment-success': {
    title: 'Payment Successful | Royal Nordic',
    description: 'Your Royal Nordic booking payment was successful.',
    noIndex: true,
  },
  '/crypto-payment-success': {
    title: 'Crypto Booking Received | Royal Nordic',
    description: 'Your Royal Nordic crypto booking request was received.',
    noIndex: true,
  },
}

/**
 * Sets document title / meta from the current React Router path.
 */
export default function RoutePageMeta() {
  const { pathname } = useLocation()
  const entry = META[pathname]
  const title = entry?.title ?? 'Royal Nordic | Lavish Experiences in Lapland'
  const description =
    entry?.description ??
    'Premium Lapland tours and Northern Lights adventures in Rovaniemi, Finland.'

  usePageMeta({
    title,
    description,
    canonicalPath: pathname || '/',
    ogImage: entry?.ogImage,
    noIndex: entry?.noIndex,
  })

  return null
}
