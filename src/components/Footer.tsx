import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              Achieve Happiness in Lapland
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
                  Northern Lights Tour
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
                <Link to="/#contact" className="text-gray-300 hover:text-white transition-colors text-sm font-clean">
                  Contact
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
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-gray-400 text-sm font-clean">
              © 2025 ROYAL NORDIC. All rights reserved.
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