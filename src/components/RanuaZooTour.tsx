import { Clock, Users, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { getAllTours } from '../lib/api';

const RANUA_MAX_CAPACITY = 16;

const RanuaZooTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 99,
    child_price: 79,
    max_capacity: RANUA_MAX_CAPACITY,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const ranuaZooTour = tours.find((tour) => tour.id === 5);
        if (ranuaZooTour) {
          setTourData({
            adult_price: ranuaZooTour.adult_price || 99,
            child_price: ranuaZooTour.child_price || 79,
            max_capacity: RANUA_MAX_CAPACITY,
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
    'Hotel pickup and drop-off from Rovaniemi',
    'Professional guide (English & Finnish)',
    'Comfortable transportation to Ranua',
    'Entrance tickets to Ranua Wildlife Park',
    'Meet polar bears and 50+ Arctic species',
    'Guidance and tips about Arctic wildlife',
    'Free time to explore and take photos',
    `Small group experience (max ${RANUA_MAX_CAPACITY} people)`,
  ];

  const itinerary = [
    {
      time: '~09:30',
      activity: 'Pickup in Rovaniemi',
      description: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.',
    },
    {
      time: '1 h',
      activity: 'Drive to Ranua',
      description: 'Scenic drive through Lapland wilderness to Ranua Wildlife Park.',
    },
    {
      time: '~3.5 h',
      activity: 'Ranua Wildlife Park',
      description:
        'Explore forest trails and habitats — polar bears, lynx, wolves, moose, reindeer, arctic foxes, and more. Free time for photos at your own pace.',
    },
    {
      time: '1 h',
      activity: 'Return to Rovaniemi',
      description: 'Drive back and drop-off at your accommodation.',
    },
  ];

  const knowBefore = [
    'Please tell us in advance about any mobility or dietary requirements.',
    'Wear warm clothing and comfortable shoes suitable for walking.',
    'A camera or smartphone is recommended for photography.',
    'Lunch and drinks are not included — cafés and restaurants are available at the park.',
    'Free cancellation up to 24 hours before departure.',
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative">
        <ImageSlideshow
          images={['/ranua1.jpg', '/ranua2.jpeg', '/ranua3.jpeg', '/ranua4.jpeg', '/ranua5.jpeg']}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Ranua Zoo Tour Images"
        />

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
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Nordic Animals of Ranua Zoo
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              Day trip from Rovaniemi to Finland’s northernmost zoo — polar bears and 50+ Arctic species, with transfers included.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">5 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Max {RANUA_MAX_CAPACITY} people</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Ranua Wildlife Park</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center mb-2 sm:mb-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Languages</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">English &amp; Finnish</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Tour</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Depart Rovaniemi for a guided day trip through Lappish landscapes to Ranua Wildlife Park — home to over 50 Arctic and northern species, including polar bears, lynxes, wolves, moose, reindeer, and arctic foxes.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Walk peaceful forest trails, see animals in spacious habitats, and enjoy free time for photos. Transfers and entrance tickets are included. Perfect for families, animal lovers, and photographers.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What&apos;s Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What&apos;s Not Included</h2>
              <div className="space-y-2">
                {[
                  'Meals and drinks (optional lunch available at the park)',
                  'Personal expenses and souvenirs',
                  'Winter clothing or boot rental',
                ].map((item) => (
                  <div key={item} className="flex items-start">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0 text-xl font-bold">
                      ×
                    </div>
                    <span className="text-gray-300 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

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
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Tour Itinerary</h2>
              <div className="space-y-2 sm:space-y-3">
                {itinerary.map((item, index) => (
                  <div key={item.activity}>
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

          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">
                  Book Your Tour
                </h2>
                {loading ? (
                  <div className="text-center text-white">Loading tour data...</div>
                ) : (
                  <BookingForm
                    tourId={5}
                    tourName="Nordic Animals of Ranua Zoo"
                    adultPrice={tourData.adult_price}
                    childPrice={tourData.child_price}
                    maxCapacity={tourData.max_capacity}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RanuaZooTour;
