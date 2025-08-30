import React, { useState } from 'react';
import { CheckCircle, Mail, Phone, MapPin, Clock, Users, Star, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageSlideshow from './ImageSlideshow';

const CustomizedTour: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const customizationOptions = [
    "Northern Lights photography tours",
    "Private wilderness expeditions",
    "Cultural experiences with locals",
    "Adventure sports (ice climbing, snowmobiling)",
    "Family-friendly activities",
    "Luxury VIP experiences",
    "Multi-day expeditions",
    "Seasonal special events"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
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
          message: formData.message,
          to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
          subject: 'New Customized Tour Request - ROYAL NORDIC'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send request');
      }

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      
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

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Back Button - Always visible when scrolling */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-24 left-8 z-50 bg-black/80 hover:bg-black/95 text-white p-4 sm:p-5 rounded-full transition-all duration-300 shadow-xl hover:shadow-2xl backdrop-blur-md border border-white/30 hover:border-white/50 group"
        aria-label="Go back to homepage"
      >
        <ArrowLeft className="w-7 h-7 sm:w-8 sm:h-8 group-hover:-translate-x-1 transition-transform duration-300" />
      </button>

      {/* Header */}
      <div className="relative">
        <ImageSlideshow 
          images={["/snowyscene.png", "/slideshow3.jpg"]}
          className="h-80 sm:h-96 md:h-[500px]"
          alt="Customized Tours Images"
        />
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-luxury font-bold mb-4 sm:mb-6 leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-emerald-400 via-white to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">
                Customized Tours
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white font-clean max-w-3xl mx-auto leading-relaxed font-semibold drop-shadow-2xl">
              Create your perfect Lapland adventure with personalized experiences tailored to your dreams.
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
            <p className="text-gray-300 text-sm sm:text-base">Flexible</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Group Size</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Any size</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
            <div className="flex items-center mb-2 sm:mb-3">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 mr-2 sm:mr-3" />
              <h3 className="text-white font-semibold text-sm sm:text-base">Location</h3>
            </div>
            <p className="text-gray-300 text-sm sm:text-base">Lapland, Finland</p>
          </div>
        </div>

        {/* Mobile: Contact Form First */}
        <div className="block lg:hidden mb-6 sm:mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Request Your Custom Tour</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Your full name"
              />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+358 45 1234567"
              />
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Describe your ideal Lapland experience..."
              />
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
                    <span>Send Custom Tour Request</span>
                    <Mail className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Left Column - Tour Details (Smaller) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* About Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">About Customized Tours</h2>
              <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4 font-clean">
                At Royal Nordic, we believe every traveler has unique dreams and preferences. Our customized tour service allows you to create the perfect Lapland experience that matches your vision, schedule, and interests perfectly.
              </p>
              <p className="text-gray-300 text-sm sm:text-base font-clean">
                Whether you're planning a romantic getaway, a family adventure, a photography expedition, or a corporate retreat, our experienced team will work closely with you to design an itinerary that exceeds your expectations. We take pride in our attention to detail and commitment to creating truly memorable experiences.
              </p>
            </div>

            {/* What We Can Customize */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">What We Can Customize</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {customizationOptions.map((option, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300 text-sm sm:text-base">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">Why Choose Our Customized Tours</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Personalized Planning</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Every tour is designed specifically for your group, taking into account your interests, fitness levels, and preferences.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Local Expertise</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">Our deep knowledge of Lapland's hidden gems ensures you experience the most authentic and beautiful locations.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-semibold text-sm sm:text-base">Flexible Group Sizes</h4>
                    <p className="text-gray-300 text-xs sm:text-sm">From intimate private tours to larger group experiences, we accommodate any group size with personalized attention.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form (Wider) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-luxury font-bold text-white mb-4 sm:mb-6 text-center">Request Your Custom Tour</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="+358 45 1234567"
                  />
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Describe your ideal Lapland experience..."
                  />
                  
                  {submitStatus === 'success' && (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3 text-emerald-400 text-center text-sm">
                      Thank you! We'll get back to you within 24 hours to discuss your custom tour.
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
                        <span>Send Custom Tour Request</span>
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
    </div>
  );
};

export default CustomizedTour;
