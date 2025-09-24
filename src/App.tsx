// import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Tours from './components/Tours';
import Reviews from './components/Reviews';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import NorthernLightsTour from './components/NorthernLightsTour';
import SnowshoeRental from './components/SnowshoeRental';
import IceFishingTour from './components/IceFishingTour';
import RanuaZooTour from './components/RanuaZooTour';
import CustomizedTour from './components/CustomizedTour';
import PaymentSuccess from './components/PaymentSuccess';
import CryptoPaymentSuccess from './components/CryptoPaymentSuccess';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppWidget from './components/WhatsAppWidget';

function App() {
  return (
    <Router>
      <div className="App">
        <ScrollToTop />
        <Header />
        
        <Routes>
          {/* Homepage */}
          <Route path="/" element={
            <>
              <Hero />
              <div id="tours">
                <Tours />
              </div>
              <Reviews />
              <div id="about">
                <About />
              </div>
              <div id="contact">
                <Contact />
              </div>
              <Footer />
            </>
          } />
          
          {/* Tour Detail Pages */}
          <Route path="/northern-lights-tour" element={<NorthernLightsTour />} />
          <Route path="/snowshoe-rental" element={<SnowshoeRental />} />
          <Route path="/ice-fishing" element={<IceFishingTour />} />
          <Route path="/ranua-zoo" element={<RanuaZooTour />} />
          <Route path="/customized-tour" element={<CustomizedTour />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/crypto-payment-success" element={<CryptoPaymentSuccess />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
        </Routes>
        
        {/* WhatsApp Widget - appears on all pages */}
        <WhatsAppWidget />
      </div>
    </Router>
  );
}

export default App;