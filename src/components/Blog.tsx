import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from './Footer';

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
    <div className="relative min-h-screen">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/lights5.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-white py-8 sm:py-12 pt-40 sm:pt-48">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back to Home Button */}
          <div className="mb-8">
            <Link 
              to="/"
              className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
          
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-luxury font-bold mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
              Lapland Travel Guide & Tips
            </h2>
            <p className="text-gray-300 text-lg sm:text-xl max-w-3xl mx-auto font-clean leading-relaxed">
              Discover everything you need to know about visiting Lapland, from Northern Lights viewing to Arctic adventures.
            </p>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <Link 
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block bg-black/60 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/20 hover:border-emerald-400/50 transition-all duration-300 hover:bg-black/70 hover:scale-105 cursor-pointer group"
            >
              <div className="mb-3">
                <span className="inline-block bg-emerald-600/20 text-emerald-400 text-xs font-medium px-2 py-1 rounded-full">
                  {post.category}
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold mb-3 text-white leading-tight group-hover:text-emerald-400 transition-colors">
                {post.title}
              </h3>
              
              <p className="text-gray-300 text-sm sm:text-base mb-4 font-clean leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{post.date}</span>
                <span>{post.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Blog;
