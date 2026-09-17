import React from 'react'
import CategoryHero from './CategoryHero'
import Footer from './Footer'

const TermsConditions: React.FC = () => {
  return (
    <div className="rn-page flex flex-col">
      <CategoryHero
        title="Terms & Conditions"
        subtitle="Booking rules, cancellations, safety, and liability for Royal Nordic tours and services."
        image="/nortti5.jpg"
        compact
      />

      <div className="rn-section-tight rn-hero-follow relative flex-1 bg-midnight">
        <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-70" aria-hidden />
        <div className="rn-container relative max-w-3xl">
          <div className="rn-prose-panel p-6 sm:p-8">
            <div className="prose prose-invert max-w-none space-y-8 text-sm leading-relaxed text-text-muted [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_strong]:text-white">
              <section>
                <h2>1. Acceptance of terms</h2>
                <p>
                  By using the Royal Nordic website and booking our services, you agree to these Terms
                  and Conditions. If you do not agree, please do not use our services.
                </p>
              </section>

              <section>
                <h2>2. Booking and reservations</h2>
                <p>
                  <strong>Confirmation:</strong> Bookings are subject to availability. A booking is
                  confirmed once payment has been received and processed.
                </p>
                <p className="mt-2">
                  <strong>Payment:</strong> Full payment is required at the time of booking via our
                  secure payment processor, Stripe.
                </p>
                <p className="mt-2">
                  <strong>Pricing:</strong> Prices are in euros (€) and include VAT unless stated
                  otherwise. Prices may change without notice.
                </p>
              </section>

              <section>
                <h2>3. Cancellation policy</h2>
                <p>
                  <strong>Free cancellation:</strong> Cancel more than 24 hours before the tour start
                  for a full refund.
                </p>
                <p className="mt-2">
                  <strong>Late cancellation:</strong> Cancellations within 24 hours of start time are
                  non-refundable.
                </p>
                <p className="mt-2">
                  <strong>Weather:</strong> We may cancel tours in unsafe conditions and offer a refund
                  or reschedule.
                </p>
                <p className="mt-2">
                  <strong>Northern Lights guarantee:</strong> On the eligible guaranteed tour, if no
                  Northern Lights are visible, we offer a free return trip on the next available date
                  (see tour page and these terms).
                </p>
              </section>

              <section>
                <h2>4. Tour requirements and safety</h2>
                <p>
                  Child pricing applies for ages 0–17. Minors must be accompanied by an adult. Tell us
                  about medical conditions or mobility needs before the tour. Follow guide instructions
                  and dress for Arctic weather.
                </p>
              </section>

              <section>
                <h2>5. Liability and insurance</h2>
                <p>
                  Royal Nordic is not liable for injury or loss during tours except where caused by our
                  negligence. We recommend travel insurance that covers outdoor activities.
                </p>
              </section>

              <section>
                <h2>6. Photography and media</h2>
                <p>
                  Guides may take photos for promotional use; by joining a tour you consent to reasonable
                  use of those images. Personal photos are welcome; respect other guests’ privacy.
                </p>
              </section>

              <section>
                <h2>7. Website and online services</h2>
                <p>
                  We aim to keep information accurate but cannot guarantee every detail is current.
                  Maintenance or technical issues may temporarily affect the site or booking system.
                </p>
              </section>

              <section>
                <h2>8. Intellectual property</h2>
                <p>
                  Website content, logos, and images belong to Royal Nordic and may not be copied or
                  distributed without permission.
                </p>
              </section>

              <section>
                <h2>9. Governing law</h2>
                <p>
                  These terms are governed by Finnish law. Disputes are handled in the courts of Finland.
                </p>
              </section>

              <section>
                <h2>10. Changes to terms</h2>
                <p>
                  We may update these terms at any time. Continued use of our services after changes
                  constitutes acceptance.
                </p>
              </section>

              <section>
                <h2>11. Contact</h2>
                <p>Questions about these terms:</p>
                <ul className="mt-2 list-none space-y-1 pl-0">
                  <li>Email: contact@royalnordic.fi</li>
                  <li>Phone: +358 45 78345138</li>
                  <li>Address: Rovaniemi, Lapland, Finland</li>
                </ul>
                <p className="mt-4 text-text-dim">
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

export default TermsConditions
