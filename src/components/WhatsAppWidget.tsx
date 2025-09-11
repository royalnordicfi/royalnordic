import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppWidget = () => {
  // Your WhatsApp direct link
  const whatsappUrl = 'https://wa.me/message/32DREESZC5QUB1';

  const handleWhatsAppClick = () => {
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
  };

  return (
    <>
      {/* WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-[9999]">
        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group"
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle size={28} className="group-hover:animate-pulse" />
        </button>
        
        {/* Pulse animation ring */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20"></div>
      </div>

    </>
  );
};

export default WhatsAppWidget;
