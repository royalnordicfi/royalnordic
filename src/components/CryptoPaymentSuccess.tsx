import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Mail, Calendar, Users, Phone } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'

const CryptoPaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    // Get booking data from sessionStorage
    const stored = sessionStorage.getItem('cryptoBooking')
    if (stored) {
      const data = JSON.parse(stored)
      setBookingData(data)
      
      // Clear the stored data
      sessionStorage.removeItem('cryptoBooking')
    }
  }, [])

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden pt-20 pb-8 px-4">
        {/* Northern Lights Background Effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-green-400/30 to-transparent animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/4 w-1/3 h-1/6 bg-gradient-to-l from-green-300/25 to-blue-300/25 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-white mb-2">No Booking Data Found</h1>
            <p className="text-gray-300 mb-6">Please return to the tours page and try again.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Tours
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden pt-20 pb-8 px-4">
      {/* Northern Lights Background Effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-green-400/30 to-transparent animate-pulse"></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/6 bg-gradient-to-l from-green-300/25 to-blue-300/25 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl">
          {/* Success Icon */}
          <div className="text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Crypto Booking Submitted!</h1>
            <p className="text-gray-300 text-sm">Your booking request has been received</p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600/50">
            <h3 className="font-semibold text-white mb-3 text-sm">Booking Details</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center">
                <span className="text-gray-300 font-medium">Tour: {bookingData.tour_name || 'Tour'}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-3 h-3 mr-2 text-green-400" />
                <span className="text-gray-300">Date: {formatTourDateForDisplay(bookingData.tour_date_iso || bookingData.tour_date)}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-3 h-3 mr-2 text-green-400" />
                <span className="text-gray-300">Participants: {bookingData.adults} adults, {bookingData.children} children</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-300">Total: €{bookingData.total_price}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-300">Payment: {bookingData.crypto_type?.toUpperCase() || 'Cryptocurrency'}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <Mail className="w-4 h-4 mr-2 text-emerald-400" />
              <h3 className="font-semibold text-white text-sm">Payment Instructions</h3>
            </div>
            <div className="text-emerald-400 text-xs">
              <p className="mb-2">You will receive payment instructions via:</p>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="text-emerald-500 mr-2">📧</span>
                  <span>Email: {bookingData.customer_email}</span>
                </div>
                {bookingData.customer_phone && (
                  <div className="flex items-center">
                    <Phone className="w-3 h-3 mr-2 text-emerald-500" />
                    <span>Phone: {bookingData.customer_phone}</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-emerald-300">
                We'll send you the wallet address and payment details within 24 hours.
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600/50">
            <h3 className="font-semibold text-white mb-2 text-sm">What's Next?</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Check your email for payment instructions</li>
              <li>• Complete crypto payment within 48 hours</li>
              <li>• Receive confirmation once payment is verified</li>
              <li>• Meeting details sent before tour</li>
              <li>• Contact us with any questions</li>
            </ul>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="w-full border border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-black transition-all duration-300 font-semibold py-3 px-4 rounded-lg text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default CryptoPaymentSuccess
