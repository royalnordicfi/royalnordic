import React from 'react';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
  const blogPosts = [
    {
      id: 1,
      title: "Best Time to See Northern Lights in Lapland 2025",
      slug: "best-time-northern-lights-lapland-2025",
      excerpt: "Discover the optimal months and conditions for witnessing the magical Aurora Borealis in Finnish Lapland. Complete guide with weather patterns and viewing tips.",
      date: "2025-09-25",
      readTime: "5 min read",
      category: "Northern Lights"
    },
    {
      id: 2,
      title: "What to Pack for Lapland Winter Adventure",
      slug: "what-to-pack-lapland-winter-adventure",
      excerpt: "Essential packing list for your Lapland winter trip. From thermal layers to camera gear, ensure you're prepared for Arctic conditions.",
      date: "2025-09-24",
      readTime: "4 min read",
      category: "Travel Tips"
    },
    {
      id: 3,
      title: "Northern Lights Photography Tips for Beginners",
      slug: "northern-lights-photography-tips-beginners",
      excerpt: "Learn how to capture stunning Northern Lights photos with basic camera settings and composition techniques. Perfect for first-time Aurora photographers.",
      date: "2025-09-23",
      readTime: "6 min read",
      category: "Photography"
    },
    {
      id: 4,
      title: "Lapland Wildlife: Animals You Can See at Ranua Zoo",
      slug: "lapland-wildlife-animals-ranua-zoo",
      excerpt: "Explore the incredible Nordic animals at Ranua Zoo, from brown bears to Arctic foxes. Learn about Finland's unique wildlife and conservation efforts.",
      date: "2025-09-22",
      readTime: "4 min read",
      category: "Wildlife"
    },
    {
      id: 5,
      title: "Traditional Ice Fishing in Finnish Lapland",
      slug: "traditional-ice-fishing-finnish-lapland",
      excerpt: "Discover the ancient art of ice fishing in Lapland. Learn about traditional techniques, equipment, and the cultural significance of this Arctic activity.",
      date: "2025-09-21",
      readTime: "5 min read",
      category: "Activities"
    },
    {
      id: 6,
      title: "Snowshoe Adventure: Exploring Lapland's Wilderness",
      slug: "snowshoe-adventure-exploring-lapland-wilderness",
      excerpt: "Everything you need to know about snowshoeing in Lapland. From equipment to trails, experience the pristine Arctic wilderness on foot.",
      date: "2025-09-20",
      readTime: "4 min read",
      category: "Adventure"
    }
  ];

  return (
    <div className="bg-black text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-luxury font-bold mb-4">
            Lapland Travel Guide & Tips
          </h2>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto font-clean">
            Discover everything you need to know about visiting Lapland, from Northern Lights viewing to Arctic adventures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="mb-3">
                <span className="inline-block bg-emerald-600/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white leading-tight">
                <Link 
                  to={`/blog/${post.slug}`}
                  className="hover:text-emerald-400 transition-colors"
                >
                  {post.title}
                </Link>
              </h3>
              
              <p className="text-gray-300 text-sm sm:text-base mb-4 font-clean leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link 
            to="/blog"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
