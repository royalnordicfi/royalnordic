import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <img
                src="/logo.png"
                alt="ROYAL NORDIC"
                className="h-8 w-auto mr-3"
              />
              <h3 className="text-xl font-luxury font-bold">ROYAL NORDIC</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4 font-clean">
              Lavish Experiences in Lapland
            </p>
            <p className="text-gray-400 text-sm font-clean">
              Premium Arctic adventures and authentic Lapland experiences
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/northern-lights-tour" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Guaranteed Northern Lights
                </Link>
              </li>
              <li>
                <Link to="/family-friendly-northern-lights" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Family Northern Lights
                </Link>
              </li>
              <li>
                <Link to="/ice-fishing" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Ice Fishing Rovaniemi
                </Link>
              </li>
              <li>
                <Link to="/ranua-zoo" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Ranua Wildlife Park
                </Link>
              </li>
              <li>
                <Link to="/korouoma-canyon" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Korouoma Canyon Tour
                </Link>
              </li>
              <li>
                <Link to="/snowshoe-rental" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Snowshoe Adventure
                </Link>
              </li>
              <li>
                <Link to="/customized-tour" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Customized Tours
                </Link>
              </li>
              <li>
                <Link to="/travel-trade" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Partner With Us
                </Link>
              </li>
              <li>
                <Link to="/transportation" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Transportation
                </Link>
              </li>
            </ul>
          </div>

          {/* Blog Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Travel Guide</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/blog/best-time-northern-lights-lapland-2025" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Best Time for Northern Lights
                </Link>
              </li>
              <li>
                <Link to="/blog/what-to-pack-lapland-winter-adventure" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  What to Pack for Lapland
                </Link>
              </li>
              <li>
                <Link to="/blog/northern-lights-photography-tips-beginners" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Northern Lights Photography
                </Link>
              </li>
              <li>
                <Link to="/blog/lapland-wildlife-animals-ranua-zoo" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Lapland Wildlife Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Information</h4>
            <div className="space-y-2 text-sm font-clean">
              <p className="text-gray-300">
                <span className="text-white font-medium">Phone:</span> +358 45 78345138
              </p>
              <p className="text-gray-300">
                <span className="text-white font-medium">Email:</span> contact@royalnordic.fi
              </p>
              <p className="text-gray-300">
                <span className="text-white font-medium">Location:</span> Rovaniemi, Lapland, Finland
              </p>
            </div>
            
            {/* Social Media Icons */}
            <div className="mt-4">
              <h5 className="text-white font-medium mb-3">Follow Us</h5>
              <div className="flex items-center space-x-4">
                <a
                  href="https://www.instagram.com/royalnordic.fi/"
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
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                  aria-label="Follow us on TikTok"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-gray-400 text-sm font-clean">
              © {new Date().getFullYear()} ROYAL NORDIC. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors font-clean">
                Privacy Policy
              </Link>
              <Link to="/terms-conditions" className="text-gray-400 hover:text-white transition-colors font-clean">
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;