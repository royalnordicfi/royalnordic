import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail, Instagram } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      // Prevent negative scrolling
      if (scrollY < 0) {
        window.scrollTo(0, 0);
        return;
      }
      
      const scrolled = scrollY > 20;
      setIsScrolled(scrolled);
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className={`fixed w-full z-50 transition-all duration-500 ${
      isScrolled ? 'bg-black/95 backdrop-blur-xl shadow-2xl border-b border-gray-700' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-24 pt-1">
                 {/* Logo */}
                 <div className="flex-shrink-0 flex flex-col items-center space-y-1 ml-8">
            <img 
              src="/logo.png" 
              alt="Royal Nordic Logo" 
              className="h-10 w-auto object-contain"
            />
            <button
              onClick={handleLogoClick}
              className="text-lg font-termes font-bold text-white italic cursor-pointer hover:text-emerald-300 transition-all duration-300"
            >
              ROYAL NORDIC
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-5">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
            >
              HOME
            </button>
            <button 
              onClick={() => scrollToSection('tours')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
            >
              TOURS
            </button>
            <button 
              onClick={() => navigate('/customized-tour')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
            >
              CUSTOMIZED
            </button>
            <button 
              onClick={() => scrollToSection('transportation')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
            >
              TRANSPORTATION
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-sm lg:text-base tracking-wider uppercase whitespace-nowrap"
            >
              CONTACT
            </button>
          </nav>

          {/* Contact Info */}
          <div className="hidden xl:flex items-center space-x-6 mr-8">
            {/* Email and Phone - Stacked Vertically */}
            <div className="flex flex-col space-y-2 text-xs text-gray-300 font-clean">
              <div className="flex items-center space-x-2">
                <Mail size={12} />
                <span>contact@royalnordic.fi</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone size={12} />
                <span>+358 45 78345138</span>
              </div>
            </div>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-6">
              <a
                href="https://www.instagram.com/royalnordicfi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-500 transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@royalnordic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-black transition-colors duration-200"
                aria-label="Follow us on TikTok"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className={`md:hidden transition-all duration-500 ${
          isScrolled ? 'bg-black/95 backdrop-blur-lg border-t border-gray-800/50' : 'bg-black/90 backdrop-blur-md border-t border-gray-700/50'
        }`}>
          <div className="px-4 pt-2 pb-3 space-y-1">
            <button 
              onClick={() => scrollToSection('home')}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              HOME
            </button>
            <button 
              onClick={() => scrollToSection('tours')}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              TOURS
            </button>
            <button 
              onClick={() => {
                navigate('/customized-tour');
                setIsMobileMenuOpen(false);
              }}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              CUSTOMIZED EXPERIENCE
            </button>
            <button 
              onClick={() => scrollToSection('transportation')}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              TRANSPORTATION
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              CONTACT
            </button>
            
            {/* Mobile Contact Info */}
            <div className="pt-4 border-t border-gray-700 space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                <Phone size={16} />
                <span>+358 45 78345138</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                <Mail size={16} />
                <span>contact@royalnordic.fi</span>
              </div>
            </div>
            
            {/* Mobile Social Media Icons */}
            <div className="flex items-center justify-center space-x-8 pt-4">
              <a
                href="https://www.instagram.com/royalnordicfi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-pink-500 transition-colors duration-200"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={24} />
              </a>
              <a
                href="https://www.tiktok.com/@royalnordic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-black transition-colors duration-200"
                aria-label="Follow us on TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;