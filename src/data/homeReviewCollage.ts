/**
 * Authentic guest reviews approved for the homepage collage.
 * Sourced from Google and GetYourGuide screenshots — do not invent or alter meaning.
 */
export type HomeCollageReview = {
  id: string
  name: string
  quote: string
  source: 'Google' | 'GetYourGuide'
  rating: 5
  location?: string
}

export const HOME_COLLAGE_REVIEWS: HomeCollageReview[] = [
  {
    id: 'joe-1128',
    name: 'Joe 1128',
    source: 'Google',
    rating: 5,
    quote:
      'We had an amazing aurora tour with Miro on Oct 21th, 2026! He was very knowledgeable about the Northern Lights and helped us with photography. Hot drinks and snacks were provided, and best of all, we got to see the beautiful aurora! The team welcomed us on time at the designated meeting point. We booked through GetYourGuide, and the tour was excellent value for money. Highly recommended!',
  },
  {
    id: 'vincent-cassar',
    name: 'Vincent Cassar',
    source: 'Google',
    rating: 5,
    quote:
      'An unforgettable Northern Lights experience! Miro was an excellent tour guide and made the entire experience absolutely amazing. He was friendly, knowledgeable, professional, and genuinely passionate about what he does. He went above and beyond to make sure we had the best possible chance of seeing the Northern Lights. If you’re looking for a Northern Lights tour in Lapland, I highly recommend booking with Miro.',
  },
  {
    id: 'claudia-lim',
    name: 'claudia lim',
    source: 'Google',
    rating: 5,
    quote:
      'posting my 5-star reviews across all the platforms i use because that’s how amazing the tour was! miro was such a stellar guide who knew just the right places to bring us to see the nothern lights. we travelled all the way from rovaniemi to sweden, and that’s where we saw it! it was such an incredible experience and i would highly recommend it to everyone wanting to chase the lights. thank you for making our trip so special 💞',
  },
  {
    id: 'cristina',
    name: 'Cristina',
    source: 'Google',
    rating: 5,
    quote:
      'Miro is an amazing guide, highly specialized and exceptionally well-informed about the aurora. It is obvious he truly loves what he does. Yesterday night was a wonderful experience; our entire family, kids and adults alike, returned home a little bit more educated and richer. Miro answered all of my 10-year-old son’s questions with patience and the demeanor of a great teacher. The aurora itself was spectacular. Thank you, Miro, from the whole family—we hope to see you in Malta one day! Kittos :-)',
  },
  {
    id: 'nazrene',
    name: 'nazrene',
    source: 'Google',
    rating: 5,
    quote:
      'I had an amazing experience. I was here only for a night and was able to book a tour immediately. Elias came to pick me up exactly on time and we had amazing sightings in 3 different spots. The price was also very reasonable. Unforgettable and will return for sure! Thank you',
  },
  {
    id: 'melanie-mcmath',
    name: 'Melanie McMath',
    source: 'Google',
    rating: 5,
    quote:
      'We had a fantastic night hunting the Aurora and it was a great show! Guide, photographer and driver were great and really helpful. A super experience.',
  },
  {
    id: 'sarah-tacetti',
    name: 'Sarah Tacetti',
    source: 'Google',
    rating: 5,
    quote:
      'Amazing expérience , Nice guide , everything was cool . I asked him to stop again at the end, because the lights was amazing at this moment ,he accepted and was searching for a Nice place too stop very quickly! We have many interesting conversations.',
  },
  {
    id: 'ajit-lenka',
    name: 'Ajit Lenka',
    source: 'Google',
    rating: 5,
    quote:
      'We had a really nice time, the guide drove us all the way to Sweden and got us to a spot with very visible auroras all around us. Overall this was a great experience I would recommend to anyone. A special shoutout to our guide Miro. He was very informative and helpful, explained us about aurora.',
  },
  {
    id: 'traveller-nikki',
    name: 'The Traveller Nikki',
    source: 'Google',
    rating: 5,
    quote:
      'Miro is an amazing tour guide. I got wonderful 2 days experience of Aurora Hunting with him. First day we made a trip with the lowest chance where most of the tour operations are cancelled due to cloud condition. After a further drive to Sweden for 3 hrs, the magical happened; not only we saw Northern Light but also the shooting stars. Second day I did it again with him and got to see the Aurora again, this time even by naked eyes. Obviously, I would recommend Aurora hunters to join his adventure.',
  },
  {
    id: 'gyg-ireland',
    name: 'GetYourGuide traveler',
    source: 'GetYourGuide',
    location: 'Ireland',
    rating: 5,
    quote:
      'Great tour, Daniel was great and offered every opportunity to take pictures. We visited 3 different locations to ensure we got good views and got very lucky! Also ensured they had gluten free snacks for me! Thanks Daniel',
  },
  {
    id: 'javit-colombia',
    name: 'Javit',
    source: 'GetYourGuide',
    location: 'Colombia',
    rating: 5,
    quote:
      'Excellent, best experience ever , I recommend this tour 100% , I was able to see the northern lights with my eyes , they found the best place to see it',
  },
  {
    id: 'regine-germany',
    name: 'Regine',
    source: 'GetYourGuide',
    location: 'Germany',
    rating: 5,
    quote:
      'Top ***** Wir würde diese Northern Lights Tour jederzeit mit Royal Nordic wiederholen. War ein tolles Erlebnis!',
  },
  {
    id: 'floriana-italy',
    name: 'Floriana',
    source: 'GetYourGuide',
    location: 'Italy',
    rating: 5,
    quote:
      'Era tutto perfetto, le nostre guide disponibilissimi e cordiali. Esperienza bellissima. Ci hanno scattato innumerevoli fotografie. Niente da migliorare. Voto 10',
  },
  {
    id: 'pilar-chile',
    name: 'Pilar',
    source: 'GetYourGuide',
    location: 'Chile',
    rating: 5,
    quote: 'They show they know that are doing. It was a great time, they are so kind. We recommend it',
  },
  {
    id: 'da-silva-belgium',
    name: 'da Silva',
    source: 'GetYourGuide',
    location: 'Belgium',
    rating: 5,
    quote:
      'Une expérience magnifique. Notre chauffeur a été au top et après plusieurs kilomètres à la recherche des aurores boréales, il nous a trouvé un excellent spot. Il nous a fait des magnifiques photos. Je recommande cette activité.',
  },
  {
    id: 'melanie-uk',
    name: 'Melanie',
    source: 'GetYourGuide',
    location: 'Great Britain',
    rating: 5,
    quote:
      'Such a great experience - guide was knowledgable and helpful. Searched for the lights and what a great show they put on!',
  },
  {
    id: 'gyg-japan',
    name: 'GetYourGuide traveler',
    source: 'GetYourGuide',
    location: 'Japan',
    rating: 5,
    quote:
      'ガイドさんが優しく、希望を聞いてくれたり、提案してくれたり配慮があった。オーロラポイントも最高でした。最後に頂いたホットベリージュースも美味しかった方です♪',
  },
]

/** Split into two balanced rows for opposing marquees. */
export function homeCollageRows(): [HomeCollageReview[], HomeCollageReview[]] {
  const a: HomeCollageReview[] = []
  const b: HomeCollageReview[] = []
  HOME_COLLAGE_REVIEWS.forEach((review, i) => {
    ;(i % 2 === 0 ? a : b).push(review)
  })
  return [a, b]
}
