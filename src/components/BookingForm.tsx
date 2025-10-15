import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
// import { Calendar, Users, Mail, Phone, MessageSquare, CreditCard } from 'lucide-react'
import { createCheckoutSession, redirectToCheckout } from '../lib/stripe'
import { createCryptoCheckout, redirectToCryptoCheckout } from '../lib/crypto'
import { supabase } from '../lib/supabase'
import type { TourDate } from '../lib/supabase'

interface BookingFormProps {
  tourId: number
  tourName: string
  adultPrice: number
  childPrice: number
  seasonStart?: string
  seasonEnd?: string
}

const BookingForm: React.FC<BookingFormProps> = ({
  tourId,
  tourName, 
  adultPrice, 
  childPrice, 
  seasonStart,
  seasonEnd
}) => {
  const navigate = useNavigate()
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
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showCryptoModal, setShowCryptoModal] = useState(false)
  const [cryptoFormData, setCryptoFormData] = useState({
    fullName: '',
    cryptoType: 'bitcoin',
    specialRequests: ''
  })

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showCryptoModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCryptoModal])
  


  // Load availability data
  const loadAvailability = async () => {
    try {
      setError('')
      // Use the new Supabase function instead of the old API
      // Add aggressive cache-busting to ensure fresh data
      const cacheBuster = Date.now() + Math.random()
      const { data, error } = await supabase.functions.invoke(`get-tour-availability?t=${cacheBuster}`, {
        body: { 
          tourId,
          _cacheBust: cacheBuster, // Force fresh data
          _timestamp: new Date().toISOString() // Additional cache busting
        }
      })
      
      console.log('Raw API response:', data)
      
      if (error) {
        throw new Error(error.message)
      }
      
      // Transform the response to match the expected format
      const transformedData = data.availableDates.map((date: any, index: number) => {
        // Debug: Log any malformed dates
        if (!date || !date.date || !date.id) {
          console.log('Malformed date at index', index, ':', date)
        }
        
        return {
          id: date.id,
          tour_id: tourId,
          date: date.date,
          available_slots: date.totalSlots,
          total_booked: date.bookedSlots,
          remaining_slots: date.availableSpots
        }
      }).filter(date => date.id && date.date) // Filter out malformed dates
      
      console.log('Availability data loaded:', transformedData.length, 'dates')
      console.log('First few dates:', transformedData.slice(0, 5))
      console.log('Sample date object:', transformedData[0])
      console.log('Sample date details:', {
        id: transformedData[0]?.id,
        date: transformedData[0]?.date,
        remaining_slots: transformedData[0]?.remaining_slots,
        available_slots: transformedData[0]?.available_slots
      })
      
      // Debug: Check if September 15th is in the data
      const sept15 = transformedData.find((d: any) => d.date === '2025-09-15')
      console.log('September 15th in data:', sept15)
      
      // Debug: Check if September 1st is in the data (should NOT be)
      const sept1 = transformedData.find((d: any) => d.date === '2025-09-01')
      console.log('September 1st in data:', sept1)
      
      // Debug: Check if October 1st is in the data (should be)
      const oct1 = transformedData.find((d: any) => d.date === '2025-10-01')
      console.log('October 1st in data:', oct1)
      
      // Debug: Check for any empty or malformed dates
      const malformedDates = transformedData.filter(d => !d.id || !d.date)
      if (malformedDates.length > 0) {
        console.log('Malformed dates found:', malformedDates)
      }
      
      setAvailability(transformedData)
    } catch (err) {
      setError('Failed to load availability')
      console.error('Availability error:', err)
      // Fallback to empty array to prevent white page
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }

  // Load availability data on component mount
  useEffect(() => {
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




  // Get calendar grid for current month
  const getCalendarGrid = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(Date.UTC(year, month, 1))
    const lastDay = new Date(Date.UTC(year, month + 1, 0))
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)
    
    
    // Get available dates for this month
    const monthDates = availability.filter(date => {
      const dateObj = new Date(date.date)
      return dateObj >= startDate && dateObj <= endDate
    })
    
    // Apply season filtering if seasonStart and seasonEnd are provided
    let filteredDates = monthDates
    if (seasonStart && seasonEnd) {
      const currentYear = new Date().getFullYear()
      // Create proper date objects for the season
      const seasonStartDate = new Date(`${currentYear}-${seasonStart}`)
      const seasonEndDate = new Date(`${currentYear + 1}-${seasonEnd}`)
      
      // Debug logging
      console.log('Season filtering:', {
        seasonStart,
        seasonEnd,
        seasonStartDate: seasonStartDate.toISOString(),
        seasonEndDate: seasonEndDate.toISOString(),
        monthDates: monthDates.length
      })
      
      filteredDates = monthDates.filter(date => {
        const dateObj = new Date(date.date)
        const isInSeason = dateObj >= seasonStartDate && dateObj <= seasonEndDate
        console.log('Date check:', date.date, dateObj.toISOString(), isInSeason)
        return isInSeason
      })
      
      console.log('Filtered dates:', filteredDates.length)
    }
    
    // Create a map for faster lookup
    const dateMap = new Map()
    filteredDates.forEach(date => {
      dateMap.set(date.date, date)
    })
    

    // Create calendar grid
    const grid = []
    const firstDayOfWeek = firstDay.getUTCDay()
    const daysInMonth = lastDay.getUTCDate()
    
    // Use simple date comparison to avoid timezone issues
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // Get YYYY-MM-DD format
    

    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null)
    }

    // Add ALL days of the month (professional approach)
    for (let day = 1; day <= daysInMonth; day++) {
      // Use UTC to avoid timezone offset issues
      const dateString = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0]
      const dateData = dateMap.get(dateString)
      
      
      // Check if date is in the past (before today)
      const isPastDate = dateString < todayString
      
      // Determine date status:
      // - isPastDate: Past dates (gray, disabled)
      // - isFullBooked: Dates with 0 remaining slots (red, shows authenticity)
      // - isAvailable: Dates that can be booked (white, clickable)
      // CRITICAL: Only use database data for availability - no season filtering
      const isAvailable = !isPastDate && dateData && (dateData.remaining_slots || 0) > 0
      
      
      // Determine date status:
      // - isPastDate: Past dates (gray, disabled)
      // - !inSeason: Out of season (gray, disabled) 
      // - isFullBooked: Dates with 0 remaining slots (red, shows authenticity)
      // - isAvailable: Dates that can be booked (white, clickable)
      const isFullBooked = dateData && dateData.remaining_slots !== undefined && dateData.remaining_slots === 0
      
      grid.push({
        day,
        date: dateString,
        available: isAvailable,
        remainingSlots: dateData?.remaining_slots ?? 0,
        isPastDate,
        isOutOfSeason: false, // No season filtering - database controls all
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
    return dateData?.remaining_slots || 0
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
          total_price: totalPrice.toString(),
          phone: formData.phone,
          special_requests: formData.specialRequests
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
        tour_date: tourDate,
        tour_name: tourName,
        phone: formData.phone,
        special_requests: formData.specialRequests
      }
      
      sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData))

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId)

    } catch (err) {
      console.error('Booking error:', err)
      // Clean up Stripe error messages
      let errorMessage = 'Booking failed'
      if (err instanceof Error) {
        if (err.message.includes('email_invalid')) {
          errorMessage = 'Invalid email address'
        } else if (err.message.includes('card_declined')) {
          errorMessage = 'Payment was declined'
        } else if (err.message.includes('insufficient_funds')) {
          errorMessage = 'Insufficient funds'
        } else if (err.message.includes('expired_card')) {
          errorMessage = 'Card has expired'
        } else if (err.message.includes('incorrect_cvc')) {
          errorMessage = 'Incorrect CVC code'
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCryptoPayment = () => {
    // Validate form data first
    if (!formData.preferredDate) {
      setError('Please select a date')
      return
    }
    if (!formData.fullName || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    // Pre-fill crypto form with booking data
    setCryptoFormData({
      fullName: formData.fullName,
      cryptoType: 'bitcoin',
      specialRequests: formData.specialRequests
    })
    
    // Show crypto modal (NO booking created yet)
    setShowCryptoModal(true)
    setError('')
  }

  const handleCryptoSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Find the tour date ID for the selected date
      const selectedDateData = availability.find(d => d.date === formData.preferredDate)
      if (!selectedDateData) {
        throw new Error('Selected date not found')
      }
      
      const tourDateId = selectedDateData.id || Date.now()
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

      // Create crypto booking request
      const cryptoBookingData = {
        tour_id: tourId,
        tour_date_id: tourDateId,
        customer_name: cryptoFormData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        adults: formData.adults,
        children: formData.children,
        total_price: totalPrice,
        tour_name: tourName,
        tour_date: tourDate,
        crypto_type: cryptoFormData.cryptoType,
        special_requests: cryptoFormData.specialRequests,
        payment_type: 'crypto'
      }

      // Call the crypto booking API
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-crypto-booking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cryptoBookingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create crypto booking')
      }

      const result = await response.json()
      
      if (result.success) {
        // Store booking data in sessionStorage for success page
        const bookingData = {
          customer_name: cryptoFormData.fullName,
          customer_email: formData.email,
          customer_phone: formData.phone,
          adults: formData.adults.toString(),
          children: formData.children.toString(),
          total_price: totalPrice.toString(),
          tour_date: tourDate,
          tour_name: tourName,
          crypto_type: cryptoFormData.cryptoType,
          special_requests: cryptoFormData.specialRequests
        }
        
        sessionStorage.setItem('cryptoBooking', JSON.stringify(bookingData))
        
        // Close modal and redirect to crypto success page
        setShowCryptoModal(false)
        navigate('/crypto-payment-success')
      } else {
        throw new Error(result.error || 'Crypto booking failed')
      }
    } catch (error) {
      console.error('Crypto booking error:', error)
      setError('Crypto booking failed. Please try card payment instead.')
    } finally {
      setLoading(false)
    }
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
            {availability.length > 0 ? getCalendarGrid().map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-12"></div>
              }
              
              const { day: calendarDay, date, available, remainingSlots, isPastDate, isOutOfSeason, isFullBooked } = day
              const isAvailable = available && remainingSlots >= (formData.adults + formData.children)
              
              
              return (
                <button
                  key={date} 
                  type="button"
                  onClick={() => isAvailable && setFormData({...formData, preferredDate: date})}
                  className={`h-12 rounded text-sm font-medium transition-colors ${
                    formData.preferredDate === date
                      ? 'bg-blue-600 text-white'
                      : isPastDate
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isOutOfSeason
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isFullBooked
                      ? 'bg-red-100 text-red-600 border border-red-200 cursor-not-allowed'
                      : isAvailable
                      ? 'bg-white border border-gray-300 hover:bg-blue-50 text-gray-900 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isAvailable}
                >
                  <div className="text-xs">{calendarDay}</div>
                  <div className="text-xs text-emerald-600 font-semibold">€{adultPrice}</div>
                  {isAvailable && (
                    <div className="text-xs text-gray-500">{remainingSlots} slots</div>
                  )}
                  {isFullBooked && (
                    <div className="text-xs text-red-600 font-semibold">FULL</div>
                  )}
                  {isOutOfSeason && (
                    <div className="text-xs text-gray-500">Closed</div>
                  )}
                </button>
              )
            }) : (
              // Show loading state when availability data is not loaded
              Array.from({ length: 35 }, (_, index) => (
                <div key={`loading-${index}`} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))
            )}
          </div>

          <p className="text-xs text-gray-500 mt-2">Showing prices in EUR (Euro)</p>
        </div>

      {/* Participants Section */}
        <div>
          <h4 className="text-lg font-bold text-gray-900 mb-3 border-b border-gray-300 pb-2">Participants</h4>
          {!formData.preferredDate && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <strong>Please select a date first</strong> to choose the number of participants
            </div>
          )}
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
                    if (tourName.includes('Family-Friendly Northern Lights')) {
                      return `${dateString} at 21:00`
                    } else if (tourName.includes('Northern Lights')) {
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

      </form>

      {/* Crypto Payment Modal - Rendered as Portal */}
      <CryptoPaymentModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        onSubmit={handleCryptoSubmit}
        loading={loading}
        tourName={tourName}
        formData={formData}
        cryptoFormData={cryptoFormData}
        setCryptoFormData={setCryptoFormData}
        calculateTotal={calculateTotal}
      />
    </div>
  );
}

// Crypto Payment Modal Component - Rendered as Portal
const CryptoPaymentModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSubmit: () => void
  loading: boolean
  tourName: string
  formData: any
  cryptoFormData: any
  setCryptoFormData: (data: any) => void
  calculateTotal: () => number
}> = ({ isOpen, onClose, onSubmit, loading, tourName, formData, cryptoFormData, setCryptoFormData, calculateTotal }) => {
  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto"
        style={{
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">Pay with Cryptocurrency</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          <div className="space-y-4">
            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Tour:</strong> {tourName}</p>
                <p><strong>Date:</strong> {formData.preferredDate ? (() => {
                  const [year, month, day] = formData.preferredDate.split('-').map(Number)
                  const date = new Date(year, month - 1, day)
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                })() : 'Not selected'}</p>
                <p><strong>Participants:</strong> {formData.adults} adults, {formData.children} children</p>
                <p><strong>Total:</strong> €{calculateTotal()}</p>
              </div>
            </div>

            {/* Crypto Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={cryptoFormData.fullName}
                  onChange={(e) => setCryptoFormData({...cryptoFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Cryptocurrency</label>
                <select
                  value={cryptoFormData.cryptoType}
                  onChange={(e) => setCryptoFormData({...cryptoFormData, cryptoType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="bitcoin">Bitcoin (BTC)</option>
                  <option value="ethereum">Ethereum (ETH)</option>
                  <option value="usdc">USD Coin (USDC)</option>
                  <option value="usdt">Tether (USDT)</option>
                  <option value="other">Other (specify in requests)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requests</label>
                <textarea
                  value={cryptoFormData.specialRequests}
                  onChange={(e) => setCryptoFormData({...cryptoFormData, specialRequests: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Any additional requests or notes..."
                />
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-emerald-500 mr-3 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-emerald-700">
                  <p className="font-medium mb-1">Payment Process:</p>
                  <p>After confirming your booking, you will receive an email from Royal Nordic with the wallet address and payment instructions for your chosen cryptocurrency.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Fixed */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || !cryptoFormData.fullName}
              className="flex-1 bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                'Confirm Crypto Booking'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default BookingForm
