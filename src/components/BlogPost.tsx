import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import Footer from './Footer';

interface BlogPostProps {
  post: {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: string;
    author: string;
  };
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-[40rem] sm:h-[45rem] md:h-[50rem] overflow-hidden">
        <img
          src="/lights1.jpg"
          alt="Northern Lights in Lapland"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-20 sm:pt-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/blog" 
              className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mb-8 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </Link>
            
            <div className="mb-6">
              <span className="inline-block bg-emerald-600/20 text-emerald-400 text-sm font-medium px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                {post.title}
              </span>
            </h1>
            
            <div className="flex items-center justify-center space-x-6 text-gray-300 text-sm sm:text-base">
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-2" />
                {post.readTime}
              </div>
              <div className="flex items-center">
                <Tag size={16} className="mr-2" />
                {post.author}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom transition overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div 
          className="prose prose-invert prose-lg max-w-none font-clean"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
