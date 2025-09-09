import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, MapPin, Clock, AlertTriangle } from 'lucide-react';
import ImageSlideshow from './ImageSlideshow';
import BookingForm from './BookingForm';
import { getAllTours } from '../lib/api';

const TestTour: React.FC = () => {
  const [tourData, setTourData] = useState({
    adult_price: 0.10,
    child_price: 0.10,
    max_capacity: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTourData = async () => {
      try {
        const tours = await getAllTours();
        const testTour = tours.find(tour => tour.id === 3); // Assuming test tour is ID 3
        if (testTour) {
          setTourData({
            adult_price: testTour.adult_price,
            child_price: testTour.child_price,
            max_capacity: testTour.max_capacity
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
    'Live payment testing with real Stripe',
    'Test both Stripe and crypto payments',
    'Verify email notifications work',
    'Check admin panel functionality',
    'Test calendar slot management',
    'Verify success page redirects',
    'Test error handling',
    'Confirm invoice generation'
  ];

  const itinerary = [
    {
      time: '10:00',
      activity: 'Test Payment Processing',
      description: 'Process a real 10 cent payment through Stripe live mode'
    },
    {
      time: '10:15',
      activity: 'Verify Email Notifications',
      description: 'Check that both admin and customer emails are sent correctly'
    },
    {
      time: '10:30',
      activity: 'Test Admin Panel',
      description: 'Verify booking appears in admin panel and can be managed'
    },
    {
      time: '10:45',
      activity: 'Clean Up',
      description: 'Remove test booking and verify calendar slots are freed'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Test Warning Banner */}
      <div className="bg-red-600 text-white py-2 px-4 text-center font-bold">
        ⚠️ TEST TOUR - LIVE PAYMENT TESTING - WILL BE REMOVED IN PRODUCTION ⚠️
      </div>

      {/* Hero Section */}
      <div className="relative pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Images */}
            <div className="order-2 lg:order-1">
              <ImageSlideshow />
            </div>

            {/* Right Side - Content */}
            <div className="order-1 lg:order-2 text-white">
              <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  <h2 className="text-lg font-bold text-red-300">LIVE PAYMENT TESTING</h2>
                </div>
                <p className="text-red-200 text-sm">
                  This is a test tour for live payment testing. Price: 10 cents. 
                  This tour will be removed in production.
                </p>
              </div>

              <h1 className="text-4xl lg:text-5xl font-luxury font-bold mb-6">
                TEST TOUR
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Live Payment Testing with Real Stripe Integration
              </p>

              {/* Pricing */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Test Pricing</h3>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-400">€0.10</div>
                    <div className="text-sm text-gray-400">per person</div>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  This is a test price for live payment verification. 
                  Real tours are priced at €79-179 per person.
                </p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-center text-gray-300">
                  <Clock className="w-5 h-5 mr-2 text-emerald-400" />
                  <span>30 minutes</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Users className="w-5 h-5 mr-2 text-emerald-400" />
                  <span>Max 10 people</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-2 text-emerald-400" />
                  <span>Test Location</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <CheckCircle className="w-5 h-5 mr-2 text-emerald-400" />
                  <span>Live Payments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left Side - Features & Info */}
            <div className="space-y-8">
              {/* Test Features */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Test Features</h2>
                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Itinerary */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Test Process</h2>
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
                          <p className="text-gray-300 text-xs sm:text-sm">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      {index < itinerary.length - 1 && (
                        <div className="border-t border-white/20 my-2 sm:my-3"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h3 className="text-amber-300 font-bold mb-2">Important Notes:</h3>
                <ul className="text-amber-200 text-sm space-y-1">
                  <li>• This tour will be removed in production</li>
                  <li>• Use real email addresses for testing</li>
                  <li>• Test with small amounts only</li>
                  <li>• Verify all functionality before going live</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Booking Form */}
            <div className="lg:sticky lg:top-8">
              {loading ? (
                <div className="text-center text-white">Loading test tour data...</div>
              ) : (
                <BookingForm
                  tourId={3}
                  tourName="TEST TOUR - Live Payment Testing"
                  adultPrice={tourData.adult_price}
                  childPrice={tourData.child_price}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTour;
