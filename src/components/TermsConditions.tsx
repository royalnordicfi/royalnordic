import React from 'react';

import { useNavigate } from 'react-router-dom';

const TermsConditions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">


      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h1 className="text-3xl font-luxury font-bold text-white mb-8">Terms & Conditions</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
              <p className="text-sm leading-relaxed">
                By accessing and using the Royal Nordic website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. Booking and Reservations</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Booking Confirmation:</strong> All bookings are subject to availability and confirmation. A booking is only confirmed once payment has been received and processed.</p>
                <p><strong>Payment:</strong> Full payment is required at the time of booking. We accept payments through our secure payment processor, Stripe.</p>
                <p><strong>Pricing:</strong> All prices are quoted in Euros (€) and include VAT. Prices are subject to change without notice.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Cancellation Policy</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Free Cancellation:</strong> Cancellations made more than 24 hours before the tour start time are eligible for a full refund.</p>
                <p><strong>Late Cancellation:</strong> Cancellations made within 24 hours of the tour start time are non-refundable.</p>
                <p><strong>Weather Conditions:</strong> Tours may be cancelled due to extreme weather conditions. In such cases, we will offer a full refund or reschedule your tour.</p>
                <p><strong>Northern Lights Guarantee:</strong> If no Northern Lights are visible during your tour, we offer a free return trip on the next available date.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Tour Requirements and Safety</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Age Requirements:</strong> Children under 15 must be accompanied by an adult. Some tours may have minimum age requirements.</p>
                <p><strong>Health and Fitness:</strong> Participants should be in good health and able to participate in outdoor activities. Please inform us of any medical conditions or special requirements.</p>
                <p><strong>Equipment:</strong> We provide all necessary safety equipment. Participants must follow safety instructions provided by our guides.</p>
                <p><strong>Weather Preparation:</strong> Participants are responsible for dressing appropriately for Arctic weather conditions.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Liability and Insurance</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Limitation of Liability:</strong> Royal Nordic is not liable for any personal injury, property damage, or other losses that occur during tours, except where caused by our negligence.</p>
                <p><strong>Travel Insurance:</strong> We recommend that all participants have appropriate travel insurance covering outdoor activities and medical expenses.</p>
                <p><strong>Force Majeure:</strong> We are not liable for any failure to perform due to circumstances beyond our control, including natural disasters, government actions, or other unforeseeable events.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Photography and Media</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Tour Photography:</strong> Our guides may take photos during tours for promotional purposes. By participating, you consent to the use of these images.</p>
                <p><strong>Personal Photography:</strong> Participants are welcome to take personal photos, but must respect the privacy of other participants.</p>
                <p><strong>Commercial Use:</strong> Any commercial use of photos taken during our tours requires written permission from Royal Nordic.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Website and Online Services</h2>
              <div className="space-y-3 text-sm">
                <p><strong>Accuracy:</strong> While we strive to provide accurate information, we cannot guarantee that all content on our website is error-free or up-to-date.</p>
                <p><strong>Availability:</strong> Our website and booking system may be temporarily unavailable for maintenance or technical reasons.</p>
                <p><strong>Security:</strong> We implement security measures to protect your personal information, but cannot guarantee complete security of online transactions.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
              <p className="text-sm leading-relaxed">
                All content on our website, including text, images, logos, and design elements, is the property of Royal Nordic and is protected by copyright laws. Reproduction or distribution of this content without permission is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Governing Law</h2>
              <p className="text-sm leading-relaxed">
                These Terms and Conditions are governed by Finnish law. Any disputes arising from these terms or our services will be resolved in the courts of Finland.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">10. Changes to Terms</h2>
              <p className="text-sm leading-relaxed">
                We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">11. Contact Information</h2>
              <p className="text-sm leading-relaxed">
                For questions about these Terms and Conditions, please contact us:
              </p>
              <div className="mt-2 text-sm space-y-1">
                <p>📧 Email: contact@royalnordic.fi</p>
                <p>📞 Phone: +358 45 78345138</p>
                <p>📍 Address: Rovaniemi, Lapland, Finland</p>
              </div>
            </section>

            <section>
              <p className="text-sm text-gray-400 mt-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
