import { Car, Clock, Users, MapPin, CheckCircle, Mail, User, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import CategoryHero from './CategoryHero';
import Footer from './Footer';
import { Link } from 'react-router-dom';

const TransportationRovaniemiLevi = () => {
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
  
  const pricing = {
    adult: 399,
    child: 299
  };
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
          serviceType: 'Private Transportation: Rovaniemi - Levi/Kittilä',
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'Transportation Request: Rovaniemi to Levi/Kittilä - ROYAL NORDIC'
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
    'Private vehicle with professional driver',
    'Comfortable seating for up to 8 passengers',
    'Flexible departure times',
    'Direct route to Levi/Kittilä ski resorts',
    'Luggage assistance',
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
    <div className="rn-page">
      <CategoryHero
        title="Private Transportation: Rovaniemi – Levi/Kittilä"
        subtitle="Comfortable private transfers between Rovaniemi and the ski resorts of Levi and Kittilä."
        image="/transportation1.jpg"
        compact
      />

      <div className="rn-container rn-page-pad pb-12 pt-6 sm:pt-8">
        <nav className="mb-6 text-sm text-text-muted" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link to="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link to="/transportation" className="hover:text-white">Transportation</Link></li>
            <li aria-hidden>/</li>
            <li className="text-white">Rovaniemi – Levi/Kittilä</li>
          </ol>
        </nav>
        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-aurora mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Duration</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">2-3 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-aurora mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Capacity</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Up to 8 people</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Car className="w-5 h-5 sm:w-6 sm:h-6 text-aurora mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Price</h3>
            </div>
            <p className="text-aurora font-bold text-lg sm:text-xl">399€</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-aurora mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Route</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Rovaniemi to Levi/Kittilä</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Column - Service Details */}
          <div className="space-y-9 lg:col-span-7">
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
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-aurora mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
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
                        <div className="flex-shrink-0 w-14 sm:w-16 text-aurora font-semibold text-sm sm:text-base">
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

          {/* Right Column - Contact Form */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="rn-panel p-5 shadow-rn sm:p-6">
                <h2 className="font-display text-xl font-semibold text-panel-ink">Request transportation</h2>
                <p className="mt-1 text-sm text-panel-muted">From €{pricing.adult} per adult — we reply with a quote within 24 hours.</p>
                
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
                        Preferred Pickup Date
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
                        Preferred Pickup Time
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
                      Group Size & Luggage
                    </label>
                    <input
                      type="text"
                      id="groupSize"
                      name="groupSize"
                      value={formData.groupSize}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="e.g., 4 adults, 6 bags"
                    />
                  </div>

                  {/* Destination Field */}
                  <div>
                    <label htmlFor="destination" className="mb-2 block text-sm font-medium text-panel-ink">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Route Details (From → To) *
                    </label>
                    <input
                      type="text"
                      id="destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      required
                      className={inputClass}
                      placeholder="e.g., Hotel in Rovaniemi to Levi ski resort"
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
                      placeholder="Hotel name, flight number, special instructions"
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

export default TransportationRovaniemiLevi;
