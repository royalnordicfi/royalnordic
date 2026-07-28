import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, MapPin, Star } from 'lucide-react';
import Footer from './Footer';

const NorthernLightsTours: React.FC = () => {
  const tours = [
    {
      id: 1,
      name: "Guaranteed Northern Lights Tour",
      description: "Chase the Aurora Borealis with our expert guides. We guarantee you'll see the lights or get a full refund!",
      image: "/nortti1.jpg",
      duration: "1-10 hours",
      groupSize: "Small group experience",
      location: "Rovaniemi, Lapland",
      features: ["Professional guide", "Hotel pickup", "Photography assistance", "Warm drinks and snacks"],
      route: "/northern-lights-tour",
      badge: "Most Popular",
      bookingMode: "instant" as const,
    },
    {
      id: 2,
      name: "Family-Friendly Northern Lights Tour",
      description: "Perfect for families with children! Shorter duration and kid-friendly activities while hunting the Aurora.",
      image: "/family1.jpg",
      duration: "2 hours (21:00-23:00)",
      groupSize: "Max 16 people",
      location: "Rovaniemi, Lapland",
      features: ["Family-friendly guide", "Hotel pickup", "Warm drinks & snacks", "Shorter duration for kids"],
      route: "/family-friendly-northern-lights",
      badge: "Family Favorite",
      bookingMode: "instant" as const,
    },
    {
      id: 3,
      name: "Monster Truck Northern Lights Experience",
      description: "Experience the magic of the Arctic night on board a giant monster truck! Deep into the wilderness for the best Northern Lights viewing. Request-only — not instant online checkout.",
      image: "/monsteri1.jpg",
      duration: "3 hours",
      groupSize: "Flexible",
      location: "Rovaniemi, Lapland",
      features: ["Professional guide and driver", "Specially built monster truck", "Remote viewing locations", "No experience required"],
      route: "/monster-truck-northern-lights",
      badge: "Request quote",
      bookingMode: "inquiry" as const,
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div 
        className="relative h-[40vh] sm:h-[50vh] bg-cover bg-center"
        style={{ backgroundImage: 'url(/nortti5.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-40 sm:pt-44 md:pt-48">
          <Link 
            to="/"
            className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Northern Lights Tours
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-300 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-clean px-2">
            Experience the magical Aurora Borealis with our expert-guided tours
          </p>
        </div>
      </div>

      {/* Tours Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {tours.map((tour) => (
            <Link
              key={tour.id}
              to={tour.route}
              className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20"
            >
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={tour.image}
                  alt={tour.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Badge */}
                {tour.badge && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {tour.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {tour.name}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed font-clean">
                  {tour.description}
                </p>

                {/* Tour Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{tour.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{tour.groupSize}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{tour.location}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {tour.features.map((feature, index) => (
                    <span
                      key={index}
                      className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-2 transition-transform">
                    {tour.bookingMode === 'inquiry' ? 'Request quote →' : 'Book online →'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {tour.bookingMode === 'inquiry' ? 'Inquiry only' : 'Instant checkout'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4">
            Why Choose Our Northern Lights Tours?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300 font-clean">
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Expert local guides with years of experience</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Small groups for personalized attention</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Full refund if Northern Lights don't appear</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Professional photography assistance included</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NorthernLightsTours;

