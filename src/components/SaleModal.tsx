import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';

const SaleModal: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Check if sale is active (Dec 2-16, 2025)
    const now = new Date();
    const saleStart = new Date('2025-12-02');
    const saleEnd = new Date('2025-12-16');
    saleEnd.setHours(23, 59, 59, 999); // End of day

    const isSaleActive = now >= saleStart && now <= saleEnd;

    if (!isSaleActive) {
      return; // Don't show if sale is not active
    }

    // Check if user is on homepage
    const isHomepage = window.location.pathname === '/';

    if (!isHomepage) {
      return; // Only show on homepage
    }

    // Check if modal was already shown in this session
    const hasSeenModal = sessionStorage.getItem('saleModalShown');

    if (!hasSeenModal) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('saleModalShown', 'true');
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // If they've seen it, show collapsed button
      setIsCollapsed(true);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setIsCollapsed(true);
  };

  const handleReopen = () => {
    setIsVisible(true);
    setIsCollapsed(false);
  };

  // Check if sale is active
  const now = new Date();
  const saleStart = new Date('2025-12-02');
  const saleEnd = new Date('2025-12-16');
  saleEnd.setHours(23, 59, 59, 999);
  const isSaleActive = now >= saleStart && now <= saleEnd;

  if (!isSaleActive) {
    return null;
  }

  // Collapsed button (left corner)
  if (isCollapsed && !isVisible) {
    return (
      <button
        onClick={handleReopen}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-3 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all transform hover:scale-110 border-2 border-emerald-400/50"
        aria-label="View December Sale"
        title="December Sale - 15% OFF"
      >
        <Tag size={24} />
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-emerald-400/50">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/lights1.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors bg-black/30 rounded-full p-2 hover:bg-black/50"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div className="text-center">
            {/* Sale Badge */}
            <div className="inline-block bg-emerald-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-emerald-400/30">
              <span className="text-emerald-300 font-bold text-xs tracking-widest uppercase font-clean">Limited Time Offer</span>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl font-luxury font-bold text-white mb-3 leading-tight">
              Start of December Sale
            </h2>

            {/* Discount */}
            <div className="text-7xl md:text-8xl font-luxury font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400 mb-4 leading-none">
              15% OFF
            </div>

            {/* Code */}
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-5 mb-5 border border-white/20">
              <p className="text-white/80 text-sm mb-3 font-clean">Use code at checkout:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-3xl font-bold text-white bg-emerald-600/30 px-6 py-3 rounded-lg font-mono tracking-widest border border-emerald-400/30">
                  DECEMBER15
                </code>
              </div>
            </div>

            {/* Description */}
            <p className="text-white/90 text-base mb-6 leading-relaxed font-clean">
              Valid for <strong className="text-emerald-300">all tours</strong> from December 2-16, 2025
            </p>

            {/* CTA Button */}
            <button
              onClick={handleClose}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-elegant font-bold px-8 py-4 rounded-full transition-all transform hover:scale-105 shadow-2xl hover:shadow-emerald-500/40 tracking-wider border-2 border-emerald-400/50 text-lg"
              style={{
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
              }}
            >
              Start Booking Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleModal;

