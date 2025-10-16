import { Clock, Users, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { getAllTours } from '../lib/api';

const RanuaZooTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 99,
    child_price: 79,
    max_capacity: 8
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const ranuaZooTour = tours.find(tour => tour.id === 5);
        if (ranuaZooTour) {
          setTourData({
            adult_price: ranuaZooTour.adult_price,
            child_price: ranuaZooTour.child_price,
            max_capacity: ranuaZooTour.max_capacity
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
    'Hotel pick-up and drop-off',
    'Professional local guide',
    'Transportation to and from Ranua',
    'Tickets to Ranua Zoo',
    'Visiting wonderful animals of Finland',
    'Small group experience (max 8 people)',
    'Educational experience about Nordic wildlife',
    'Free time to explore the zoo'
  ];

  const itinerary = [
    {
      time: '09:30',
      activity: 'Pick up from hotel',
      description: 'We\'ll collect you from your accommodation in Rovaniemi'
    },
    {
      time: '10:00',
      activity: 'Drive to Ranua Zoo',
      description: 'Enjoy a scenic 1-hour drive through Lapland\'s beautiful landscapes'
    },
    {
      time: '11:00',
      activity: 'Arrive at Ranua Zoo',
      description: 'Enter the zoo and begin your wildlife adventure'
    },
    {
      activity: 'Explore Nordic animals',
      description: 'Visit bears, wolves, lynx, reindeer, and many other Arctic animals'
    },
    {
      activity: 'Educational experience',
      description: 'Learn about Finnish wildlife and conservation efforts'
    },
    {
      time: '13:30',
      activity: 'Departure from zoo',
      description: 'Begin the journey back to Rovaniemi'
    },
    {
      time: '14:30',
      activity: 'Return to accommodation',
      description: 'Drop off at your hotel in Rovaniemi'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/ranua1.jpg", "/ranua2.jpeg", "/ranua3.jpeg", "/ranua4.jpeg", "/ranua5.jpeg"]}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Ranua Zoo Tour Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-32 sm:pt-36 md:pt-40">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/daytime-experiences" 
              className="inline-flex items-center border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Daytime Experiences
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Nordic Animals of Ranua Zoo
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-clean max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl">
              Discover the incredible wildlife of Finland at Ranua Zoo, home to bears, wolves, lynx, and many other Nordic animals.
            </p>
          </div>
        </div>
        
        {/* Bottom transition overlay for smooth flow to content */}
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
            <p className="text-gray-300 text-sm sm:text-base">5 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Max {tourData.max_capacity} people</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Ranua Zoo, Lapland</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Tour Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Tour</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Experience the incredible wildlife of Finland at Ranua Zoo, the northernmost zoo in the world. 
                This family-friendly adventure takes you to see bears, wolves, lynx, reindeer, and many other 
                Nordic animals in their natural-like habitats.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Perfect for families and animal lovers, this educational experience combines wildlife viewing 
                with learning about Finnish nature and conservation efforts. The zoo is located in beautiful 
                Lapland forest, making it a perfect day trip from Rovaniemi.
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
                  <span className="text-gray-300 text-sm sm:text-base">Dinner</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-300 text-sm font-medium">
                  <strong>Note:</strong> There are restaurants and cafes available at the zoo if you'd like to purchase food during your visit.
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

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Book Your Tour</h2>
                {loading ? (
                  <div className="text-center text-white">Loading tour data...</div>
                ) : (
                  <BookingForm
                    tourId={5}
                    tourName="Nordic Animals of Ranua Zoo"
                    adultPrice={tourData.adult_price}
                    childPrice={tourData.child_price}
                    maxCapacity={tourData.max_capacity}
                    seasonStart="09-25"
                    seasonEnd="06-30"
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

export default RanuaZooTour;
