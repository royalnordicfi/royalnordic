import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppWidget = () => {
  // Your WhatsApp direct link
  const whatsappUrl = 'https://wa.me/message/32DREESZC5QUB1';
  
  // Debug: Check if component is rendering
  console.log('WhatsAppWidget rendered, URL:', whatsappUrl);

  const handleWhatsAppClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('WhatsApp button clicked!', whatsappUrl);
    
    // Try multiple methods to ensure it works
    try {
      if (window.open) {
        const newWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          console.log('Popup blocked, trying direct navigation');
          window.location.href = whatsappUrl;
        } else {
          console.log('WhatsApp opened in new window');
        }
      } else {
        console.log('window.open not available, using direct navigation');
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      window.location.href = whatsappUrl;
    }
  };

  return (
    <>
      {/* WhatsApp Button */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
        <button
          onClick={handleWhatsAppClick}
          onMouseDown={handleWhatsAppClick}
          onTouchStart={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95 group cursor-pointer select-none relative"
          style={{ 
            minWidth: '60px', 
            minHeight: '60px',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          aria-label="Open WhatsApp chat"
        >
          <MessageCircle size={32} className="group-hover:animate-pulse" />
          
          {/* Online indicator dot */}
          <div 
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"
            style={{ zIndex: 10000 }}
          >
            <div className="w-full h-full bg-red-500 rounded-full animate-ping opacity-75"></div>
          </div>
        </button>
        
        {/* Pulse animation ring */}
        <div 
          className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20 pointer-events-none"
          style={{ zIndex: 9998 }}
        ></div>
      </div>

    </>
  );
};

export default WhatsAppWidget;
