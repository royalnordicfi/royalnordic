import React from 'react';
import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

const Transportations = () => {

  return (
    <section id="transportation" className="py-16 sm:py-20 lg:py-24 bg-black relative">
      {/* Background fade effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            TRANSPORTATION SERVICES
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            Travel comfortably and safely throughout Lapland with our professional transportation services.
          </p>
        </div>

        {/* Single Transportation Card */}
        <div className="flex justify-center">
          <Link
            to="/transportation"
            className="group relative bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 max-w-md w-full"
          >
            {/* Background Image */}
            <div className="relative h-48 sm:h-52 overflow-hidden">
              <img
                src="/transportation1.jpg"
                alt="Transportation Services"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              {/* Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-emerald-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  Transportation
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center mb-3">
                <Car className="w-5 h-5 text-emerald-400 mr-3" />
                <h3 className="text-xl font-luxury font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Transportation Services
                </h3>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 font-clean leading-relaxed">
                Professional transportation throughout Lapland. From Rovaniemi to Levi and custom routes.
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">2 services available</p>
                </div>
                <div className="text-emerald-400 group-hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Transportations;
