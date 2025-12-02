import React, { useState } from 'react';
import { Clock, Users, MapPin, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';
import Footer from './Footer';

const MonsterTruckNorthernLights: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    adults: 1,
    children: 0,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'adults' || name === 'children' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Format the message with all details
      const message = `Monster Truck Northern Lights Experience Request

Preferred Date: ${formData.preferredDate || 'Not specified'}
Adults: ${formData.adults}
Children: ${formData.children}
Total Participants: ${formData.adults + formData.children}

${formData.message ? `Additional Message:\n${formData.message}` : ''}`;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-customized-tour-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: message,
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'New Monster Truck Northern Lights Experience Request - ROYAL NORDIC'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }

      setSubmitStatus('success');
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        preferredDate: '',
        adults: 1,
        children: 0,
        message: '' 
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error) {
      console.error('Error sending request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    'Professional guide and driver',
    'Specially built monster truck vehicle',
    'Remote Northern Lights viewing locations',
    'Insights about Lapland\'s nature and aurora phenomenon',
    'Designed for families, friends, and adventure seekers',
    'No previous experience required',
    'Deep into snowy wilderness away from city lights'
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/monsteri1.jpg", "/monsteri2.jpg", "/monsteri3.jpg"]}
          className="h-[35rem] sm:h-[40rem] md:h-[45rem] lg:h-[50rem]"
          alt="Monster Truck Northern Lights Experience Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pt-32 sm:pt-36 md:pt-32 lg:pt-28 xl:pt-24">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <Link 
              to="/"
              className="inline-flex items-center bg-emerald-500 text-white hover:bg-emerald-600 transition-all duration-300 font-medium px-4 py-2 rounded-lg mb-8 sm:mb-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Monster Truck Northern Lights Experience
              </span>
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white font-clean max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl px-2">
              Experience the magic of the Arctic night on board a giant monster truck! This unique adventure takes you deep into the snowy wilderness, far away from city lights, where you have the best chance of spotting the Northern Lights.
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
            <p className="text-gray-300 text-sm sm:text-base">3 hours</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Flexible</p>
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
          {/* Left Column - Tour Details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Aurora Hunting Experience with Monster Truck</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                Experience the magic of the Arctic night on board a giant monster truck! This unique adventure takes you deep into the snowy wilderness, far away from city lights, where you have the best chance of spotting the Northern Lights.
              </p>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                As you ride in a specially built monster truck, your guide will lead you to remote viewing spots and share insights about Lapland's nature and the aurora phenomenon. This safari is designed for families, friends, and adventure seekers who want to combine the thrill of off-road travel with the beauty of the northern sky.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                No previous experience is required – just dress warmly and get ready for an unforgettable journey under the stars.
              </p>
            </div>

            {/* What's Included */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What's Included</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Exclusions */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-base sm:text-lg font-luxury font-bold text-white mb-2">Exclusions</h3>
                <p className="text-gray-300 text-sm sm:text-base">Food & drinks</p>
              </div>

              {/* What to Bring */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <h3 className="text-base sm:text-lg font-luxury font-bold text-white mb-2">What to Bring</h3>
                <p className="text-gray-300 text-sm sm:text-base">Warm winter clothes! Dress warmly for the Arctic night.</p>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-4">Experience Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <img 
                  src="/lights1.jpg" 
                  alt="Northern Lights" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <img 
                  src="/lights3.jpg" 
                  alt="Northern Lights" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <img 
                  src="/lights5.jpg" 
                  alt="Northern Lights" 
                  className="w-full h-48 object-cover rounded-lg sm:col-span-2"
                />
              </div>
            </div>

            {/* Important Note */}
            <div className="bg-emerald-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-emerald-400/20">
              <h3 className="text-lg font-luxury font-bold text-emerald-300 mb-2">Third-Party Activity</h3>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                This Monster Truck Northern Lights Experience is provided by our trusted partner. After you submit your request, we'll coordinate with the provider and get back to you with availability and pricing details.
              </p>
            </div>
          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Request Monster Truck Experience</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Your full name"
                  />

                  {/* Email */}
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />

                  {/* Phone */}
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+358 45 1234567"
                  />

                  {/* Preferred Date */}
                  <input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />

                  {/* Adults */}
                  <div>
                    <label className="block text-white text-sm mb-2">Adults</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, adults: Math.max(1, formData.adults - 1) })}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-white font-semibold min-w-[2rem] text-center">{formData.adults}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, adults: formData.adults + 1 })}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div>
                    <label className="block text-white text-sm mb-2">Children</label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, children: Math.max(0, formData.children - 1) })}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-white font-semibold min-w-[2rem] text-center">{formData.children}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, children: formData.children + 1 })}
                        className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Additional Message */}
                  <textarea
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Any additional requests or information..."
                  />
                  
                  {submitStatus === 'success' && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-center text-sm">
                      Thank you! We'll get back to you as soon as possible with availability and pricing details.
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-400 text-center text-sm">
                      Something went wrong. Please try again or contact us directly.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-lg font-modern font-semibold text-base transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Request</span>
                        <Mail className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
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

export default MonsterTruckNorthernLights;

