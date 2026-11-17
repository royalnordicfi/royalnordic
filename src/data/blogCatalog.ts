/**
 * Shared catalog for blog index cards, related-article rails, and article imagery.
 * Keep slugs in sync with App.tsx routes.
 */

export type BlogCatalogEntry = {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: string
  image: string
  imageAlt: string
}

export const BLOG_CATALOG: BlogCatalogEntry[] = [
  {
    slug: 'best-time-northern-lights-lapland-2025',
    title: 'Best Time to See Northern Lights in Lapland',
    excerpt:
      'Optimal months and conditions for the Aurora Borealis — darkness, weather, and practical viewing tips from Rovaniemi.',
    category: 'Northern Lights',
    readTime: '5 min',
    image: '/lights5.jpg',
    imageAlt: 'Northern Lights over a snowy Lapland forest',
  },
  {
    slug: 'what-to-pack-lapland-winter-adventure',
    title: 'What to Pack for a Lapland Winter Adventure',
    excerpt: 'Thermal layers, footwear, and camera gear for Arctic winter conditions.',
    category: 'Travel Tips',
    readTime: '4 min',
    image: '/snowshoe2.jpg',
    imageAlt: 'Winter travellers prepared for Lapland outdoors',
  },
  {
    slug: 'northern-lights-photography-tips-beginners',
    title: 'Northern Lights Photography Tips for Beginners',
    excerpt: 'Camera settings and simple composition for first-time night photographers.',
    category: 'Photography',
    readTime: '6 min',
    image: '/nortti9.jpg',
    imageAlt: 'Aurora display ideal for night photography',
  },
  {
    slug: 'lapland-wildlife-animals-ranua-zoo',
    title: 'Lapland Wildlife: Animals You Can See at Ranua Zoo',
    excerpt: 'Brown bears to Arctic foxes — what to expect at Ranua Wildlife Park.',
    category: 'Wildlife',
    readTime: '4 min',
    image: '/ranua1.jpg',
    imageAlt: 'Wildlife at Ranua Wildlife Park in Finnish Lapland',
  },
  {
    slug: 'traditional-ice-fishing-finnish-lapland',
    title: 'Traditional Ice Fishing in Finnish Lapland',
    excerpt: 'How ice fishing works — technique, equipment, and why it remains a favourite day trip.',
    category: 'Activities',
    readTime: '5 min',
    image: '/icefishing2.jpg',
    imageAlt: 'Ice fishing on a frozen lake in Lapland',
  },
  {
    slug: 'snowshoe-adventure-exploring-lapland-wilderness',
    title: "Snowshoe Adventure: Exploring Lapland's Wilderness",
    excerpt: 'Equipment, trails, and quiet Arctic forests on foot.',
    category: 'Adventure',
    readTime: '4 min',
    image: '/snowshoe1.jpg',
    imageAlt: 'Snowshoeing through a snowy Lapland forest',
  },
  {
    slug: 'lapland-winter-activities-complete-guide',
    title: 'Lapland Winter Activities: Arctic Adventures Guide',
    excerpt: 'Aurora hunting, snowshoeing, ice fishing, and more — a clear winter overview.',
    category: 'Travel Guide',
    readTime: '8 min',
    image: '/lights4.jpg',
    imageAlt: 'Winter activities under the Northern Lights in Lapland',
  },
  {
    slug: 'what-to-wear-lapland-winter-clothing-guide',
    title: 'What to Wear in Lapland: Winter Clothing Guide',
    excerpt: 'Layering for Arctic winter — gear that works down to −30°C.',
    category: 'Travel Guide',
    readTime: '7 min',
    image: '/snowshoe3.jpg',
    imageAlt: 'Winter clothing for outdoor adventures in Lapland',
  },
  {
    slug: 'best-time-visit-lapland-seasonal-guide',
    title: 'Best Time to Visit Lapland: Seasonal Guide',
    excerpt: 'Month-by-month guidance for lights, activities, weather, and crowds.',
    category: 'Travel Guide',
    readTime: '9 min',
    image: '/lights6.jpg',
    imageAlt: 'Seasonal Lapland landscape under winter skies',
  },
  {
    slug: 'where-to-stay-lapland-accommodation-guide',
    title: 'Where to Stay in Lapland: Accommodation Guide',
    excerpt: 'Hotels, cabins, and Arctic stays around Rovaniemi.',
    category: 'Accommodation',
    readTime: '10 min',
    image: '/slideshow2.jpg',
    imageAlt: 'Winter accommodation setting in Finnish Lapland',
  },
  {
    slug: 'glass-igloos-lapland-complete-guide',
    title: 'Glass Igloos in Lapland: Sleeping Under the Northern Lights',
    excerpt: 'What glass igloo stays involve — resorts, booking tips, and expectations.',
    category: 'Accommodation',
    readTime: '8 min',
    image: '/lights8.jpg',
    imageAlt: 'Northern Lights filling the night sky over Lapland',
  },
  {
    slug: 'finnish-cabins-lapland-authentic-guide',
    title: 'Traditional Finnish Cabins in Lapland',
    excerpt: 'Log cabins — types, what’s included, and tips for an authentic stay.',
    category: 'Accommodation',
    readTime: '7 min',
    image: '/slideshow3.jpg',
    imageAlt: 'Snowy Lapland landscape suited to cabin stays',
  },
]

export function getBlogEntry(slug: string): BlogCatalogEntry | undefined {
  return BLOG_CATALOG.find((p) => p.slug === slug)
}

/** Related guides excluding the current slug — same category first, then fill. */
export function relatedBlogEntries(slug: string, limit = 3): BlogCatalogEntry[] {
  const current = getBlogEntry(slug)
  const others = BLOG_CATALOG.filter((p) => p.slug !== slug)
  const same = others.filter((p) => current && p.category === current.category)
  const rest = others.filter((p) => !same.includes(p))
  return [...same, ...rest].slice(0, limit)
}

/** Default tour card imagery for related experience links. */
export const EXPERIENCE_CARD_IMAGES: Record<string, { image: string; alt: string }> = {
  '/northern-lights-tour': {
    image: '/nortti1.jpg',
    alt: 'Small group Northern Lights tour in Lapland',
  },
  '/northern-lights-tours': {
    image: '/nortti5.jpg',
    alt: 'Northern Lights tours from Rovaniemi',
  },
  '/family-friendly-northern-lights': {
    image: '/family1.jpg',
    alt: 'Family-friendly Northern Lights evening',
  },
  '/daytime-experiences': {
    image: '/korouoma1.jpg',
    alt: 'Daytime winter experiences in Lapland',
  },
  '/ice-fishing': {
    image: '/icefishing3.jpg',
    alt: 'Guided ice fishing in Finnish Lapland',
  },
  '/snowshoe-rental': {
    image: '/snowshoe4.jpg',
    alt: 'Snowshoe rental for Lapland trails',
  },
  '/ranua-zoo': {
    image: '/ranua2.jpeg',
    alt: 'Ranua Wildlife Park day trip',
  },
  '/customized-tour': {
    image: '/nordicci7.jpg',
    alt: 'Private customized Lapland experience',
  },
  '/renting-equipment': {
    image: '/snowshoe1.jpg',
    alt: 'Winter equipment rental in Rovaniemi',
  },
}
