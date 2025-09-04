import React, { useState, useEffect } from 'react'
// import { Calendar, Users, Mail, Phone, MessageSquare, CreditCard } from 'lucide-react'
import { getTourAvailability } from '../lib/api'
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe'
import { createCryptoCheckout, redirectToCryptoCheckout } from '../lib/crypto'
import type { TourDate } from '../lib/supabase'

interface BookingFormProps {
  tourId: number
  tourName: string
  adultPrice: number
  childPrice: number
  maxCapacity: number
  seasonStart?: string
  seasonEnd?: string
}

const BookingForm: React.FC<BookingFormProps> = ({ 
  tourId,
  tourName, 
  adultPrice, 
  childPrice, 
  maxCapacity,
  seasonStart,
  seasonEnd
}) => {
  const [formData, setFormData] = useState({
    preferredDate: '',
    adults: 1,
    children: 0,
    fullName: '',
    email: '',
    phone: '',
    specialRequests: ''
  })

  const [availability, setAvailability] = useState<TourDate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())


  // Load availability data
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        setError('')
        const data = await getTourAvailability(tourId)
        setAvailability(data)
      } catch (err) {
        setError('Failed to load availability')
        console.error('Availability error:', err)
      }
    }

    loadAvailability()
  }, [tourId])

  // Update calendar every minute to stay current with Finnish time
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update past dates
      setCurrentMonth(prev => new Date(prev.getTime()))
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Get dates for current month
  // const getCurrentMonthDates = () => {
  //   const year = currentMonth.getFullYear()
  //   const month = currentMonth.getMonth()
  //   const firstDay = new Date(year, month, 1)
  //   const lastDay = new Date(year, month + 1, 0)
  //   const startDate = new Date(firstDay)
  //   const endDate = new Date(lastDay)
  //   
  //   return availability.filter(date => {
  //     const dateObj = new Date(date.date)
  //     return dateObj >= startDate && dateObj <= endDate
  //   })
  // }

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Get month name and year
  const getMonthYearString = () => {
    return currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Helper to check if a date is within the booking season
  const isDateInSeason = (date: Date) => {
    if (!seasonStart || !seasonEnd) return true
    
    const currentYear = date.getFullYear()
    const [startMonth, startDay] = seasonStart.split('-').map(Number)
    const [endMonth, endDay] = seasonEnd.split('-').map(Number)
    
    const seasonStartDate = new Date(currentYear, startMonth - 1, startDay)
    const seasonEndDate = new Date(currentYear, endMonth - 1, endDay)
    
    // Handle season spanning across year (e.g., Nov 1 - Apr 1)
    if (endMonth < startMonth) {
      if (date.getMonth() >= startMonth - 1 || date.getMonth() <= endMonth - 1) {
        return true
      }
    } else {
      return date >= seasonStartDate && date <= seasonEndDate
    }
    
    return false
  }


  // Get calendar grid for current month
  const getCalendarGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)
    
    // Get available dates for this month
    const monthDates = availability.filter(date => {
      const dateObj = new Date(date.date)
      return dateObj >= startDate && dateObj <= endDate
    })

    // Create calendar grid
    const grid = []
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    // Get today's date in Finnish timezone (UTC+2/UTC+3)
    const now = new Date()
    const finnishTime = new Date(now.getTime() + (2 * 60 * 60 * 1000)) // UTC+2 (winter time)
    // Check if it's summer time (March to October)
    const isSummerTime = finnishTime.getMonth() >= 2 && finnishTime.getMonth() <= 9
    if (isSummerTime) {
      finnishTime.setTime(finnishTime.getTime() + (60 * 60 * 1000)) // Add 1 more hour for summer time (UTC+3)
    }
    
    const today = new Date(finnishTime.getFullYear(), finnishTime.getMonth(), finnishTime.getDate())
    today.setHours(0, 0, 0, 0)

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = new Date(year, month, day).toISOString().split('T')[0]
      const dateObj = new Date(year, month, day)
      const dateData = monthDates.find(d => d.date === dateString)
      
      // Check if date is in the past (before today in Finnish time)
      const isPastDate = dateObj < today
      
      // Check if date is within booking season
      const isInSeason = isDateInSeason(dateObj)
      
      // Date is available if:
      // 1. It's not in the past
      // 2. It's within the booking season
      // 3. Either it has availability data with slots > 0, OR no availability data exists (default to available)
      const isAvailable = !isPastDate && isInSeason && (dateData ? (dateData.availableSpots || 0) > 0 : true)
      
      // Determine date status:
      // - isPastDate: Past dates (gray)
      // - isOutOfSeason: Dates outside booking season (gray)
      // - isFullBooked: Dates with 0 remaining slots (red)
      // - isAvailable: Dates that can be booked (white)
      const isOutOfSeason = !isInSeason
      const isFullBooked = dateData && dateData.availableSpots !== undefined && dateData.availableSpots === 0
      
      grid.push({
        day,
        date: dateString,
        available: isAvailable,
        remainingSlots: dateData?.availableSpots ?? maxCapacity,
        isPastDate,
        isOutOfSeason,
        isFullBooked
      })
    }

    return grid
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = parseInt(e.target.value) || 0
  //   setFormData({
  //     ...formData,
  //     [e.target.name]: value
  //   })
  // }

  const calculateTotal = () => {
    return (formData.adults * adultPrice) + (formData.children * childPrice)
  }

  const getAvailableSlots = (date: string) => {
    const dateData = availability.find(d => d.date === date)
    return dateData?.availableSpots || 0
  }

  // const isDateAvailable = (date: string) => {
  //   const availableSlots = getAvailableSlots(date)
  //   const requestedSlots = formData.adults + formData.children
  //   return availableSlots >= requestedSlots
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form data
      if (!formData.preferredDate) {
        throw new Error('Please select a date')
      }
      if (!formData.fullName || !formData.email) {
        throw new Error('Please fill in all required fields')
      }

      // Find the tour date ID for the selected date
      const selectedDateData = availability.find(d => d.date === formData.preferredDate)
      if (!selectedDateData) {
        throw new Error('Selected date not found')
      }
      
      // Use a fallback ID if not provided (for mock data)
      const tourDateId = selectedDateData.id || Date.now()

      // Check availability one more time before proceeding
      const availableSlots = getAvailableSlots(formData.preferredDate)
      const requestedSlots = formData.adults + formData.children
      if (requestedSlots > availableSlots) {
        throw new Error(`Only ${availableSlots} slots available for this date`)
      }

      const totalPrice = calculateTotal()
      const tourDate = (() => {
        const [year, month, day] = formData.preferredDate.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      })()

      // Create Stripe Checkout Session
      const checkoutData = {
        amount: totalPrice,
        currency: 'eur',
        tour_name: tourName,
        tour_date: tourDate,
        metadata: {
          tour_id: tourId.toString(),
          tour_date_id: tourDateId.toString(),
          customer_name: formData.fullName,
          customer_email: formData.email,
          adults: formData.adults.toString(),
          children: formData.children.toString(),
          total_price: totalPrice.toString()
        }
      }

      const { sessionId } = await createCheckoutSession(checkoutData)

      // Store booking data in sessionStorage for email confirmation after payment
      const bookingData = {
        customer_name: formData.fullName,
        customer_email: formData.email,
        adults: formData.adults.toString(),
        children: formData.children.toString(),
        total_price: totalPrice.toString(),
        tour_date: tourDate
      }
      
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoPayment = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Create crypto checkout
      const cryptoData = {
        amount: calculateTotal(),
        currency: 'eur',
        tour_name: tourName,
        tour_date: formData.preferredDate,
        metadata: {
          tour_id: tourId.toString(),
          tour_date_id: tourDateId.toString(), // Use the actual tour date ID
          customer_name: formData.fullName,
          customer_email: formData.email,
          adults: formData.adults.toString(),
          children: formData.children.toString(),
          total_price: calculateTotal().toString(),
          phone: formData.phone,
          special_requests: formData.specialRequests
        }
      }
      
      const result = await createCryptoCheckout(cryptoData)
      
      if (result.success && result.hosted_url) {
        redirectToCryptoCheckout(result.hosted_url)
      } else {
        throw new Error(result.error || 'Crypto checkout failed')
      }
    } catch (error) {
      console.error('Crypto payment error:', error)
      setError('Crypto payment failed. Please try card payment instead.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-green-600 text-2xl mb-4">✓</div>
        <h3 className="text-green-800 text-xl font-semibold mb-2">Booking Successful!</h3>
        <p className="text-green-700 mb-4">
          Thank you for your booking! You'll be redirected to Stripe to complete your payment.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Make Another Booking
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg mx-auto lg:mx-0">
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">Select your preferred date and group size</p>
      </div>
      
      <form className="space-y-6">
        {/* Date Selection */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Choose a date</h4>
          
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={goToPreviousMonth}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
            >
              ‹
            </button>
            
            <div className="text-center">
              <span className="text-lg font-semibold text-gray-900">
                {getMonthYearString()}
              </span>
            </div>
            
            <button 
              type="button"
              onClick={goToNextMonth}
              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600"
            >
              ›
            </button>
          </div>
          
          {/* Simple Date Picker */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>
          
          {/* Available Dates Grid */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarGrid().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-12"></div>
              }
              
              const { day: calendarDay, date, available, remainingSlots, isPastDate, isFullBooked } = day
              const isAvailable = available && remainingSlots >= (formData.adults + formData.children)
              
              return (
                <button
                  key={date} 
                  type="button"
                  onClick={() => setFormData({...formData, preferredDate: date})}
                  className={`h-12 rounded text-sm font-medium transition-colors ${
                    formData.preferredDate === date
                      ? 'bg-blue-600 text-white'
                      : isPastDate
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isFullBooked
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : isAvailable
                      ? 'bg-white border border-gray-300 hover:bg-blue-50 text-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isAvailable}
                >
                  <div className="text-xs">{calendarDay}</div>
                  <div className="text-xs text-emerald-600 font-semibold">€{adultPrice}</div>
                  {isAvailable && (
                    <div className="text-xs text-gray-500">{remainingSlots} slots</div>
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-gray-500 mt-2">Showing prices in EUR (Euro)</p>
        </div>

      {/* Participants Section */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Participants</h4>
        <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adult</label>
              <p className="text-xs text-gray-500 mb-2">Age 15 - 90</p>
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                  onClick={() => setFormData({...formData, adults: Math.max(1, formData.adults - 1)})}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
              >
                -
              </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">{formData.adults}</span>
              <button 
                type="button"
                  onClick={() => setFormData({...formData, adults: Math.min(getAvailableSlots(formData.preferredDate), formData.adults + 1)})}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                  disabled={!formData.preferredDate || formData.adults + formData.children >= getAvailableSlots(formData.preferredDate)}
              >
                +
              </button>
                <span className="text-sm text-gray-500 ml-auto">€{adultPrice} (VAT incl.)</span>
              </div>
          </div>
          
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
              <p className="text-xs text-gray-500 mb-2">Age 0 - 14</p>
            <div className="flex items-center space-x-3">
              <button 
                type="button"
                  onClick={() => setFormData({...formData, children: Math.max(0, formData.children - 1)})}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
              >
                -
              </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">{formData.children}</span>
              <button 
                type="button"
                  onClick={() => setFormData({...formData, children: Math.min(getAvailableSlots(formData.preferredDate) - formData.adults, formData.children + 1)})}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold"
                  disabled={!formData.preferredDate || formData.adults + formData.children >= getAvailableSlots(formData.preferredDate)}
              >
                +
              </button>
                <span className="text-sm text-gray-500 ml-auto">€{childPrice} (VAT incl.)</span>
              </div>
            </div>
            
            {/* Available Slots Info */}
            {formData.preferredDate && (
              <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                Available slots for {new Date(formData.preferredDate).toLocaleDateString()}: {getAvailableSlots(formData.preferredDate)} people
              </div>
            )}
            
            {/* Capacity Warning */}
            {formData.preferredDate && formData.adults + formData.children >= getAvailableSlots(formData.preferredDate) && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                Maximum capacity reached for this date ({getAvailableSlots(formData.preferredDate)} people)
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Contact Information</h4>
          <div className="space-y-3">
          <input 
            type="text" 
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
              placeholder="Full Name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
              placeholder="Email Address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <input 
            type="tel" 
            name="phone"
            value={formData.phone}
            onChange={handleChange}
              placeholder="Phone Number (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Special Requests</h4>
          <textarea
            name="specialRequests"
            value={formData.specialRequests}
            onChange={handleChange}
            rows={3}
            placeholder="Any special requirements or requests..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        {/* Total Price */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-2 mb-3">
            {/* Selected Date */}
            {formData.preferredDate && (
              <div className="flex justify-between text-sm mb-3 pb-2 border-b border-gray-200">
                <span className="text-gray-600">Selected Date:</span>
                <span className="text-gray-800 font-medium">
                  {(() => {
                    const [year, month, day] = formData.preferredDate.split('-').map(Number)
                    const date = new Date(year, month - 1, day)
                    const dateString = date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                    // Add start time for Northern Lights tours
                    if (tourName.includes('Northern Lights')) {
                      return `${dateString} at 20:00`
                    }
                    return dateString
                  })()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Adults ({formData.adults} × €{adultPrice})</span>
              <span className="text-gray-800 font-medium">€{formData.adults * adultPrice}</span>
            </div>
            {formData.children > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Children ({formData.children} × €{childPrice})</span>
                <span className="text-gray-800 font-medium">€{formData.children * childPrice}</span>
              </div>
            )}
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-blue-600">€{calculateTotal()}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Includes VAT</p>
            </div>
          </div>
        </div>

        {/* Payment Options */}
        <div className="space-y-3">
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Choose Payment Method</h4>
          
          {/* Pay by Card/Bank Button */}
          <button 
            type="submit"
            disabled={loading || !formData.preferredDate}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            onClick={(e) => {
              e.preventDefault()
              handleSubmit(e)
            }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-6 h-6 mr-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                </svg>
                Pay by Card / Bank
              </>
            )}
          </button>

          {/* Pay by Crypto Button */}
          <button 
            type="button"
            disabled={loading || !formData.preferredDate}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                            onClick={handleCryptoPayment}
          >
            <svg className="w-6 h-6 mr-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 112-2 2 2 0 01-2 2z"/>
            </svg>
            Pay by Crypto
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="text-green-500 mr-2">✅</div>
              <p className="text-green-700 text-sm font-medium">Booking submitted successfully! Redirecting to payment...</p>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export default BookingForm
