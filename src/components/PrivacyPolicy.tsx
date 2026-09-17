import React from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="rn-page flex flex-col">
      <CategoryHero
        title="Privacy Policy"
        subtitle="How Royal Nordic collects, uses, and protects your personal information when you book or contact us."
        image="/nortti5.jpg"
        compact
      />

      <div className="rn-section-tight rn-hero-follow relative flex-1 bg-midnight">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-70" aria-hidden />
        <div className="rn-container relative max-w-3xl">
          <div className="rn-prose-panel p-6 sm:p-8">
            <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-text-muted [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_strong]:text-white">
              <section>
                <h2>1. Information we collect</h2>
                <p>
                  We collect information you provide when you book, pay, or contact us. This may
                  include:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Name, email address, and phone number</li>
                  <li>Booking details and preferences</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Special requests or requirements</li>
                </ul>
              </section>

              <section>
                <h2>2. How we use your information</h2>
                <p>We use the information we collect to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Process and confirm your bookings</li>
                  <li>Send booking confirmations and important updates</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Improve our services and website experience</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2>3. Information sharing</h2>
                <p>
                  We do not sell your personal information. We share data only when needed to run our
                  service:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Payment processors (Stripe) for secure payment processing</li>
                  <li>Email service providers (Resend) for sending confirmations</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With your explicit consent</li>
                </ul>
              </section>

              <section>
                <h2>4. Data security</h2>
                <p>
                  We use appropriate measures to protect your information, including SSL encryption,
                  secure payment processing, and limited internal access to personal data.
                </p>
              </section>

              <section>
                <h2>5. Data retention</h2>
                <p>
                  We retain booking and contact data as long as needed to provide our services and meet
                  legal requirements. Booking records are typically kept for up to 7 years for accounting
                  and tax purposes.
                </p>
              </section>

              <section>
                <h2>6. Your rights</h2>
                <p>Under applicable law, you may have the right to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your data</li>
                  <li>Withdraw consent for processing</li>
                  <li>Lodge a complaint with supervisory authorities</li>
                </ul>
              </section>

              <section>
                <h2>7. Cookies and tracking</h2>
                <p>
                  Our site uses essential cookies for functionality and may use analytics to improve the
                  experience. You can control cookies in your browser settings.
                </p>
              </section>

              <section>
                <h2>8. Contact us</h2>
                <p>Questions about this policy or your data:</p>
                <ul className="mt-2 list-none space-y-1 pl-0">
                  <li>Email: contact@royalnordic.fi</li>
                  <li>Phone: +358 45 78345138</li>
                  <li>Address: Rovaniemi, Lapland, Finland</li>
                </ul>
              </section>

              <section>
                <h2>9. Updates</h2>
                <p>
                  We may update this Privacy Policy from time to time. Material changes will be posted
                  on this page with an updated effective date.
                </p>
                <p className="mt-2 text-text-dim">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default PrivacyPolicy
