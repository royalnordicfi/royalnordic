import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Stripe cancel_url landing — recover abandoned checkouts.
 */
const PaymentCancelled: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-28 pb-12 px-4">
      <div className="max-w-lg mx-auto text-center text-white space-y-6">
        <h1 className="text-3xl sm:text-4xl font-luxury font-bold">Checkout cancelled</h1>
        <p className="text-gray-300 font-clean leading-relaxed">
          No payment was taken. Your date may still be available — resume booking when you are ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/northern-lights-tour"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-lg"
          >
            Resume Northern Lights tour
          </Link>
          <Link
            to="/#tours"
            className="border border-gray-600 hover:border-emerald-500 text-white font-semibold px-6 py-3 rounded-lg inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            All tours
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          Questions? WhatsApp or email contact@royalnordic.fi
        </p>
      </div>
    </div>
  )
}

export default PaymentCancelled
