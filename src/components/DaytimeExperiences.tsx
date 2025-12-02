import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users, Clock, MapPin, Star } from 'lucide-react';
import Footer from './Footer';

const DaytimeExperiences: React.FC = () => {
  const experiences = [
    {
      id: 1,
      name: "Ice Fishing Experience",
      description: "Experience traditional Lapland ice fishing on pristine frozen lakes with expert guidance. Perfect for all skill levels!",
      image: "/icefishing2.jpg",
      duration: "3-4 hours",
      groupSize: "Up to 8 people",
      location: "Rovaniemi, Lapland",
      features: ["Professional guide", "All equipment", "Hot drinks", "Traditional techniques"],
      route: "/ice-fishing"
    },
    {
      id: 2,
      name: "Nordic Animals of Ranua Zoo",
      description: "Discover the incredible wildlife of Finland at Ranua Zoo, home to bears, wolves, lynx, and many other Nordic animals.",
      image: "/ranua1.jpg",
      duration: "5 hours",
      groupSize: "Up to 8 people",
      location: "Ranua, Lapland",
      features: ["Hotel pickup", "Expert guide", "Zoo tickets", "Transportation"],
      route: "/ranua-zoo",
      badge: "Family Favorite"
    },
    {
      id: 3,
      name: "Korouoma Canyon Winter Adventure",
      description: "Hike to magnificent frozen waterfalls and enjoy grilled food in the stunning winter landscape. One of Lapland's most beautiful natural wonders!",
      image: "/korouoma1.jpg",
      duration: "~6 hours",
      groupSize: "2-10 people",
      location: "Korouoma Canyon, Lapland",
      features: ["Hotel pickup", "Professional guide", "Grilled food", "Hot drinks"],
      route: "/korouoma-canyon",
      badge: "Adventure"
    },
    {
      id: 4,
      name: "Snowmobile Safari",
      description: "Experience the thrill of snowmobiling through Lapland's pristine wilderness. Multiple duration options available for all skill levels.",
      image: "/snowmobiling.jpg",
      duration: "0.5h, 1h, 2h, or 3h",
      location: "Rovaniemi, Lapland",
      features: ["Professional guide", "All equipment", "Safety briefing", "Scenic routes"],
      route: "/snowmobile-safari"
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div 
        className="relative h-[40vh] sm:h-[50vh] bg-cover bg-center"
        style={{ backgroundImage: 'url(/icefishing3.jpg)' }}
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
            Daytime Experiences
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-300 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-clean px-2">
            Discover authentic Arctic activities and wildlife during the day
          </p>
        </div>
      </div>

      {/* Experiences Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {experiences.map((experience) => (
            <Link
              key={experience.id}
              to={experience.route}
              className="group bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20"
            >
              {/* Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={experience.image}
                  alt={experience.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Badge */}
                {experience.badge && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-black px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {experience.badge}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 sm:p-5">
                <h3 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                  {experience.name}
                </h3>
                
                <p className="text-gray-300 mb-6 leading-relaxed font-clean">
                  {experience.description}
                </p>

                {/* Experience Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{experience.duration}</span>
                  </div>
                  {experience.groupSize && (
                    <div className="flex items-center text-gray-300">
                      <Users className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                      <span className="font-clean">{experience.groupSize}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-emerald-400 flex-shrink-0" />
                    <span className="font-clean">{experience.location}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {experience.features.map((feature, index) => (
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
            Why Choose Our Daytime Experiences?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-300 font-clean">
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Authentic Arctic activities and traditions</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Expert local guides with deep knowledge</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Small groups for personalized experience</span>
            </div>
            <div className="flex items-start">
              <span className="text-emerald-400 mr-2">✓</span>
              <span>Perfect for families and all ages</span>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DaytimeExperiences;

