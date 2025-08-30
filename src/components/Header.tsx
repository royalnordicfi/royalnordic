import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="Royal Nordic Logo" 
              className="h-12 w-auto object-contain"
            />
            <button
              onClick={handleLogoClick}
              className="text-2xl font-termes font-bold text-white italic cursor-pointer hover:text-emerald-300 transition-all duration-300"
            >
              ROYAL NORDIC
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase"
            >
              HOME
            </button>
            <button 
              onClick={() => scrollToSection('tours')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase"
            >
              TOURS
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase"
            >
              CONTACT
            </button>
          </nav>

          {/* Contact Info */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-300 font-clean">
              <Phone size={16} />
              <span>+358 45 78345138</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-300 font-clean">
              <Mail size={16} />
              <span>contact@royalnordic.fi</span>
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
              onClick={() => scrollToSection('contact')}
              className="block px-3 py-2 text-white hover:text-emerald-400 transition-colors duration-200 font-luxury font-bold text-lg tracking-wider uppercase w-full text-left"
            >
              CONTACT
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;