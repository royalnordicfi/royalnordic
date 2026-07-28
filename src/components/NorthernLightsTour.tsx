import { Clock, Users, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { getAllTours } from '../lib/api';

const NorthernLightsTour = () => {
  // const navigate = useNavigate();
  const [tourData, setTourData] = useState({
    adult_price: 179,
    child_price: 129,
    max_capacity: 16
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const northernLightsTour = tours.find(tour => tour.id === 1);
        if (northernLightsTour) {
          setTourData({
            adult_price: northernLightsTour.adult_price,
            child_price: northernLightsTour.child_price,
            max_capacity: northernLightsTour.max_capacity || 100
          });
        }
      } catch (error) {
        console.error('Error loading tour data:', error);
        // Keep default values if loading fails
      } finally {
        setLoading(false);
      }
    };

    loadTourData();
  }, []);

  const features = [
    'Northern Lights guarantee (see Terms for the exact promise)',
    'Small group — max 16 guests',
    'Expert local guides (English & Finnish)',
    'Hotel pickup and drop-off in the Rovaniemi area',
    'Warm drinks and snacks',
    'Flexible duration based on aurora forecasts (typically ~6 hours)',
    'Unlimited miles to clearer skies when needed',
    'Photography guidance from your guide',
    'Multiple viewing locations for the best chances',
    'Scenic Lapland sightseeing en route'
  ];

  const itinerary = [
    {
      time: '~20:00',
      activity: 'Pickup',
      description: 'Exact pickup time is confirmed after booking. Please be ready 10–30 minutes before.'
    },
    {
      activity: 'Aurora hunt',
      description: 'We drive to the best viewing spots for that night based on live forecasts — sometimes farther when skies are clearer.'
    },
    {
      activity: 'Photo stops',
      description: 'Warm drinks, snacks, and time to enjoy the Arctic night at each location.'
    },
    {
      time: 'Return',
      activity: 'Drop-off',
      description: 'Return time depends on distance traveled — usually between midnight and early morning.'
    }
  ];

  const knowBefore = [
    'Auroras often look more colourful in photos than with the naked eye.',
    'Dress in warm layers: thermal base, insulating mid-layer, windproof outerwear, warm boots, hat, and gloves.',
    'Tell us about snack allergies when you book.',
    'Extreme weather or unsafe road conditions may lead to reschedule or refund.',
    'Free cancellation up to 24 hours before departure.'
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
          images={["/nortti1.jpg", "/nortti3.jpg", "/nortti5.jpg", "/nortti7.jpg"]}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Northern Lights Tour Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-32 sm:pt-36 md:pt-32 lg:pt-28 xl:pt-24">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/northern-lights-tours" 
              className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Northern Lights Tours
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Guaranteed Northern Lights Tour
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              Chase the Aurora Borealis from Rovaniemi with expert guides, hotel pickup, and photography guidance under the Arctic sky.
            </p>
            <p className="mt-4 text-sm text-emerald-200/90 font-clean">
              ★★★★★ 4.8 · 110+ verified GetYourGuide reviews
            </p>
          </div>
        </div>
        
        {/* Bottom transition overlay for smooth flow to content - positioned much lower to give more space for text */}
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Quick Info - More compact on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">2–10 hours (typically ~6h)</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Small group, max {tourData.max_capacity || 16}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Rovaniemi, Lapland</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center mb-2 sm:mb-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Languages</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">English &amp; Finnish</p>
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
                Hunt the Aurora Borealis from Rovaniemi with local guides who read live solar and weather data,
                then drive as far as needed for clearer skies — including across borders when conditions call for it.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Hotel pickup, a warm vehicle, hot drinks, and photography guidance are included. Duration is flexible
                (typically around six hours, up to ten when the sky needs more time). Free cancellation up to 24 hours before departure.
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
                  <span className="text-gray-300 text-sm sm:text-base">Clothing and personal equipment (bring warm Arctic layers)</span>
                </div>
              </div>
            </div>

            {/* Know before you go */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Know Before You Go</h2>
              <ul className="space-y-2">
                {knowBefore.map((item) => (
                  <li key={item} className="flex items-start text-gray-300 text-sm sm:text-base font-clean">
                    <span className="text-emerald-400 mr-2 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-gray-400">
                Also listed on{' '}
                <a
                  href="https://www.getyourguide.com/en-gb/rovaniemi-l2653/rovaniemi-revontulit-ja-valokuvausretki-t629222/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
                >
                  GetYourGuide
                </a>
                {' '}(4.8 · 110+ reviews).
              </p>
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
                {loading ? (
                  <div className="text-center text-white">Loading tour data...</div>
                ) : (
                  <BookingForm
                    tourId={1}
                    tourName="Guaranteed Northern Lights Tour"
                    adultPrice={tourData.adult_price}
                    childPrice={tourData.child_price}
                    maxCapacity={tourData.max_capacity}
                    seasonStart="09-15"
                    seasonEnd="04-15"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-luxury font-bold text-white mb-6 sm:mb-8 text-center bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Aurora Gallery
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/lights7.jpg" 
                alt="Aurora Borealis 1" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/lights8.jpg" 
                alt="Aurora Borealis 2" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/lights9.jpg" 
                alt="Aurora Borealis 3" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/nortti9.jpg" 
                alt="Northern Lights Experience 1" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/nortti10.jpg" 
                alt="Northern Lights Experience 2" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/nortti11.jpg" 
                alt="Northern Lights Experience 3" 
                className="w-full h-32 sm:h-40 lg:h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NorthernLightsTour;
