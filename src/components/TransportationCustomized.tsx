import { Car, Clock, Users, MapPin, CheckCircle, Mail, User, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import CategoryHero from './CategoryHero';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const TransportationCustomized = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    pickupDetails: '',
    preferredDate: '',
    preferredTime: '',
    groupSize: '',
    additionalInfo: ''
  });
  const inputClass =
    'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-panel-ink placeholder:text-panel-muted focus:border-aurora focus:outline-none focus:ring-1 focus:ring-aurora/30';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-transportation-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          destination: formData.destination,
          pickupDetails: formData.pickupDetails,
          preferredDate: formData.preferredDate || null,
          preferredTime: formData.preferredTime || '',
          groupSize: formData.groupSize || '',
          additionalInfo: formData.additionalInfo,
          serviceType: 'Private Customized Transportation',
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'Custom Transportation Request - ROYAL NORDIC'
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          destination: '',
          pickupDetails: '',
          preferredDate: '',
          preferredTime: '',
          groupSize: '',
          additionalInfo: ''
        });
      } else {
        console.error('Response not ok:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Request failed:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    'Custom routes throughout Lapland',
    'Flexible scheduling and timing',
    'Professional driver with local knowledge',
    'Private vehicle for your group only',
    'Airport transfers available',
    'Hotel pickup and drop-off',
    'Luggage assistance included',
    'Child safety seats upon request',
    'Multi-stop itineraries possible',
    'Scenic route options available'
  ];

  const itinerary = [
    {
      time: 'Flexible',
      activity: 'Custom pickup location',
      description: 'We\'ll collect you from your specified location in Lapland'
    },
    {
      activity: 'Custom route and stops',
      description: 'Travel to your chosen destinations with stops as requested'
    },
    {
      activity: 'Flexible drop-off',
      description: 'Drop-off at your final destination or return to starting point'
    }
  ];

  return (
    <div className="rn-page">
      <CategoryHero
        title="Private Customized Transportation"
        subtitle="Tailored transfers for your route — airport pickups, multi-stop itineraries, and custom routes throughout Lapland."
        image="/transportation2.jpg"
        compact
      />

      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/transportation" className="hover:text-white">Transportation</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Custom transfers</li>
          </ol>
        </nav>
        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Flexible</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Capacity</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Flexible</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Coverage</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Finland</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column - Service Details */}
          <div className="space-y-9 lg:col-span-7">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About This Service</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Our customized transportation service is designed to meet your specific travel needs throughout Lapland. Whether you need airport transfers, multi-stop sightseeing tours, or transportation to remote locations, we provide flexible and personalized service.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Our experienced drivers know Lapland's roads and destinations intimately, ensuring you reach your destinations safely and efficiently. We can accommodate various group sizes and provide vehicles suitable for different types of terrain and weather conditions.
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

            {/* Popular Routes */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Popular Custom Routes</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Airport Transfers</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Rovaniemi Airport to city center or hotels</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Sightseeing Tours</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Multi-stop tours to Santa Claus Village, Ranua Zoo, and other attractions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Remote Locations</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Transportation to wilderness areas, fishing spots, and remote accommodations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Event Transportation</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Wedding parties, corporate events, and special occasions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="rn-panel p-5 shadow-rn sm:p-6">
                <h2 className="font-display text-xl font-semibold text-panel-ink">Request custom transportation</h2>
                <p className="mt-1 text-sm text-panel-muted">Tell us your route — we reply with a quote within 24 hours.</p>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-panel-ink">
                      <User className="w-4 h-4 inline mr-2" />
                      Your Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="Enter your full name"
                    />
                  </div>

                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-panel-ink">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="your.email@example.com"
                    />
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-panel-ink">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="+358 40 123 4567"
                    />
                  </div>

                  {/* Preferred Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="mb-2 block text-sm font-medium text-panel-ink">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="mb-2 block text-sm font-medium text-panel-ink">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Group Size */}
                  <div>
                    <label htmlFor="groupSize" className="mb-2 block text-sm font-medium text-panel-ink">
                      Group Size & Luggage Details
                    </label>
                    <input
                      type="text"
                      id="groupSize"
                      name="groupSize"
                      value={formData.groupSize}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="e.g., 6 adults, baby seats, ski equipment"
                    />
                  </div>

                  {/* Destination Field */}
                  <div>
                    <label htmlFor="destination" className="mb-2 block text-sm font-medium text-panel-ink">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Route & Destination Details *
                    </label>
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="e.g., Rovaniemi Airport to Levi, or custom route"
                    />
                  </div>

                  {/* Pickup Details */}
                  <div>
                    <label htmlFor="pickupDetails" className="mb-2 block text-sm font-medium text-panel-ink">
                      Pickup Instructions
                    </label>
                    <input
                      type="text"
                      id="pickupDetails"
                      name="pickupDetails"
                      value={formData.pickupDetails}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Exact pickup location, flight info, etc."
                    />
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label htmlFor="additionalInfo" className="mb-2 block text-sm font-medium text-panel-ink">
                      <MessageSquare className="w-4 h-4 inline mr-2" />
                      Additional Information
                    </label>
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                      rows={4}
                      className={`${inputClass} resize-none`}
                      placeholder="Tell us about your specific needs: dates, times, group size, child seats, special requirements, etc."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rn-btn-primary flex w-full items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Request...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Transportation Request
                      </>
                    )}
                  </button>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="text-green-400 text-sm text-center">
                      ✓ Request sent successfully! We'll contact you soon.
                    </div>
                  )}
                  {submitStatus === 'error' && (
                    <div className="text-red-400 text-sm text-center">
                      ✗ Failed to send request. Please try again or contact us directly.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TransportationCustomized;
