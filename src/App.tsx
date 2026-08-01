// import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS } from './lib/productVisibility';
import Header from './components/Header';
import Hero from './components/Hero';
import Tours from './components/Tours';
import Transportations from './components/Transportations';
import Reviews from './components/Reviews';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import NorthernLightsTour from './components/NorthernLightsTour';
import SnowshoeRental from './components/SnowshoeRental';
import IceFishingTour from './components/IceFishingTour';
import RanuaZooTour from './components/RanuaZooTour';
import KorouomaTour from './components/KorouomaTour';
import CustomizedTour from './components/CustomizedTour';
import NorthernLightsTours from './components/NorthernLightsTours';
import RentingEquipment from './components/RentingEquipment';
import DaytimeExperiences from './components/DaytimeExperiences';
import FamilyFriendlyNorthernLights from './components/FamilyFriendlyNorthernLights';
import Blog from './components/Blog';
import BestTimeNorthernLights from './components/blog/BestTimeNorthernLights';
import WhatToPackLapland from './components/blog/WhatToPackLapland';
import NorthernLightsPhotography from './components/blog/NorthernLightsPhotography';
import LaplandWildlife from './components/blog/LaplandWildlife';
import TraditionalIceFishing from './components/blog/TraditionalIceFishing';
import SnowshoeAdventure from './components/blog/SnowshoeAdventure';
import LaplandWinterActivities from './components/blog/LaplandWinterActivities';
import WhatToWearLapland from './components/blog/WhatToWearLapland';
import BestTimeVisitLapland from './components/blog/BestTimeVisitLapland';
import LaplandHotelsGuide from './components/blog/LaplandHotelsGuide';
import GlassIglooGuide from './components/blog/GlassIglooGuide';
import LaplandCabinsGuide from './components/blog/LaplandCabinsGuide';
import TransportationRovaniemiLevi from './components/TransportationRovaniemiLevi';
import TransportationCustomized from './components/TransportationCustomized';
import TransportationCategory from './components/TransportationCategory';
import PaymentSuccess from './components/PaymentSuccess';
import CryptoPaymentSuccess from './components/CryptoPaymentSuccess';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppWidget from './components/WhatsAppWidget';
import SnowmobileSafari from './components/SnowmobileSafari';
import BestSellersSlideshow from './components/BestSellersSlideshow';
import MonsterTruckNorthernLights from './components/MonsterTruckNorthernLights';
import RoutePageMeta from './components/RoutePageMeta';
import RouteJsonLd from './components/seo/RouteJsonLd';
import TravelTrade from './components/TravelTrade';
import PromotionAnnouncementBar from './components/PromotionAnnouncementBar';
import WinterPromoPopup from './components/WinterPromoPopup';

function App() {
  return (
    <Router>
      <div className="App">
        <ScrollToTop />
        <RoutePageMeta />
        <RouteJsonLd />
        <PromotionAnnouncementBar />
        <Header />
        <WinterPromoPopup />
        
        <Routes>
          {/* Homepage */}
          <Route path="/" element={
            <>
              <Hero />
              <BestSellersSlideshow />
              <div id="tours">
                <Tours />
              </div>
              <Transportations />
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
          
          {/* Tour Category Pages */}
            <Route path="/northern-lights-tours" element={<NorthernLightsTours />} />
            <Route path="/renting-equipment" element={<RentingEquipment />} />
            <Route path="/daytime-experiences" element={<DaytimeExperiences />} />
            <Route path="/family-friendly-northern-lights" element={<FamilyFriendlyNorthernLights />} />
          
          {/* Tour Detail Pages */}
          <Route path="/northern-lights-tour" element={<NorthernLightsTour />} />
          <Route path="/snowshoe-rental" element={<SnowshoeRental />} />
          <Route path="/ice-fishing" element={<IceFishingTour />} />
          <Route path="/ranua-zoo" element={<RanuaZooTour />} />
          <Route path="/korouoma-canyon" element={<KorouomaTour />} />
          <Route path="/customized-tour" element={<CustomizedTour />} />
          <Route path="/travel-trade" element={<TravelTrade />} />
          <Route path="/snowmobile-safari" element={<SnowmobileSafari />} />
          <Route
            path="/monster-truck-northern-lights"
            element={
              SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS
                ? <MonsterTruckNorthernLights />
                : <Navigate to="/northern-lights-tours" replace />
            }
          />
          
          {/* Blog Routes */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/best-time-northern-lights-lapland-2025" element={<BestTimeNorthernLights />} />
          <Route path="/blog/what-to-pack-lapland-winter-adventure" element={<WhatToPackLapland />} />
          <Route path="/blog/northern-lights-photography-tips-beginners" element={<NorthernLightsPhotography />} />
          <Route path="/blog/lapland-wildlife-animals-ranua-zoo" element={<LaplandWildlife />} />
          <Route path="/blog/traditional-ice-fishing-finnish-lapland" element={<TraditionalIceFishing />} />
          <Route path="/blog/snowshoe-adventure-exploring-lapland-wilderness" element={<SnowshoeAdventure />} />
          <Route path="/blog/lapland-winter-activities-complete-guide" element={<LaplandWinterActivities />} />
          <Route path="/blog/what-to-wear-lapland-winter-clothing-guide" element={<WhatToWearLapland />} />
          <Route path="/blog/best-time-visit-lapland-seasonal-guide" element={<BestTimeVisitLapland />} />
          <Route path="/blog/where-to-stay-lapland-accommodation-guide" element={<LaplandHotelsGuide />} />
          <Route path="/blog/glass-igloos-lapland-complete-guide" element={<GlassIglooGuide />} />
          <Route path="/blog/finnish-cabins-lapland-authentic-guide" element={<LaplandCabinsGuide />} />
          
          {/* Transportation Routes */}
          <Route path="/transportation" element={<TransportationCategory />} />
          <Route path="/transportation-rovaniemi-levi" element={<TransportationRovaniemiLevi />} />
          <Route path="/transportation-customized" element={<TransportationCustomized />} />
          
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