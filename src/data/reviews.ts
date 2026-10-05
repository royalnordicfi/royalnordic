/**
 * Curated real guest reviews already present in the Royal Nordic codebase
 * (GetYourGuide / verified bookings). Do not invent or alter meaning.
 */
export type RnReview = {
  id: string
  name: string
  quote: string
  source: 'GetYourGuide' | 'Verified booking'
  location?: string
  date?: string
  /** Which product context this review may be shown on */
  products: Array<'northern-lights' | 'general' | 'day-tours'>
}

export const RN_REVIEWS: RnReview[] = [
  {
    id: 'yen',
    name: 'Yen',
    quote:
      'Miro was an incredible and knowledgeable guide who drove us all the way to Sweden to see the lights (which we did). We were very lucky to get him as our guide, as all the other tour companies cancelled on us beforehand due to poor weather forecasts. Miro was very passionate and friendly as well. We were very happy with our entire experience — would highly recommend his company (Royal Nordic) if you’re trying to catch the lights. Thank you again!',
    source: 'Verified booking',
    location: 'United Kingdom',
    date: 'October 2026',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'javier',
    name: 'Javier',
    quote:
      'A really great experience. Our tour guide was very friendly, professional, and looked after us all night long. He went to great lengths to find the best conditions for seeing the aurora and explained everything to us very well. He also took some beautiful photos of us. A highly recommended experience in Rovaniemi.',
    source: 'Verified booking',
    location: 'Spain',
    date: 'September 2026',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'giulia',
    name: 'Giulia',
    quote:
      'What a wonderful experience! Miro was truly the best: friendly, helpful, and determined to make sure we saw the Northern Lights. He did everything he could to find the best conditions and even took some stunning photos of us. It’s clear that he truly cares about giving his guests a special experience. Thank you, Miro – an evening we’ll never forget!',
    source: 'Verified booking',
    location: 'Italy',
    date: 'September 2026',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'elena',
    name: 'Elena Gonzalez',
    quote:
      'An incredible experience! The guides went out of their way to find us the best spot, and thanks to their efforts, we enjoyed spectacular auroras. They helped us take some amazing photos. 100% recommended!',
    source: 'Verified booking',
    location: 'Spain',
    date: 'March 2026',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'gyg-italy-mar26',
    name: 'GetYourGuide Traveler',
    quote:
      'A FANTASTIC experience!!! Everything was organized to perfection. We were lucky to only have to drive 30 minutes to find the aurora, but our guide was willing to drive indefinitely!! We really appreciated the pick-up service, and the photo shoot was included! I would recommend it to everyone.',
    source: 'GetYourGuide',
    location: 'Italy',
    date: 'March 2026',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'angie',
    name: 'Angie',
    quote:
      'Miro was an amazing tour guide, he made sure we were comfortable the whole trip and was very attentive and open to chat about his culture and country. We had a great time and saw the most amazing northern lights we could ever ask for, he made everything he could to help us see them, we drove almost 4 hours to the north to chase them (he is a very safe driver) and then he took some amazing pictures for us.',
    source: 'Verified booking',
    location: 'Colombia',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'sarah',
    name: 'Sarah',
    quote:
      'So glad we booked this experience! Miro went above and beyond to make sure we got to witness the northern lights, he made sure everyone was safe and that we all had a great evening. At some points we waited in the van so we kept warm and he came to get us out when the lights appeared. The hot juice was just what was needed to warm us up!',
    source: 'Verified booking',
    location: 'United Kingdom',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'maria',
    name: 'Maria Fuertes',
    quote:
      'Miro took us to Sweden because it was the best place to see them. He took several shots with the camera. On our way back, he stopped again at another spot to get a better look at them, even though it wasn’t planned. It was awesome!',
    source: 'Verified booking',
    location: 'Italy',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'gyg-turkey',
    name: 'GetYourGuide Traveler',
    quote:
      'I chose a guaranteed tour because the weather was cloudy in the Rovaniemi region and it was my last day. Mico took us to very nice locations by instantly tracking the possibility of aurora and the cloud situation… At first, the lights were insufficient, but he took us around until we saw a big explosion, and finally, we could see the lights dancing in the sky.',
    source: 'GetYourGuide',
    location: 'Turkey',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'ashwini',
    name: 'Ashwini',
    quote:
      'The guide is amazing. He took us to various spots to get best views. Amazing driving skills, interactive and took photos with lot of patience. It is a hard job in this weather and the trip was totally worth the money.',
    source: 'Verified booking',
    location: 'United Kingdom',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'abdullah',
    name: 'Abdullah',
    quote:
      'We had a wonderful time with Walter, he was doing a lot of effort to visit many spots for helping us to see aurora. Also he provided us so much information about the most popular activities in Rovaniemi.',
    source: 'Verified booking',
    date: 'February 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'jimil',
    name: 'Jimil',
    quote:
      'Even though we didn’t spot the lights at first, Miro’s dedication and enthusiasm made all the difference — we finally witnessed the beautiful display on our way back! We’ll happily recommend this tour to anyone hoping to see the Northern Lights.',
    source: 'Verified booking',
    location: 'United Kingdom',
    date: 'November 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'landa',
    name: 'Landa',
    quote:
      'Fabulous! Guide was very accommodating of a last minute reservation. He picked us up early and got us to a spot to make sure we could see the northern lights. He talked with us about Finland and let us get a feel for the culture. He brought the van over as a warming hut as well.',
    source: 'Verified booking',
    date: 'March 2025',
    products: ['northern-lights', 'general'],
  },
  {
    id: 'laura',
    name: 'Laura',
    quote: 'The tour is highly recommended. The small group size and the tour guide made it a fantastic experience.',
    source: 'Verified booking',
    location: 'Germany',
    date: 'November 2025',
    products: ['northern-lights', 'general', 'day-tours'],
  },
  {
    id: 'alba',
    name: 'Alba',
    quote:
      'The tour was great. The waterfalls were already frozen and the views were breathtaking. The guide was really good and super friendly!',
    source: 'Verified booking',
    location: 'Spain',
    date: 'November 2025',
    products: ['day-tours'],
  },
]

export function reviewsFor(
  product: RnReview['products'][number],
  limit = 8
): RnReview[] {
  return RN_REVIEWS.filter((r) => r.products.includes(product)).slice(0, limit)
}
