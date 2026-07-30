import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
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
    },
    {
      id: 2,
      title: 'What to Pack for a Lapland Winter Adventure',
      slug: 'what-to-pack-lapland-winter-adventure',
      excerpt:
        'Essential packing list for Arctic conditions — thermal layers, footwear, and camera gear for winter in Lapland.',
      readTime: '4 min read',
      category: 'Travel Tips',
    },
    {
      id: 3,
      title: 'Northern Lights Photography Tips for Beginners',
      slug: 'northern-lights-photography-tips-beginners',
      excerpt:
        'Capture the Aurora with clear camera settings and simple composition techniques — built for first-time night photographers.',
      readTime: '6 min read',
      category: 'Photography',
    },
    {
      id: 4,
      title: 'Lapland Wildlife: Animals You Can See at Ranua Zoo',
      slug: 'lapland-wildlife-animals-ranua-zoo',
      excerpt:
        'Nordic animals from brown bears to Arctic foxes — what to expect at Ranua Wildlife Park near Rovaniemi.',
      readTime: '4 min read',
      category: 'Wildlife',
    },
    {
      id: 5,
      title: 'Traditional Ice Fishing in Finnish Lapland',
      slug: 'traditional-ice-fishing-finnish-lapland',
      excerpt:
        'How ice fishing works in Lapland — techniques, equipment, and why this Arctic tradition remains a favourite day trip.',
      readTime: '5 min read',
      category: 'Activities',
    },
    {
      id: 6,
      title: "Snowshoe Adventure: Exploring Lapland's Wilderness",
      slug: 'snowshoe-adventure-exploring-lapland-wilderness',
      excerpt:
        'Snowshoeing in Lapland — equipment, trails, and how to explore quiet Arctic forests on foot.',
      readTime: '4 min read',
      category: 'Adventure',
    },
    {
      id: 7,
      title: 'Lapland Winter Activities: Arctic Adventures Guide',
      slug: 'lapland-winter-activities-complete-guide',
      excerpt:
        'Northern Lights hunting, snowshoeing, ice fishing, and more — a clear overview of winter activities in Finnish Lapland.',
      readTime: '8 min read',
      category: 'Travel Guide',
    },
    {
      id: 8,
      title: 'What to Wear in Lapland: Winter Clothing Guide',
      slug: 'what-to-wear-lapland-winter-clothing-guide',
      excerpt:
        'Layering for Arctic winter — essential gear and what to pack for temperatures down to −30°C.',
      readTime: '7 min read',
      category: 'Travel Guide',
    },
    {
      id: 9,
      title: 'Best Time to Visit Lapland: Seasonal Guide',
      slug: 'best-time-visit-lapland-seasonal-guide',
      excerpt:
        'Month-by-month guidance for Northern Lights, activities, weather, crowds, and pricing across the Lapland seasons.',
      readTime: '9 min read',
      category: 'Travel Guide',
    },
    {
      id: 10,
      title: 'Where to Stay in Lapland: Accommodation Guide',
      slug: 'where-to-stay-lapland-accommodation-guide',
      excerpt:
        'Hotels, cabins, and Arctic stays around Rovaniemi — how to choose lodging that fits your trip.',
      readTime: '10 min read',
      category: 'Accommodation',
    },
    {
      id: 11,
      title: 'Glass Igloos in Lapland: Sleeping Under the Northern Lights',
      slug: 'glass-igloos-lapland-complete-guide',
      excerpt:
        'What glass igloo stays involve — resorts, booking tips, and what to expect from this iconic Arctic night.',
      readTime: '8 min read',
      category: 'Accommodation',
    },
    {
      id: 12,
      title: 'Traditional Finnish Cabins in Lapland',
      slug: 'finnish-cabins-lapland-authentic-guide',
      excerpt:
        'Log cabins in Lapland — cabin types, what’s included, locations, and tips for an authentic Arctic stay.',
      readTime: '7 min read',
      category: 'Accommodation',
    },
  ]

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/lights5.jpg)' }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <main className="relative z-10 flex-1 pb-12 pt-36 sm:pb-16 sm:pt-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="inline-flex min-h-[44px] items-center rounded-lg border border-emerald-400 px-4 py-2 font-medium text-emerald-400 transition-colors hover:bg-emerald-400 hover:text-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>

          <div className="mb-10 text-center sm:mb-12">
            <h1 className="mb-4 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text font-luxury text-3xl font-bold text-transparent sm:text-4xl lg:text-5xl">
              Lapland Travel Guide & Tips
            </h1>
            <p className="mx-auto max-w-2xl font-clean text-base leading-relaxed text-gray-300 sm:text-lg">
              Practical guides to Northern Lights, winter travel, and Arctic experiences in Finnish Lapland.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group block rounded-lg border border-white/15 bg-black/55 p-5 backdrop-blur-sm transition-colors hover:border-emerald-400/40 hover:bg-black/70 sm:p-6"
              >
                <span className="mb-3 inline-block rounded-full bg-emerald-600/20 px-2.5 py-1 text-xs font-medium text-emerald-400">
                  {post.category}
                </span>
                <h2 className="mb-2 font-luxury text-lg font-semibold leading-snug text-white transition-colors group-hover:text-emerald-400 sm:text-xl">
                  {post.title}
                </h2>
                <p className="mb-4 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
                  {post.excerpt}
                </p>
                <p className="text-xs text-gray-500">{post.readTime}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}

export default Blog
