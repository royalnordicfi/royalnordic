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

// Simple markdown to HTML converter
const markdownToHtml = (markdown: string): string => {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mb-3 mt-6">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-white mb-4 mt-8">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mb-6 mt-8">$1</h1>')
    // Bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-400">$1</strong>')
    // Lists
    .replace(/^- (.*$)/gim, '<li class="text-gray-300 mb-2">$1</li>')
    .replace(/(<li.*<\/li>)/gs, '<ul class="list-disc list-inside text-gray-300 mb-6 space-y-2">$1</ul>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="text-gray-300 mb-6 leading-relaxed">')
    // Wrap in paragraphs
    .replace(/^(?!<[h|u|l])/gm, '<p class="text-gray-300 mb-6 leading-relaxed">')
    .replace(/(?<!>)$/gm, '</p>')
    // Clean up nested paragraphs
    .replace(/<p class="text-gray-300 mb-6 leading-relaxed"><\/p>/g, '')
    .replace(/<p class="text-gray-300 mb-6 leading-relaxed">(<h[1-6])/g, '$1')
    .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
    .replace(/<p class="text-gray-300 mb-6 leading-relaxed">(<ul)/g, '$1')
    .replace(/(<\/ul>)<\/p>/g, '$1');
};

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative h-[32rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem] overflow-hidden">
        <img
          src="/lights1.jpg"
          alt="Northern Lights in Lapland"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-16 sm:pt-20 md:pt-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <Link 
              to="/blog" 
              className="inline-flex items-center border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-all duration-300 font-medium px-3 py-1.5 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm md:text-base"
            >
              <ArrowLeft size={16} className="mr-1 sm:mr-2" />
              Back
            </Link>
            
            <div className="mb-4 sm:mb-6">
              <span className="inline-block bg-emerald-600/20 text-emerald-400 text-xs sm:text-sm font-medium px-2 sm:px-3 py-1 rounded-full">
                {post.category}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl px-2">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                {post.title}
              </span>
            </h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 text-gray-300 text-xs sm:text-sm md:text-base px-4">
              <div className="flex items-center">
                <Calendar size={14} className="mr-1 sm:mr-2" />
                <span className="text-center">
                  {new Date(post.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <Clock size={14} className="mr-1 sm:mr-2" />
                <span>{post.readTime}</span>
              </div>
              <div className="flex items-center">
                <Tag size={14} className="mr-1 sm:mr-2" />
                <span>{post.author}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom transition overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 lg:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
        <div 
          className="prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none font-clean prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-emerald-400 prose-ul:text-gray-300 prose-ol:text-gray-300 prose-li:text-gray-300"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.content) }}
        />
      </div>
      
      <Footer />
    </div>
  );
};

export default BlogPost;
