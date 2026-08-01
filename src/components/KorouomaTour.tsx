import { Clock, Users, MapPin, CheckCircle, ArrowLeft, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import Footer from './Footer';
import { getAllTours } from '../lib/api';
import ProductFaq from './seo/ProductFaq';
const KORUOMA_MAX_CAPACITY = 16;

const KorouomaTour = () => {
  const [tourData, setTourData] = useState({
    adult_price: 129,
    child_price: 109,
    max_capacity: KORUOMA_MAX_CAPACITY
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const korouomaTour = tours.find(tour => tour.id === 6);
        if (korouomaTour) {
          setTourData({
            adult_price: korouomaTour.adult_price || 129,
            child_price: korouomaTour.child_price || 109,
            max_capacity: KORUOMA_MAX_CAPACITY
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
    'Campfire picnic with grilled snacks and hot drinks',
    'Guided hike to Korouoma’s frozen waterfalls',
    'Photo stops at scenic viewpoints',
    'Warm, comfortable minivan or minibus',
    'Small group — max 8 people per vehicle',
    'Expert knowledge of Korouoma geology and nature'
  ];

  const itinerary = [
    {
      time: '~09:00',
      activity: 'Pickup in Rovaniemi',
      description: 'Hotel pickup from the Rovaniemi area. Exact time is confirmed after booking.'
    },
    {
      time: '1.5 h',
      activity: 'Drive to Korouoma',
      description: 'About 100 km by warm vehicle to Korouoma Canyon Nature Reserve.'
    },
    {
      time: '3 h',
      activity: 'Guided canyon hike',
      description: 'Snowy trails, frozen waterfalls, photo stops, and a campfire picnic with grilled snacks and hot drinks.'
    },
    {
      time: '1.5 h',
      activity: 'Return to Rovaniemi',
      description: 'Drive back and drop-off at your accommodation.'
    }
  ];

  const knowBefore = [
    'The tour is outdoors in winter conditions — dress in warm layers and sturdy footwear.',
    'Not suitable for wheelchair users.',
    'Free cancellation up to 24 hours before departure.',
    'Tell us about snack allergies when you book.'
  ];

  const faqs = [
    {
      question: 'How long is the Korouoma Canyon tour?',
      answer:
        'About 6 hours in total — roughly 1.5 hours each way from Rovaniemi and about 3 hours at the canyon for hiking, photos, and a campfire picnic.',
    },
    {
      question: 'What should I wear?',
      answer:
        'Warm layers, winter boots, gloves, and a hat. Clothing is not provided. The hike is outdoors in snowy canyon conditions.',
    },
    {
      question: 'Is the tour difficult?',
      answer:
        'It is a moderate outdoor hike on winter trails. It is not suitable for wheelchair users. A reasonable fitness level helps you enjoy the canyon walks.',
    },
    {
      question: 'Is hotel pickup included?',
      answer:
        'Yes. Hotel pickup and drop-off from Rovaniemi are included, along with an English & Finnish guide and a warm vehicle.',
    },
    {
      question: 'Is this suitable for children?',
      answer:
        'Children are welcome with an adult if they can manage a moderate outdoor winter hike. Child pricing applies for ages 0–17.',
    },
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
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Korouoma Canyon Winter Adventure
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              Canyon hike among frozen waterfalls — small-group guided tour from Rovaniemi with transport and campfire picnic.
            </p>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-24 md:h-28 bg-gradient-to-t from-black via-black/90 to-transparent z-10"></div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Quick Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Duration</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">6 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Group Size</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Small group — max 8 people per vehicle</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Location</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Korouoma Canyon, Lapland</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10 col-span-2 sm:col-span-1">
            <div className="flex items-center mb-2 sm:mb-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <p className="text-white font-semibold text-sm sm:text-base">Languages</p>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">English &amp; Finnish</p>
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
                Embark on a winter adventure through Korouoma Canyon — one of Lapland’s most stunning natural wonders.
                We drive about 100 km from Rovaniemi, then hike snow-covered trails among towering cliffs and frozen waterfalls.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Along the way, enjoy a cozy campfire break with grilled snacks and hot drinks. Transport, guiding, and the picnic are included;
                bring your own warm winter clothing.
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

            {/* What's Not Included */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Not Included</h2>
              <div className="space-y-2">
                <div className="flex items-start">
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm sm:text-base">Warm winter clothing (bring layered Arctic clothing and sturdy footwear)</span>
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

            {/* Highlights */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-lg sm:rounded-xl p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-luxury font-bold text-white mb-3 sm:mb-4">Experience Highlights</h2>
              <ul className="space-y-2 text-gray-300 text-sm sm:text-base">
                <li>Explore Korouoma Canyon’s frozen waterfalls and snowy trails</li>
                <li>Cozy campfire picnic with grilled snacks and hot drinks</li>
                <li>Small-group guided hike from Rovaniemi with transport included</li>
                <li>Photo stops among frozen cliffs and icy landscapes</li>
                <li>Warm minivan or minibus for the journey</li>
              </ul>
              <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-300 text-sm">
                  <strong>Free Cancellation:</strong> Cancel up to 24 hours in advance for a full refund
                </p>
              </div>
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-emerald-300 text-sm">
                  <strong>Book &amp; pay securely:</strong> Confirm your date online — payment is taken at booking via Stripe.
                </p>
              </div>
            </div>

            <ProductFaq items={faqs} schemaId="korouoma-faq" />
          </div>

          {/* Right Column - Booking Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-28">
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
                    // Korouoma is open all year - no season restrictions
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section */}
        <div className="mt-12 sm:mt-16 lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-luxury font-bold text-white mb-6 sm:mb-8 text-center bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent">
            Korouoma Winter Gallery
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/korouoma1.jpg" 
                alt="Frozen waterfall and snowy cliffs at Korouoma Canyon in Finnish Lapland" 
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative group overflow-hidden rounded-lg sm:rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <img 
                src="/korouoma2.jpg" 
                alt="Winter hiking trail through Korouoma Canyon Nature Reserve near Rovaniemi" 
                className="w-full h-48 sm:h-56 lg:h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default KorouomaTour;

