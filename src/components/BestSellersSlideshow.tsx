import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from '../lib/productVisibility';

const BestSellersSlideshow: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const bestSellers = [
    {
      id: 1,
      title: "Guaranteed Northern Lights Tour",
      description: "Chase the Aurora Borealis from Rovaniemi with expert guides, hotel pickup, and a Northern Lights guarantee.",
      image: "/nortti1.jpg",
      route: "/northern-lights-tour",
      badge: "BEST SELLER",
      mode: "instant" as const,
      cta: "Book this tour"
    },
    {
      id: 2,
      title: "Nordic Animals of Ranua Zoo",
      description: "Day trip from Rovaniemi to Ranua Wildlife Park — polar bears and 50+ Arctic species, transfers and tickets included.",
      image: "/ranua1.jpg",
      route: "/ranua-zoo",
      badge: "BEST SELLER",
      mode: "instant" as const,
      cta: "Book this tour"
    },
    {
      id: 3,
      title: "Snowmobile Safari",
      description: "Thrilling snowmobile routes through Lapland wilderness. Partner experience — request availability and a quote.",
      image: "/snowmobiling.jpg",
      route: "/snowmobile-safari",
      badge: "REQUEST ONLY",
      mode: "inquiry" as const,
      cta: "Request availability"
    },
    ...(SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS
      ? [{
          id: 4,
          title: "Monster Truck Northern Lights Experience",
          description: "Aurora hunting aboard a giant monster truck. Partner experience — request availability and a quote.",
          image: "/monsteri1.jpg",
          route: "/monster-truck-northern-lights",
          badge: "REQUEST ONLY",
          mode: "inquiry" as const,
          cta: "Request availability"
        }]
      : [])
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bestSellers.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [bestSellers.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + bestSellers.length) % bestSellers.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % bestSellers.length);
  };

  return (
    <section className="relative py-8 sm:py-12 lg:py-16 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-luxury font-bold mb-3 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            BEST SELLERS
          </h2>
          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-clean">
            Our most popular experiences in Lapland
          </p>
        </div>

        {/* Slideshow Container */}
        <div className="relative">
          {/* Slides */}
          <div className="relative h-[300px] sm:h-[350px] lg:h-[450px] rounded-2xl overflow-hidden">
            {bestSellers.map((tour, index) => (
              <Link
                key={tour.id}
                to={tour.route}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={tour.image}
                    alt={tour.title}
                    className="w-full h-full object-cover"
                    loading={index === currentSlide ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/40"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6 lg:p-8">
                  <div className={`inline-flex items-center backdrop-blur-sm px-3 py-1.5 rounded-full mb-3 border w-fit ${
                    tour.mode === 'inquiry'
                      ? 'bg-amber-500/20 border-amber-400/30'
                      : 'bg-emerald-500/20 border-emerald-400/30'
                  }`}>
                    <Star className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${tour.mode === 'inquiry' ? 'text-amber-300' : 'text-emerald-400'}`} />
                    <span className={`font-bold text-xs tracking-wider uppercase ${tour.mode === 'inquiry' ? 'text-amber-200' : 'text-emerald-300'}`}>
                      {tour.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-luxury font-bold text-white mb-3 leading-tight">
                    {tour.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base lg:text-lg text-gray-200 mb-4 max-w-2xl leading-relaxed font-clean">
                    {tour.description}
                  </p>

                  {/* CTA Button */}
                  <div className="flex items-center text-emerald-400 font-semibold text-base sm:text-lg group">
                    <span>{tour.cta}</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-3 rounded-full transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {bestSellers.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'w-8 bg-emerald-500'
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellersSlideshow;

