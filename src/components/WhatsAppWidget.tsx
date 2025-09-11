import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Your WhatsApp direct link
  const whatsappUrl = 'https://wa.me/message/32DREESZC5QUB1';

  const handleWhatsAppClick = () => {
    console.log('WhatsApp button clicked, opening:', whatsappUrl);
    // Try multiple methods to ensure it works
    if (window.open) {
      const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        // Popup blocked, try direct navigation
        window.location.href = whatsappUrl;
      }
    } else {
      // Fallback for older browsers
      window.location.href = whatsappUrl;
    }
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Test if component is rendering
  console.log('WhatsAppWidget component rendered');

  return (
    <>
      {/* WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle size={28} className="group-hover:animate-pulse" />
        </button>
        
        {/* Pulse animation ring */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
      </div>

      {/* Test Button - Direct WhatsApp Link */}
      <div className="fixed bottom-6 left-6 z-[9999]">
        <button
          onClick={handleWhatsAppClick}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
          aria-label="Test WhatsApp direct link"
        >
          Test WA
        </button>
      </div>

      {/* WhatsApp Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="bg-green-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">WhatsApp Support</h3>
                  <p className="text-green-100 text-sm">We're here to help!</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:text-green-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={32} className="text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-800 mb-2">Chat with us on WhatsApp!</h4>
                <p className="text-gray-600">
                  Get instant answers to your questions about our tours, availability, and booking process.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle size={20} />
                  <span>Open WhatsApp Chat</span>
                </button>

                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Or call us directly: <br />
                    <a 
                      href="tel:+3584578345138" 
                      className="text-green-600 hover:text-green-700 font-semibold"
                    >
                      +358 45 78345138
                    </a>
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-gray-800 mb-2">Quick Questions?</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Tour availability and dates</li>
                  <li>• Pricing and group discounts</li>
                  <li>• What to bring and wear</li>
                  <li>• Weather conditions</li>
                  <li>• Pickup locations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppWidget;
