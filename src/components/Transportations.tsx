import React from 'react';
import { Car, Clock, Users, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const Transportations = () => {
  const transportations = [
    {
      id: 1,
      title: "Private Transportation: Rovaniemi - Levi/Kittilä",
      description: "Comfortable private transportation service between Rovaniemi and the popular ski resorts of Levi and Kittilä.",
      price: "Starting from 199€",
      duration: "2-3 hours",
      groupSize: "Up to 8 people",
      location: "Rovaniemi to Levi/Kittilä",
      features: ["Private vehicle", "Professional driver", "Comfortable seating", "Flexible timing"],
      images: ["/transportation1.jpg", "/transportation3.jpg"],
      route: "/transportation-rovaniemi-levi"
    },
    {
      id: 2,
      title: "Private Customized Transportation",
      description: "Tailored transportation service for your specific needs. From airport transfers to custom routes throughout Lapland.",
      price: "Custom pricing",
      duration: "Flexible",
      groupSize: "Up to 8 people",
      location: "Lapland, Finland",
      features: ["Custom routes", "Flexible scheduling", "Professional driver", "Personalized service"],
      images: ["/transportation2.jpg"],
      route: "/transportation-customized"
    }
  ];

  return (
    <section id="transportations" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-luxury font-bold mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Transportation services
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            Travel comfortably and safely throughout Lapland with our professional transportation services.
          </p>
        </div>

        {/* Transportation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {transportations.map((transportation) => (
            <div key={transportation.id} className="bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20 group">
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={transportation.images[0]}
                  alt={transportation.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                <h3 className="text-xl font-luxury font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {transportation.title}
                </h3>
                
                <p className="text-gray-300 text-sm mb-4 font-clean leading-relaxed">
                  {transportation.description}
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center text-gray-300 text-sm">
                    <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                    <span>{transportation.duration}</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <Users className="w-4 h-4 mr-2 text-emerald-400" />
                    <span>{transportation.groupSize}</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                    <span>{transportation.location}</span>
                  </div>
                  <div className="flex items-center text-gray-300 text-sm">
                    <Car className="w-4 h-4 mr-2 text-emerald-400" />
                    <span>Private Vehicle</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-2 text-sm">Included:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {transportation.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-gray-300 text-xs">
                        <div className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 font-bold text-lg">{transportation.price}</p>
                  </div>
                  <Link
                    to={transportation.route}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Transportations;
