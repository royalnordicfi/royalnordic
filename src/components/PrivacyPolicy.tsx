import React from 'react';

import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">


      <div className="max-w-4xl mx-auto px-4 py-24">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <h1 className="text-3xl font-luxury font-bold text-white mb-8">Privacy Policy</h1>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
              <p className="text-sm leading-relaxed">
                We collect information you provide directly to us, such as when you make a booking, contact us, or sign up for our services. This may include:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1 ml-4">
                <li>Name, email address, and phone number</li>
                <li>Booking details and preferences</li>
                <li>Payment information (processed securely through Stripe)</li>
                <li>Special requests or requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <p className="text-sm leading-relaxed">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1 ml-4">
                <li>Process and confirm your bookings</li>
                <li>Send booking confirmations and important updates</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Improve our services and website experience</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">3. Information Sharing</h2>
              <p className="text-sm leading-relaxed">
                We do not sell, trade, or otherwise transfer your personal information to third parties except:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1 ml-4">
                <li>Payment processors (Stripe) for secure payment processing</li>
                <li>Email service providers (Resend) for sending confirmations</li>
                <li>When required by law or to protect our rights</li>
                <li>With your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
              <p className="text-sm leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1 ml-4">
                <li>SSL encryption for all data transmission</li>
                <li>Secure payment processing through Stripe</li>
                <li>Regular security assessments and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
              <p className="text-sm leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and comply with legal obligations. Booking information is typically retained for 7 years for accounting and legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
              <p className="text-sm leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1 ml-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Lodge a complaint with supervisory authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">7. Cookies and Tracking</h2>
              <p className="text-sm leading-relaxed">
                Our website uses essential cookies for functionality and may use analytics cookies to improve user experience. You can control cookie settings through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
              <p className="text-sm leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-2 text-sm space-y-1">
                <p>📧 Email: contact@royalnordic.fi</p>
                <p>📞 Phone: +358 45 78345138</p>
                <p>📍 Address: Rovaniemi, Lapland, Finland</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-3">9. Updates to This Policy</h2>
              <p className="text-sm leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the effective date.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                <strong>Last updated:</strong> {new Date().toLocaleDateString()}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
