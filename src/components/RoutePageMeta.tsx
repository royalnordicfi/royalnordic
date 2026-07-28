import { useLocation } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

const META: Record<string, { title: string; description: string; ogImage?: string }> = {
  '/': {
    title: 'Royal Nordic | Lavish Experiences in Lapland — Northern Lights Tours Rovaniemi',
    description:
      'Premium Lapland tours from Rovaniemi: guaranteed Northern Lights, ice fishing, Ranua Zoo, Korouoma Canyon, and private transfers. Book direct.',
  },
  '/northern-lights-tour': {
    title: 'Guaranteed Northern Lights Tour Rovaniemi | Royal Nordic',
    description:
      'Small-group aurora hunt from Rovaniemi with hotel pickup, English & Finnish guides, flexible 2–10 hour duration. Free cancellation 24h. Book & pay securely.',
    ogImage: 'https://royalnordic.fi/nortti1.jpg',
  },
  '/family-friendly-northern-lights': {
    title: 'Family-Friendly Northern Lights Tour Rovaniemi | Royal Nordic',
    description:
      '2-hour family aurora tour from Rovaniemi: hotel pickup, English & Finnish guide, hot drinks. Aurora not guaranteed. Free cancellation 24h.',
  },
  '/northern-lights-tours': {
    title: 'Northern Lights Tours Rovaniemi | Royal Nordic',
    description:
      'Compare guaranteed and family-friendly aurora experiences from Royal Nordic in Rovaniemi, Finnish Lapland.',
  },
  '/ice-fishing': {
    title: 'Ice Fishing Tour Rovaniemi | Royal Nordic',
    description:
      'Traditional Lapland ice fishing on frozen lakes near Rovaniemi with guide, equipment, and hot drinks. Book online.',
  },
  '/ranua-zoo': {
    title: 'Ranua Wildlife Park Tour from Rovaniemi | Royal Nordic',
    description:
      'Visit Ranua Zoo — polar bears, arctic foxes, and Nordic wildlife — with hotel pickup from Rovaniemi.',
  },
  '/korouoma-canyon': {
    title: 'Korouoma Canyon Tour from Rovaniemi | Royal Nordic',
    description:
      '6-hour canyon hike to frozen waterfalls from Rovaniemi: hotel pickup, English & Finnish guide, campfire picnic. Free cancellation 24h. Book & pay securely.',
  },
  '/snowshoe-rental': {
    title: 'Snowshoe Adventure Rovaniemi | Royal Nordic',
    description: 'Quality snowshoe experiences in Lapland near Rovaniemi. Book your date online.',
  },
  '/daytime-experiences': {
    title: 'Daytime Experiences Lapland | Royal Nordic',
    description: 'Ice fishing, Ranua Zoo, Korouoma Canyon, and snowmobile safari options from Rovaniemi.',
  },
  '/renting-equipment': {
    title: 'Equipment Rental Lapland | Royal Nordic',
    description: 'Rent quality snowshoe and outdoor equipment for your Lapland adventure.',
  },
  '/customized-tour': {
    title: 'Customized Private Tours Lapland | Royal Nordic',
    description: 'Request a tailored Lapland experience — private groups, flexible itineraries, quote within 24 hours.',
  },
  '/snowmobile-safari': {
    title: 'Snowmobile Safari Rovaniemi | Request Availability | Royal Nordic',
    description: 'Partner snowmobile safari near Rovaniemi. Request availability and a personalized quote.',
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
  '/privacy-policy': {
    title: 'Privacy Policy | Royal Nordic',
    description: 'How Royal Nordic handles personal data for bookings and website visitors.',
  },
  '/terms-conditions': {
    title: 'Terms & Conditions | Royal Nordic',
    description: 'Booking terms, cancellation policy, and Northern Lights guarantee details for Royal Nordic tours.',
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
  })

  return null
}
