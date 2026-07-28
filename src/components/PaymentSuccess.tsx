import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Mail, Calendar, Users } from 'lucide-react'
import { formatTourDateForDisplay } from '../lib/tourDate'

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate()
  const [emailSent, setEmailSent] = useState(false)
  const [bookingData, setBookingData] = useState<any>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('pendingBooking')
    if (stored) {
      const data = JSON.parse(stored)
      setBookingData(data)
      // Keep a copy so refresh still shows confirmation details
      sessionStorage.setItem('confirmedBooking', stored)
      sessionStorage.removeItem('pendingBooking')
      setEmailSent(true)
      return
    }

    const confirmed = sessionStorage.getItem('confirmedBooking')
    if (confirmed) {
      setBookingData(JSON.parse(confirmed))
      setEmailSent(true)
    }
  }, [])


  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden pt-20 pb-8 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-green-400/30 to-transparent animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/4 bg-gradient-to-r from-emerald-400/20 to-teal-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 max-w-lg mx-auto">
          <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Looking for your confirmation?</h1>
            <p className="text-gray-300 mb-6">
              If you just paid, check your email for the booking confirmation. You can also browse our tours anytime.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors min-h-[44px]"
            >
              Back to Home
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
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/4 bg-gradient-to-r from-emerald-400/20 to-teal-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-1/3 h-1/6 bg-gradient-to-l from-green-300/25 to-blue-300/25 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Main Content */}
      <div className="relative z-10 max-w-lg mx-auto">
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-600/50 shadow-2xl">
          {/* Success Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-300 text-sm">Your {bookingData.tour_name || 'Tour'} is confirmed!</p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600/50">
            <h2 className="text-base font-semibold text-white mb-3">Booking Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                <Users className="w-4 h-4 mr-2 text-green-400" />
                <span>{bookingData.adults} adults, {bookingData.children} children</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-green-400" />
                <span>{formatTourDateForDisplay(bookingData.tour_date_iso || bookingData.tour_date)}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <span className="font-semibold text-white">Total: €{bookingData.total_price}</span>
              </div>
            </div>
          </div>

          {/* Email Status */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600/50">
            <div className="flex items-center mb-2">
              <Mail className="w-4 h-4 mr-2 text-green-400" />
              <h3 className="font-semibold text-white text-sm">Confirmation Email</h3>
            </div>
            <div className="text-green-400 text-xs flex items-center">
              <span className="text-green-500 mr-2">✓</span>
              Confirmation email will be sent to {bookingData.customer_email}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-700/50 rounded-lg p-4 mb-4 border border-gray-600/50">
            <h3 className="font-semibold text-white mb-2 text-sm">What's Next?</h3>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Check your email for instructions</li>
              <li>• Meeting details sent before tour</li>
              <li>• Contact us with questions</li>
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

export default PaymentSuccess
