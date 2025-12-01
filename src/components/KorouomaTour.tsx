import { Clock, Users, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { getAllTours } from '../lib/api';

const KorouomaTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 116,
    child_price: 116,
    max_capacity: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const korouomaTour = tours.find(tour => tour.id === 6);
        if (korouomaTour) {
          setTourData({
            adult_price: korouomaTour.adult_price,
            child_price: korouomaTour.child_price,
            max_capacity: korouomaTour.max_capacity || 8
          });
        }
      } catch (error) {
        console.error('Error loading tour data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTourData();
  }, []);

  const features = [
    'Hotel pickup from Rovaniemi',
    'Professional English-speaking guide',
    'Enjoy grilled food and hot drinks at scenic viewpoints',
    'Visit the magnificent frozen waterfalls',
    'Explore pristine snowy trails and beautiful landscapes',
    'Warm and comfortable minibus transport',
    'Small group experience for personalized attention',
    'Expert knowledge about Korouoma geology and nature',
    'Photos by stunning ice formations and waterfalls',
    'Scenic nature views throughout the journey'
  ];

  const itinerary = [
    {
      time: '09:00',
      activity: 'Hotel Pickup',
      description: 'Pickup from your accommodation in Rovaniemi area'
    },
    {
      time: '10:00',
      activity: 'Arrive at Korouoma',
      description: '50km drive to Korouoma Canyon Nature Reserve'
    },
    {
      time: '10:15',
      activity: 'Begin Winter Hike',
      description: 'Guided hike through snow-covered forests and frozen waterfalls'
    },
    {
      time: '12:00',
      activity: 'Lunch Break',
      description: 'Hot drinks and traditional Lappish snacks with stunning views'
    },
    {
      time: '13:00',
      activity: 'Explore Frozen Waterfalls',
      description: 'Visit the magnificent frozen waterfalls and ice formations'
    },
    {
      time: '14:30',
      activity: 'Return Journey',
      description: 'Drive back to Rovaniemi with scenic views'
    },
    {
      time: '15:30',
      activity: 'Drop-off',
      description: 'Return to your accommodation'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/korouoma1.jpg", "/korouoma2.jpg"]}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Korouoma Canyon Tour Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-32 sm:pt-36 md:pt-32 lg:pt-28 xl:pt-24">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/daytime-experiences" 
              className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Daytime Experiences
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl">
                Korouoma Canyon Adventure
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              Discover the breathtaking frozen waterfalls and stunning ice formations of Korouoma Canyon
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">~6 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Small groups (2-10 people)</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Korouoma Canyon, Lapland</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Tour Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Experience</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Experience the magnificent frozen waterfalls and pristine winter landscapes of Korouoma Canyon, 
                one of Lapland's most stunning natural wonders. This winter wonderland adventure takes you hiking 
                through snow-covered trails to spectacular ice formations.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                We travel approximately 100 km from Rovaniemi to Korouoma and get ready for an unforgettable 
                journey through nature's winter beauty. Our professional guide will lead you to the best viewpoints 
                where you can enjoy grilled food and hot drinks while surrounded by breathtaking frozen waterfalls.
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Not Included */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Not Included</h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xl font-bold">×</div>
                  <span className="text-gray-300 text-sm sm:text-base">Warm winter clothing (remember to dress warmly in Arctic conditions)</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-300 text-sm font-medium">
                  <strong>What to Bring:</strong> Comfortable footwear, warm layered clothes, weather-appropriate outerwear. 
                  If you have any questions, contact us at contact@royalnordic.fi
                </p>
              </div>
            </div>

            {/* Itinerary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Tour Itinerary</h2>
              <div className="space-y-2 sm:space-y-3">
                {itinerary.map((item, index) => (
                  <div key={index}>
                    <div className="flex">
                      {item.time && (
                        <div className="flex-shrink-0 w-14 sm:w-16 text-cyan-400 font-semibold text-sm sm:text-base">
                          {item.time}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm sm:text-base">{item.activity}</h4>
                        <p className="text-gray-300 text-xs sm:text-sm">{item.description}</p>
                      </div>
                    </div>
                    {index < itinerary.length - 1 && (
                      <div className="border-t border-white/20 my-2 sm:my-3"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            {/* Important Information */}
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-luxury font-bold text-white mb-3 sm:mb-4">✨ Experience Highlights</h2>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>🏔️ Explore Korouoma canyon's frozen waterfalls and icy streams</li>
                <li>🥾 Enjoy small group hiking through pristine grilled paths and beautiful landscapes</li>
                <li>🔥 Grilled food and hot drinks at scenic nature viewpoints</li>
                <li>📸 Take photos by stunning ice formations and frozen waterfalls</li>
                <li>🚐 Comfortable minibus transport from your hotel</li>
                <li>❄️ Experience one of Lapland's most beautiful winter landscapes</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm">
                  <strong>Free Cancellation:</strong> Cancel up to 24 hours in advance for a full refund
                </p>
              </div>
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-300 text-sm">
                  <strong>Book Now, Pay Later:</strong> Reserve your spot today and pay when you're ready
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Your Adventure</h2>
                {loading ? (
                  <div className="text-center text-white">Loading tour data...</div>
                ) : (
                  <BookingForm
                    tourId={6}
                    tourName="Korouoma Canyon Winter Adventure"
                    adultPrice={tourData.adult_price}
                    childPrice={tourData.child_price}
                    maxCapacity={tourData.max_capacity}
                    seasonStart="11-01"
                    seasonEnd="04-30"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-luxury font-bold text-white mb-6 sm:mb-8 text-center bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-clip-text text-transparent">
            Korouoma Winter Gallery
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/korouoma1.jpg" 
                alt="Korouoma Canyon Winter 1" 
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/korouoma2.jpg" 
                alt="Korouoma Canyon Winter 2" 
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="mt-12 bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-amber-300 mb-4">Important Information</h3>
          <div className="space-y-3 text-gray-300">
            <p>• <strong>Duration:</strong> Approximately 6 hours including transport</p>
            <p>• <strong>Group Size:</strong> 2-10 people for a personal experience</p>
            <p>• <strong>Languages:</strong> English and Finnish guides available</p>
            <p>• <strong>Season:</strong> November - April when waterfalls are beautifully frozen</p>
            <p>• <strong>Dress Code:</strong> Warm clothing essential - thermal layers, winter boots, gloves, hat</p>
            <p>• <strong>Fitness Level:</strong> Moderate - suitable for most people with basic mobility</p>
            <p>• <strong>Cancellation:</strong> Free cancellation up to 24 hours before the tour</p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default KorouomaTour;

