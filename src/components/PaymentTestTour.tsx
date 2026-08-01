import BookingForm from './BookingForm'
import Footer from './Footer'

const TEST_TOUR_ID = 9

/**
 * Internal €1 live payment smoke-test page.
 * Not linked from marketing navigation.
 */
const PaymentTestTour = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Internal payment test only — €1. Not a real customer product. Completing checkout charges the
          new Stripe account and should create a booking + confirmation emails (customer + Royal Nordic).
        </div>

        <h1 className="text-3xl sm:text-4xl font-luxury font-bold mb-2">Payment Test €1</h1>
        <p className="text-gray-300 mb-8">
          Same calendar booking flow as live tours. Adult and child price are both €1 (VAT incl.).
        </p>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-center mb-4">Book test payment</h2>
          <BookingForm
            tourId={TEST_TOUR_ID}
            tourName="Payment Test €1"
            adultPrice={1}
            childPrice={1}
            maxCapacity={8}
          />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PaymentTestTour
