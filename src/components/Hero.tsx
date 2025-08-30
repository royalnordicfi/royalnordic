import React from 'react';
import { ChevronDown } from 'lucide-react';

const Hero = () => {
  const scrollToTours = () => {
    const element = document.getElementById('tours');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="home" 
      className="relative w-screen h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          zIndex: 1,
          backgroundColor: 'black'
        }}
        onError={(e) => console.error('Video error:', e)}
        onLoadStart={() => console.log('Video loading started')}
        onCanPlay={() => console.log('Video can play')}
      >
        <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Video Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80 z-10"></div>
      
      {/* Bottom transition overlay for smooth flow to tours */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10"></div>

      {/* Content */}
      <div className="relative z-20 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-luxury font-bold mb-6 leading-tight">
          <span className="block bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            ROYAL NORDIC
          </span>
          <span className="block text-2xl md:text-3xl lg:text-4xl mt-4 text-gray-300 font-elegant font-light italic">
            Lavish Experiences in Lapland
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed font-clean">
          Step into a world where time stands still and nature speaks in whispers. Here in Lapland, we don't just show you the Northern Lights – we help you feel them in your soul. It's where wilderness becomes your playground, where every snowflake tells a story, and where adventure finds you in the most unexpected moments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={scrollToTours}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-10 py-5 rounded-full font-elegant font-bold text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/40 tracking-widest border-2 border-emerald-500/50"
            style={{
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
            }}
          >
            EXPLORE TOURS
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <button 
          onClick={scrollToTours}
          className="animate-bounce text-white/60 hover:text-emerald-400 transition-colors duration-300"
        >
          <ChevronDown size={32} />
        </button>
      </div>
    </section>
  );
};

export default Hero;