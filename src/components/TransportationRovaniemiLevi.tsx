import { Car, Clock, Users, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const TransportationRovaniemiLevi = () => {
  const [transportationData, setTransportationData] = useState({
    adult_price: 199,
    child_price: 149,
    max_capacity: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading transportation data
    setLoading(false);
  }, []);

  const features = [
    'Private vehicle with professional driver',
    'Comfortable seating for up to 8 passengers',
    'Flexible departure times',
    'Direct route to Levi/Kittilä ski resorts',
    'Luggage assistance',
    'WiFi available in vehicle',
    'Child safety seats available upon request',
    'Hotel pickup and drop-off',
    'Scenic route through Lapland countryside'
  ];

  const itinerary = [
    {
      time: 'Flexible',
      activity: 'Pickup from Rovaniemi',
      description: 'We\'ll collect you from your hotel or specified location in Rovaniemi'
    },
    {
      activity: 'Scenic drive to Levi/Kittilä',
      description: 'Enjoy the beautiful Lapland landscape during the 2-3 hour journey'
    },
    {
      activity: 'Arrival at destination',
      description: 'Drop-off at your hotel or specified location in Levi or Kittilä'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/transportation1.jpg", "/transportation3.jpg"]}
          className="h-[28rem] sm:h-[32rem] md:h-[36rem] lg:h-[40rem]"
          alt="Transportation Rovaniemi to Levi"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-20 sm:pt-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/" 
              className="inline-flex items-center border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-all duration-300 font-medium px-3 py-1.5 rounded-lg mb-4 sm:mb-6 text-xs sm:text-sm md:text-base"
            >
              <ArrowLeft size={16} className="mr-1 sm:mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Private Transportation: Rovaniemi - Levi/Kittilä
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-clean max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl">
              Comfortable and reliable private transportation service between Rovaniemi and the popular ski resorts of Levi and Kittilä.
            </p>
          </div>
        </div>
        
        {/* Bottom transition overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">2-3 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Capacity</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Up to 8 people</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Route</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Rovaniemi to Levi/Kittilä</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Service Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Service</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Our private transportation service provides a comfortable and reliable way to travel between Rovaniemi and the popular ski resorts of Levi and Kittilä. Whether you're heading to the slopes for skiing or snowboarding, or simply want to explore these beautiful destinations, we ensure a smooth and enjoyable journey.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Our professional drivers are familiar with the routes and weather conditions, ensuring your safety and comfort throughout the journey. The scenic drive through Lapland's countryside offers beautiful views of snow-covered forests and frozen lakes.
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Service Itinerary</h2>
              <div className="space-y-2 sm:space-y-3">
                {itinerary.map((item, index) => (
                  <div key={index}>
                    <div className="flex">
                      {item.time && (
                        <div className="flex-shrink-0 w-14 sm:w-16 text-emerald-400 font-semibold text-sm sm:text-base">
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
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Transportation</h2>
                {loading ? (
                  <div className="text-center text-white">Loading service data...</div>
                ) : (
                  <BookingForm
                    tourId={6}
                    tourName="Private Transportation: Rovaniemi - Levi/Kittilä"
                    adultPrice={transportationData.adult_price}
                    childPrice={transportationData.child_price}
                    maxCapacity={transportationData.max_capacity}
                    seasonStart="01-01"
                    seasonEnd="12-31"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TransportationRovaniemiLevi;
