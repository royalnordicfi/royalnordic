import React from 'react'
import { Link } from 'react-router-dom'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const Blog: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: 'Best Time to See Northern Lights in Lapland',
      slug: 'best-time-northern-lights-lapland-2025',
      excerpt:
        'Optimal months and conditions for the Aurora Borealis in Finnish Lapland — weather patterns, darkness, and practical viewing tips.',
      readTime: '5 min read',
      category: 'Northern Lights',
      image: '/lights5.jpg',
    },
    {
      id: 2,
      title: 'What to Pack for a Lapland Winter Adventure',
      slug: 'what-to-pack-lapland-winter-adventure',
      excerpt:
        'Essential packing list for Arctic conditions — thermal layers, footwear, and camera gear for winter in Lapland.',
      readTime: '4 min read',
      category: 'Travel Tips',
      image: '/snowshoe2.jpg',
    },
    {
      id: 3,
      title: 'Northern Lights Photography Tips for Beginners',
      slug: 'northern-lights-photography-tips-beginners',
      excerpt:
        'Capture the Aurora with clear camera settings and simple composition techniques — built for first-time night photographers.',
      readTime: '6 min read',
      category: 'Photography',
      image: '/lights1.jpg',
    },
    {
      id: 4,
      title: 'Lapland Wildlife: Animals You Can See at Ranua Zoo',
      slug: 'lapland-wildlife-animals-ranua-zoo',
      excerpt:
        'Nordic animals from brown bears to Arctic foxes — what to expect at Ranua Wildlife Park near Rovaniemi.',
      readTime: '4 min read',
      category: 'Wildlife',
      image: '/ranua1.jpg',
    },
    {
      id: 5,
      title: 'Traditional Ice Fishing in Finnish Lapland',
      slug: 'traditional-ice-fishing-finnish-lapland',
      excerpt:
        'How ice fishing works in Lapland — techniques, equipment, and why this Arctic tradition remains a favourite day trip.',
      readTime: '5 min read',
      category: 'Activities',
      image: '/icefishing2.jpg',
    },
    {
      id: 6,
      title: "Snowshoe Adventure: Exploring Lapland's Wilderness",
      slug: 'snowshoe-adventure-exploring-lapland-wilderness',
      excerpt:
        'Snowshoeing in Lapland — equipment, trails, and how to explore quiet Arctic forests on foot.',
      readTime: '4 min read',
      category: 'Adventure',
      image: '/snowshoe1.jpg',
    },
    {
      id: 7,
      title: 'Lapland Winter Activities: Arctic Adventures Guide',
      slug: 'lapland-winter-activities-complete-guide',
      excerpt:
        'Northern Lights hunting, snowshoeing, ice fishing, and more — a clear overview of winter activities in Finnish Lapland.',
      readTime: '8 min read',
      category: 'Travel Guide',
      image: '/lights4.jpg',
    },
    {
      id: 8,
      title: 'What to Wear in Lapland: Winter Clothing Guide',
      slug: 'what-to-wear-lapland-winter-clothing-guide',
      excerpt:
        'Layering for Arctic winter — essential gear and what to pack for temperatures down to −30°C.',
      readTime: '7 min read',
      category: 'Travel Guide',
      image: '/snowshoe3.jpg',
    },
    {
      id: 9,
      title: 'Best Time to Visit Lapland: Seasonal Guide',
      slug: 'best-time-visit-lapland-seasonal-guide',
      excerpt:
        'Month-by-month guidance for Northern Lights, activities, weather, crowds, and pricing across the Lapland seasons.',
      readTime: '9 min read',
      category: 'Travel Guide',
      image: '/lights6.jpg',
    },
    {
      id: 10,
      title: 'Where to Stay in Lapland: Accommodation Guide',
      slug: 'where-to-stay-lapland-accommodation-guide',
      excerpt:
        'Hotels, cabins, and Arctic stays around Rovaniemi — how to choose lodging that fits your trip.',
      readTime: '10 min read',
      category: 'Accommodation',
      image: '/slideshow2.jpg',
    },
    {
      id: 11,
      title: 'Glass Igloos in Lapland: Sleeping Under the Northern Lights',
      slug: 'glass-igloos-lapland-complete-guide',
      excerpt:
        'What glass igloo stays involve — resorts, booking tips, and what to expect from this iconic Arctic night.',
      readTime: '8 min read',
      category: 'Accommodation',
      image: '/lights1.jpg',
    },
    {
      id: 12,
      title: 'Traditional Finnish Cabins in Lapland',
      slug: 'finnish-cabins-lapland-authentic-guide',
      excerpt:
        'Log cabins in Lapland — cabin types, what’s included, locations, and tips for an authentic Arctic stay.',
      readTime: '7 min read',
      category: 'Accommodation',
      image: '/slideshow3.jpg',
    },
  ]

  return (
    <div className="rn-page">
      <CategoryHero
        title="Lapland travel guides"
        subtitle="Practical tips on Northern Lights, packing, wildlife, and winter activities — written for visitors to Rovaniemi."
        image="/lights5.jpg"
        compact
      />

      <section className="rn-section-tight rn-hero-follow relative bg-midnight">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-80" aria-hidden />
        <div className="rn-container relative">
          <div className="rn-reveal mb-8 max-w-xl sm:mb-10">
            <p className="rn-eyebrow">Guides</p>
            <p className="rn-lede mt-3">
              Seasonal advice for aurora season, packing, wildlife, and where to stay — updated for
              visitors planning from Rovaniemi.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {blogPosts.map((post, i) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className={`group rn-reveal rn-blog-card rn-stagger-${(i % 4) + 1}`}
              >
                <div className="rn-blog-card__media rn-reveal-img">
                  <img
                    src={post.image}
                    alt=""
                    className="rn-blog-card__img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="rn-blog-card__shade" aria-hidden />
                </div>
                <div className="rn-blog-card__body">
                  <span className="rn-badge-aurora w-fit">{post.category}</span>
                  <h2 className="rn-blog-card__title">{post.title}</h2>
                  <p className="rn-blog-card__excerpt">{post.excerpt}</p>
                  <p className="rn-blog-card__meta">{post.readTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Blog
