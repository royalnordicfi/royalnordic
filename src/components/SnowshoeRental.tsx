import React from 'react';
import { CheckCircle, Snowflake, Mountain, Users, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';

const SnowshoeRental: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    'Professional snowshoe equipment for all sizes',
    'Detailed safety briefing and instructions',
    'Equipment delivery to your accommodation',
    'Equipment pickup when finished',
    'Local area recommendations'
  ];

  const itinerary = [
    {
      activity: 'Book your snowshoes',
      description: 'Reserve your snowshoe equipment online or contact us directly'
    },
    {
      activity: 'Equipment delivery',
      description: 'We\'ll deliver the snowshoes and safety gear to your accommodation'
    },
    {
      activity: 'Safety briefing & instructions',
      description: 'Receive detailed instructions on how to use the equipment safely'
    },
    {
      activity: 'Enjoy your adventure',
      description: 'Explore Lapland\'s beautiful winter landscapes at your own pace'
    },
    {
      activity: 'Equipment return',
      description: 'We\'ll collect the snowshoes when you\'re finished with your adventure'
    }
  ];

  return (
    <div className="min-h-screen bg-black">


      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/snowshoe1.jpg", "/snowshoe2.jpg"]}
          className="h-80 sm:h-96 md:h-[500px]"
          alt="Snowshoe Adventure Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-20 sm:pt-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Snowshoe Adventure
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-clean max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl">
              Experience the magic of Lapland winter on traditional snowshoes through pristine wilderness.
            </p>
          </div>
        </div>
        
        {/* Bottom transition overlay for smooth flow to content */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Quick Info - More compact on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Customized</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Max 3 people</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Rovaniemi, Lapland</p>
          </div>
        </div>



        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Tour Details (Smaller) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Adventure</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Our Snowshoe Rental service gives you the freedom to explore Finnish Lapland's winter wonderland at your own pace. 
                We provide professional snowshoe equipment along with comprehensive instructions on how to use 
                them safely and effectively.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Perfect for families and groups who want to experience the authentic Lapland winter independently. 
                We'll deliver the equipment to your accommodation, provide detailed safety instructions, and collect 
                everything when you're finished with your adventure.
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Adventure Itinerary</h2>
              <div className="space-y-2 sm:space-y-3">
                {itinerary.map((item, index) => (
                  <div key={index}>
                    <div className="flex">
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

          {/* Right Column - Booking Form (Wider) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Your Adventure</h2>
                <BookingForm
                  tourId={2}
                  tourName="Snowshoe Adventure"
                  adultPrice={89}
                  childPrice={69}
                  maxCapacity={3}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnowshoeRental;
