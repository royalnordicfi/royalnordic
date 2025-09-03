import { Clock, Users, MapPin, CheckCircle } from 'lucide-react';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';

const NorthernLightsTour = () => {
  // const navigate = useNavigate();

  const features = [
    'Guaranteed Northern Lights - 100% money back guarantee',
    'Small group experience (max 8 people)',
    'Expert guides with experience',
    'Pick up and drop off from your accommodation',
    'Unlimited miles and time',
    'Tips for Northern Lights viewing',
    'Sightseeing of Lapland',
    'Multiple viewing locations for best chances'
  ];

  const itinerary = [
    {
      time: '20:00',
      activity: 'Pick up from hotel',
      description: 'We\'ll collect you from your accommodation in Rovaniemi'
    },
    {
      activity: 'Driving to see the lights',
      description: 'Head to our secret Northern Lights spots'
    },
    {
      activity: 'Visiting best locations',
      description: 'Visit multiple locations for the best viewing opportunities'
    },
    {
      time: '00:00 - 05:00',
      activity: 'Returning to accommodation',
      description: 'Drop off between 00:00 - 05:00 depending on distance traveled'
    }
  ];

  // const pricing = [
  //   {
  //     option: "Adult (15+ years)",
  //     price: "€179",
  //     includes: ["All equipment", "Professional guide", "Hot drinks & snacks", "Transportation"]
  //   },
  //   {
  //     option: "Child (0-14 years)",
  //     price: "€129",
  //     includes: ["All equipment", "Professional guide", "Hot drinks & snacks", "Transportation"]
  //   }
  // ];

  return (
    <div className="min-h-screen bg-black">


      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/lights1.jpg", "/lights2.jpg", "/lights3.jpg"]}
          className="h-80 sm:h-96 md:h-[500px]"
          alt="Northern Lights Tour Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-20 sm:pt-0">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Guaranteed Northern Lights Tour
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-clean max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl">
              Experience the magical Aurora Borealis in the pristine Lapland wilderness with our expert guides.
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
            <p className="text-gray-300 text-sm sm:text-base">4-6 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Max 8 people</p>
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Tour</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Our Guaranteed Northern Lights Tour is the ultimate way to experience the magical Aurora Borealis 
                in Finnish Lapland. With experienced guides who know the best Northern Lights spots, we'll take 
                you to multiple viewing locations for the highest chances of seeing this natural wonder.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                We'll ensure you have the best possible experience at each location and create unforgettable 
                memories under the dancing lights of the Northern Lights.
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

            {/* Exclusions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Not Included</h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xl font-bold">×</div>
                  <span className="text-gray-300 text-sm sm:text-base">Food and drinks</span>
                </div>
                <div className="flex items-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xl font-bold">×</div>
                  <span className="text-gray-300 text-sm sm:text-base">Clothing and personal equipment</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-amber-300 text-sm font-medium">
                  <strong>Important:</strong> Please dress warmly for Arctic conditions. We recommend thermal layers, 
                  waterproof outerwear, warm boots, gloves, and a hat.
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

          {/* Right Column - Booking Form (Wider) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Your Tour</h2>
                <BookingForm
                  tourId={1}
                  tourName="Guaranteed Northern Lights Tour"
                  adultPrice={179}
                  childPrice={129}
                  maxCapacity={8}
                  seasonStart="10-01"
                  seasonEnd="04-15"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NorthernLightsTour;
