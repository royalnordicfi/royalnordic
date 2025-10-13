import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mountain, Sun } from 'lucide-react';

const Tours = () => {
  const categories = [
    {
      id: 1,
      title: "Northern Lights Tours",
      description: "Chase the magical Aurora Borealis with our expert-guided tours. Guaranteed sightings or free rebooking!",
      icon: Sparkles,
      image: "/lights5.jpg",
      route: "/northern-lights-tours",
      tourCount: "2 tours available"
    },
    {
      id: 2,
      title: "Renting Equipment",
      description: "Quality equipment rentals for your independent Arctic adventures. Explore at your own pace!",
      icon: Mountain,
      image: "/snowshoe2.jpg",
      route: "/renting-equipment",
      tourCount: "1 rental available"
    },
    {
      id: 3,
      title: "Daytime Experiences",
      description: "Discover authentic Arctic activities and wildlife. Perfect for families and all ages!",
      icon: Sun,
      image: "/icefishing3.jpg",
      route: "/daytime-experiences",
      tourCount: "2 experiences available"
    }
  ];

  return (
    <section id="tours" className="py-16 sm:py-20 lg:py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            EXPLORE OUR TOURS
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            Discover the magic of Lapland through our carefully curated experiences. From Northern Lights to Arctic adventures.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Link
                key={category.id}
                to={category.route}
                className="group relative bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20"
              >
                {/* Background Image */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                  
                  {/* Icon */}
                  <div className="absolute top-4 right-4 bg-emerald-500/20 backdrop-blur-sm p-3 rounded-full border border-emerald-500/30">
                    <IconComponent className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl sm:text-3xl font-luxury font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {category.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed font-clean">
                    {category.description}
                  </p>

                  {/* Tour Count */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    <span className="text-sm text-gray-400 font-clean">
                      {category.tourCount}
                    </span>
                    <span className="text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                      Explore →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-gray-400 font-clean mb-4">
            Can't find what you're looking for?
          </p>
          <Link
            to="/customized-tour"
            className="inline-block bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-8 py-3 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Request Custom Tour
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Tours;
