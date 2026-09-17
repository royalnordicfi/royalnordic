import React from 'react'
import { Link } from 'react-router-dom'
import Footer from './Footer'

const blogPosts = [
  {
    id: 1,
    title: 'Best Time to See Northern Lights in Lapland',
    slug: 'best-time-northern-lights-lapland-2025',
    excerpt:
      'Optimal months and conditions for the Aurora Borealis — darkness, weather, and practical viewing tips from Rovaniemi.',
    readTime: '5 min',
    category: 'Northern Lights',
    image: '/lights5.jpg',
  },
  {
    id: 2,
    title: 'What to Pack for a Lapland Winter Adventure',
    slug: 'what-to-pack-lapland-winter-adventure',
    excerpt: 'Thermal layers, footwear, and camera gear for Arctic winter conditions.',
    readTime: '4 min',
    category: 'Travel Tips',
    image: '/snowshoe2.jpg',
  },
  {
    id: 3,
    title: 'Northern Lights Photography Tips for Beginners',
    slug: 'northern-lights-photography-tips-beginners',
    excerpt: 'Camera settings and simple composition for first-time night photographers.',
    readTime: '6 min',
    category: 'Photography',
    image: '/lights1.jpg',
  },
  {
    id: 4,
    title: 'Lapland Wildlife: Animals You Can See at Ranua Zoo',
    slug: 'lapland-wildlife-animals-ranua-zoo',
    excerpt: 'Brown bears to Arctic foxes — what to expect at Ranua Wildlife Park.',
    readTime: '4 min',
    category: 'Wildlife',
    image: '/ranua1.jpg',
  },
  {
    id: 5,
    title: 'Traditional Ice Fishing in Finnish Lapland',
    slug: 'traditional-ice-fishing-finnish-lapland',
    excerpt: 'How ice fishing works — technique, equipment, and why it remains a favourite day trip.',
    readTime: '5 min',
    category: 'Activities',
    image: '/icefishing2.jpg',
  },
  {
    id: 6,
    title: "Snowshoe Adventure: Exploring Lapland's Wilderness",
    slug: 'snowshoe-adventure-exploring-lapland-wilderness',
    excerpt: 'Equipment, trails, and quiet Arctic forests on foot.',
    readTime: '4 min',
    category: 'Adventure',
    image: '/snowshoe1.jpg',
  },
  {
    id: 7,
    title: 'Lapland Winter Activities: Arctic Adventures Guide',
    slug: 'lapland-winter-activities-complete-guide',
    excerpt: 'Aurora hunting, snowshoeing, ice fishing, and more — a clear winter overview.',
    readTime: '8 min',
    category: 'Travel Guide',
    image: '/lights4.jpg',
  },
  {
    id: 8,
    title: 'What to Wear in Lapland: Winter Clothing Guide',
    slug: 'what-to-wear-lapland-winter-clothing-guide',
    excerpt: 'Layering for Arctic winter — gear that works down to −30°C.',
    readTime: '7 min',
    category: 'Travel Guide',
    image: '/snowshoe3.jpg',
  },
  {
    id: 9,
    title: 'Best Time to Visit Lapland: Seasonal Guide',
    slug: 'best-time-visit-lapland-seasonal-guide',
    excerpt: 'Month-by-month guidance for lights, activities, weather, and crowds.',
    readTime: '9 min',
    category: 'Travel Guide',
    image: '/lights6.jpg',
  },
  {
    id: 10,
    title: 'Where to Stay in Lapland: Accommodation Guide',
    slug: 'where-to-stay-lapland-accommodation-guide',
    excerpt: 'Hotels, cabins, and Arctic stays around Rovaniemi.',
    readTime: '10 min',
    category: 'Accommodation',
    image: '/slideshow2.jpg',
  },
  {
    id: 11,
    title: 'Glass Igloos in Lapland: Sleeping Under the Northern Lights',
    slug: 'glass-igloos-lapland-complete-guide',
    excerpt: 'What glass igloo stays involve — resorts, booking tips, and expectations.',
    readTime: '8 min',
    category: 'Accommodation',
    image: '/lights1.jpg',
  },
  {
    id: 12,
    title: 'Traditional Finnish Cabins in Lapland',
    slug: 'finnish-cabins-lapland-authentic-guide',
    excerpt: 'Log cabins — types, what’s included, and tips for an authentic stay.',
    readTime: '7 min',
    category: 'Accommodation',
    image: '/slideshow2.jpg',
  },
]

/**
 * Editorial journal index — all posts visible (no ghost reveal voids).
 * 12 posts fill 4×3 desktop / 6×2 tablet / 12×1 mobile without pagination.
 */
const Blog: React.FC = () => {
  return (
    <div className="rn-page">
      <header className="rn-blog-index-hero relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-90" aria-hidden />
        <div className="rn-container rn-shell-pad relative pb-8 sm:pb-10">
          <p className="rn-eyebrow">Travel journal</p>
          <h1 className="rn-blog-index-hero__title mt-2.5 font-display font-semibold text-white">
            Lapland travel guides
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-text-muted">
            Practical notes on Northern Lights, packing, wildlife, and winter activities — for visitors
            planning from Rovaniemi.
          </p>
        </div>
      </header>

      <section className="relative border-t border-white/[0.05] pb-14 sm:pb-16 lg:pb-20">
        <div className="rn-container">
          <ul className="rn-blog-grid">
            {blogPosts.map((post) => (
              <li key={post.id}>
                <Link to={`/blog/${post.slug}`} className="group rn-blog-card">
                  <div className="rn-blog-card__media">
                    <img
                      src={post.image}
                      alt=""
                      className="rn-blog-card__img"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = '/lights5.jpg'
                      }}
                    />
                    <div className="rn-blog-card__shade" aria-hidden />
                  </div>
                  <div className="rn-blog-card__body">
                    <span className="rn-blog-card__tag">{post.category}</span>
                    <h2 className="rn-blog-card__title">{post.title}</h2>
                    <p className="rn-blog-card__excerpt">{post.excerpt}</p>
                    <p className="rn-blog-card__meta">{post.readTime} read</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="rn-page-end mt-12 border-t border-white/[0.07] pt-8 sm:mt-14 sm:pt-10">
            <p className="text-sm text-text-muted">Ready to experience Lapland in person?</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/northern-lights-tour" className="rn-btn-primary">
                Guaranteed Northern Lights
              </Link>
              <Link to="/daytime-experiences" className="rn-btn-secondary">
                Day tours
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Blog
