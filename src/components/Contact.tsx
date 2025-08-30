import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    tour: '',
    message: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send email using Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Clear form after successful submission
      setFormData({
        name: '',
        email: '',
        phone: '',
        tour: '',
        message: ''
      });

      // Show success message
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again or contact us directly.');
    }
  };

  return (
    <section 
      id="contact" 
      className="py-12 pb-32 relative bg-black"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-luxury font-bold mb-4 bg-gradient-to-r from-emerald-400 to-white bg-clip-text text-transparent italic">
            CONTACT US
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed font-clean">
            Ready to embark on your Lapland adventure? Contact our local experts to plan your perfect Arctic experience.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-luxury font-bold text-white mb-4">Get In Touch</h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-luxury font-semibold mb-1">Phone</h4>
                  <p className="text-gray-300 font-clean">+358 45 78345138</p>
                  <p className="text-gray-400 text-sm font-clean">Available 24/7 for emergencies</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-luxury font-semibold mb-1">Email</h4>
                  <p className="text-gray-300 font-clean">contact@royalnordic.fi</p>
                  <p className="text-gray-400 text-sm font-clean">Response within 2 hours</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-luxury font-semibold mb-1">Location</h4>
                  <p className="text-gray-300 font-clean">Rovaniemi, Finnish Lapland</p>
                  <p className="text-gray-400 text-sm font-clean">Gateway to the Arctic</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50">
            <h3 className="text-xl font-luxury font-bold text-white mb-4">Send us a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-clean font-medium text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors duration-200 font-clean"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-clean font-medium text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors duration-200 font-clean"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-clean font-medium text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors duration-200 font-clean"
                  placeholder="+47 123 45 678"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-clean font-medium text-gray-300 mb-1">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors duration-200 font-clean"
                  placeholder="Tell us about your desired Arctic experience..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-lg font-modern font-semibold text-base transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2 shadow-lg hover:shadow-emerald-500/40"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>

            {showSuccess && (
              <div className="mt-4 text-center text-green-400 text-sm font-clean transition-all duration-500 ease-out animate-in fade-in slide-in-from-top-2">
                Message sent successfully! We'll get back to you soon.
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom fade transition overlay for smooth flow to footer */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none"></div>
    </section>
  );
};

export default Contact;