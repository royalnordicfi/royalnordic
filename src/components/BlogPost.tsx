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
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/blog" 
            className="inline-flex items-center text-emerald-400 hover:text-emerald-300 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Blog
          </Link>
          
          <div className="mb-4">
            <span className="inline-block bg-emerald-600/20 text-emerald-400 text-sm font-medium px-3 py-1 rounded-full">
              {post.category}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-luxury font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center space-x-6 text-gray-400 text-sm">
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
