import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, MapPin } from 'lucide-react';
import Footer from './Footer';
import { fetchActiveTourIds } from '../lib/productVisibility';

const ALL_RENTALS = [
  {
    id: 1,
    tourId: 2,
    name: "Quality Snowshoe Rental",
    description: "Explore Lapland's winter wonderland at your own pace with our premium snowshoe rentals. Perfect for independent adventurers!",
    image: "/snowshoe1.jpg",
    duration: "Flexible rental periods",
    groupSize: "Individual or groups",
    location: "Rovaniemi, Lapland",
    features: ["Premium equipment", "Flexible duration", "Delivery to lodging", "Expert advice"],
    route: "/snowshoe-rental"
  }
];

const RentingEquipment: React.FC = () => {
  const [activeIds, setActiveIds] = useState<Set<number> | null>(null)

  useEffect(() => {
    fetchActiveTourIds().then(setActiveIds)
  }, [])

  const rentals = useMemo(() => {
    if (!activeIds) return ALL_RENTALS
    return ALL_RENTALS.filter((r) => activeIds.has(r.tourId))
  }, [activeIds])

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div 
        className="relative h-[50vh] sm:h-[60vh] md:h-[65vh] lg:h-[70vh] bg-cover bg-center"
        style={{ backgroundImage: 'url(/snowshoe2.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60"></div>
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-40 sm:pt-44 md:pt-48">
          <Link 
            to="/"
            className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Renting Equipment
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-300 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-clean px-2">
            Quality equipment rentals for your independent Arctic adventures
          </p>
        </div>
      </div>

      {/* Rentals Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {rentals.length === 0 && (
          <p className="text-center text-gray-400 font-clean">
            No equipment rentals are available right now.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {rentals.map((rental) => (
            <Link
              key={rental.id}
              to={rental.route}
              className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20"
            >
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={rental.image}
                  alt={rental.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {rental.name}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed font-clean">
                  {rental.description}
                </p>

                {/* Rental Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{rental.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{rental.groupSize}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{rental.location}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {rental.features.map((feature, index) => (
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
                    View Details →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 sm:p-8">
          <h3 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4">
            Why Rent Equipment from Us?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300 font-clean">
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Premium quality equipment, regularly maintained</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Flexible rental periods to suit your schedule</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Trail maps and expert advice included</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Perfect for independent exploration</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RentingEquipment;

