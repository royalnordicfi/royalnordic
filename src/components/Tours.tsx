import React from 'react';
import { Star, Clock, Users, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import { Link } from 'react-router-dom';

const Tours = () => {
  const navigate = useNavigate();
  
  const tours = [
    {
      id: 1,
      title: "Guaranteed Northern Lights Tour",
      description: "Experience the magical Aurora Borealis with our guaranteed Northern Lights tour.",
      price: "Starting from 179€",
      duration: "1-10 hours",
      groupSize: "Max 8 people",
      location: "Rovaniemi",
      features: ["Guaranteed Northern Lights", "Pick up and drop off", "Professional guide", "Hot drinks & snacks"],
      images: ["/lights1.jpg", "/lights2.jpg", "/lights3.jpg"],
      route: "/northern-lights-tour"
    },
    {
      id: 2,
      title: "Quality Snowshoe Rental",
      description: "Explore the pristine Lapland wilderness on snowshoes.",
      price: "Starting from 59€",
      duration: "Custom time",
      groupSize: "Max 3 people",
      location: "Rovaniemi",
      features: ["Quality snowshoe equipment", "Instructions for how to use the equipment", "Safety briefing", "Hot drinks"],
      images: ["/snowshoe1.jpg", "/snowshoe2.jpg"],
      route: "/snowshoe-rental"
    },
    {
      id: 3,
      title: "Customized Tour",
      description: "Have a specific Lapland experience in mind? We'll create a personalized tour just for you.",
      price: "Custom pricing",
      duration: "Flexible",
      groupSize: "Max 8 people",
      location: "Lapland, Finland",
      features: ["Personalized experience", "Flexible scheduling", "Private guide", "Custom itinerary"],
      images: ["/slideshow3.jpg", "https://images.pexels.com/photos/1054289/pexels-photo-1054289.jpeg?auto=compress&cs=tinysrgb&w=800", "https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=800"],
      route: "/customized-tour"
    }
  ];

  const handleTourClick = (route: string) => {
    navigate(route);
  };

  return (
    <section 
      id="tours" 
      className="relative py-20 bg-black"
    >
      {/* Smooth transition overlay from hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none"></div>
      
      {/* Subtle decorative accent line */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-luxury font-bold mb-6 bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent tracking-wider">
            TOURS WE PROVIDE:
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            Immerse yourself in the pristine wilderness of Finnish Lapland with our carefully curated experiences
          </p>
        </div>

        {/* Tour Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Northern Lights Tour */}
          <Link to="/northern-lights-tour" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/70 transition-all duration-500 hover:scale-105 cursor-pointer flex flex-col shadow-xl hover:shadow-gray-900/50">
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src="/lights1.jpg"
                alt="Northern Lights Tour in Lapland"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              {/* GetYourGuide Badge */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1 shadow-lg">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-800">GetYourGuide</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">Guaranteed Northern Lights</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                Experience the magical Aurora Borealis with our guaranteed tour. Expert guides, warm clothing, and the best viewing locations in Lapland.
              </p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-white">
                  <span className="flex items-center font-medium">
                    <Clock className="w-4 h-4 mr-1 text-green-400" />
                    1-10 hours
                  </span>
                  <span className="flex items-center font-medium">
                    <Users className="w-4 h-4 mr-1 text-green-400" />
                    Max 8 people
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">€179</div>
              </div>
              <div className="mb-4">
                <p className="text-green-400 text-sm font-semibold flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  100% Guarantee or Money Back
                </p>
              </div>
              <div className="mt-auto flex justify-end">
                <div
                  className="inline-block w-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-center py-3 px-4 rounded-lg font-bold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  Book Now
                </div>
              </div>
            </div>
          </Link>

          {/* Snowshoe Rental */}
          <Link to="/snowshoe-rental" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/70 transition-all duration-500 hover:scale-105 cursor-pointer flex flex-col shadow-xl hover:shadow-gray-900/50">
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <img
                src="/snowshoe1.jpg"
                alt="Snowshoe Adventure in Lapland"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              {/* GetYourGuide Badge */}
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1 shadow-lg">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-800">GetYourGuide</span>
              </div>
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">Snowshoe Adventure</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                Explore pristine Lapland wilderness on traditional snowshoes. Perfect for families and nature lovers seeking authentic Arctic experiences.
              </p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-white">
                  <span className="flex items-center font-medium">
                    <Clock className="w-4 h-4 mr-1 text-green-400" />
                    Customized
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">€89</div>
              </div>
              <div className="mt-auto flex justify-end">
                <div
                  className="inline-block w-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-center py-3 px-4 rounded-lg font-bold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  Book Now
                </div>
              </div>
            </div>
          </Link>

          {/* Customized Tours */}
          <Link to="/customized-tour" className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/70 transition-all duration-500 hover:scale-105 cursor-pointer flex flex-col shadow-xl hover:shadow-gray-900/50">
            <div className="relative h-44 sm:h-48 overflow-hidden">
              <ImageSlideshow 
                images={["/snowyscene.png", "/slideshow3.jpg"]}
                alt="Customized Tours in Lapland"
                className="w-full h-full object-cover"
                interval={4000}
                showCounter={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </div>
            <div className="p-4 sm:p-5 flex flex-col flex-grow">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 tracking-tight">Customized Tours</h3>
              <p className="text-gray-300 text-sm sm:text-base mb-4 leading-relaxed">
                Create your perfect Lapland experience with our personalized tours. Tailored to your interests, group size, and schedule.
              </p>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm text-white">
                  <span className="flex items-center font-medium">
                    <Clock className="w-4 h-4 mr-1 text-green-400" />
                    Flexible
                  </span>
                  <span className="flex items-center font-medium">
                    <Users className="w-4 h-4 mr-1 text-green-400" />
                    Any size
                  </span>
                </div>
                <div className="text-2xl font-bold text-white">Custom</div>
              </div>
              <div className="mt-auto flex justify-end">
                <div
                  className="inline-block w-1/2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-center py-3 px-4 rounded-lg font-bold transition-all duration-300 uppercase tracking-wide shadow-lg hover:shadow-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  Contact Us
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Tours;