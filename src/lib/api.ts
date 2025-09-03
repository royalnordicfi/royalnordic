import { supabase } from './supabase'
import { sendBookingNotification } from './email'
import type { Tour, TourDate, Booking } from './supabase'

// Tour availability API
export async function getTourAvailability(tourId: number, startDate?: string, endDate?: string) {
  let query = supabase
    .from('tour_dates')
    .select(`
      id,
      tour_id,
      date,
      available_slots,
      total_booked
    `)
    .eq('tour_id', tourId)
    .order('date')

  if (startDate && endDate) {
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Calculate remaining slots in JavaScript
  return data?.map(date => ({
    ...date,
    remaining_slots: date.available_slots - date.total_booked
  })) || []
}

// Update tour availability API
export async function updateTourAvailability(tourId: number, date: string, availableSlots: number) {
  // Check if date already exists
  const { data: existingDate, error: checkError } = await supabase
    .from('tour_dates')
    .select('id')
    .eq('tour_id', tourId)
    .eq('date', date)
    .single()

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(checkError.message)
  }

  if (existingDate) {
    // Update existing date
    const { error: updateError } = await supabase
      .from('tour_dates')
      .update({ 
        available_slots: availableSlots,
        total_booked: 0 // Reset booked slots when updating availability
      })
      .eq('id', existingDate.id)

    if (updateError) {
      throw new Error(updateError.message)
    }
  } else {
    // Create new date
    const { error: insertError } = await supabase
      .from('tour_dates')
      .insert([{
        tour_id: tourId,
        date: date,
        available_slots: availableSlots,
        total_booked: 0
      }])

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  return { success: true }
}

// Get all tours API
export async function getAllTours() {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .order('id')

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Update tour pricing API
export async function updateTourPricing(tourId: number, adultPrice: number, childPrice: number, maxCapacity: number) {
  const { error } = await supabase
    .from('tours')
    .update({ 
      adult_price: adultPrice,
      child_price: childPrice,
      max_capacity: maxCapacity
    })
    .eq('id', tourId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

// Get tour statistics API
export async function getTourStatistics(tourId: number) {
  const { data: dates, error: datesError } = await supabase
    .from('tour_dates')
    .select('available_slots, total_booked')
    .eq('tour_id', tourId)

  if (datesError) {
    throw new Error(datesError.message)
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('total_price, status')
    .eq('tour_id', tourId)

  if (bookingsError) {
    throw new Error(bookingsError.message)
  }

  const totalDates = dates?.length || 0
  const totalAvailableSlots = dates?.reduce((sum, date) => sum + date.available_slots, 0) || 0
  const totalBookedSlots = dates?.reduce((sum, date) => sum + date.total_booked, 0) || 0
  const totalRevenue = bookings?.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.total_price, 0) || 0
  const totalBookings = bookings?.length || 0

  return {
    totalDates,
    totalAvailableSlots,
    totalBookedSlots,
    totalRevenue,
    totalBookings,
    occupancyRate: totalAvailableSlots > 0 ? (totalBookedSlots / totalAvailableSlots) * 100 : 0
  }
}

// Create booking API
export async function createBooking(bookingData: {
  tour_id: number
  tour_date_id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  adults: number
  children: number
  total_price: number
  stripe_payment_intent_id: string
  special_requests?: string
}) {
  // First check availability
  const { data: dateData, error: dateError } = await supabase
    .from('tour_dates')
    .select('available_slots, total_booked')
    .eq('id', bookingData.tour_date_id)
    .single()

  if (dateError) {
    throw new Error('Date not found')
  }

  const remainingSlots = dateData.available_slots - dateData.total_booked
  const requestedSlots = bookingData.adults + bookingData.children

  if (requestedSlots > remainingSlots) {
    throw new Error(`Only ${remainingSlots} slots available`)
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single()

  if (bookingError) {
    throw new Error(bookingError.message)
  }

  // Update available slots
  const { error: updateError } = await supabase
    .from('tour_dates')
    .update({ total_booked: dateData.total_booked + requestedSlots })
    .eq('id', bookingData.tour_date_id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Get tour and date information for email notification
  const { data: tourData } = await supabase
    .from('tours')
    .select('name')
    .eq('id', bookingData.tour_id)
    .single()

  const { data: dateDataForEmail } = await supabase
    .from('tour_dates')
    .select('date')
    .eq('id', bookingData.tour_date_id)
    .single()

  // Send email notification to Royal Nordic staff
  if (tourData && dateDataForEmail) {
    try {
      await sendBookingNotification({
        bookingId: booking.id,
        customerName: bookingData.customer_name,
        customerEmail: bookingData.customer_email,
        customerPhone: bookingData.customer_phone || '',
        tourName: tourData.name,
        tourDate: dateDataForEmail.date,
        adults: bookingData.adults,
        children: bookingData.children,
        totalPrice: bookingData.total_price,
        specialRequests: bookingData.special_requests,
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to send email notification:', error)
      // Don't fail the booking if email fails
    }
  }

  return booking
}

// Admin API functions
export async function adminLogin(email: string, password: string, secureKey: string) {
  // Note: In Supabase, you might want to use built-in auth instead
  // This is a simplified version for compatibility
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    throw new Error('Invalid credentials')
  }

  // In production, you'd verify password and secure key hashes here
  // For now, we'll assume they're correct
  return {
    token: 'admin-token', // You'd generate a real JWT here
    user: { id: data.id, email: data.email }
  }
}

export async function getAdminBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      adults,
      children,
      total_price,
      status,
      created_at,
      special_requests,
      tours!inner(name),
      tour_dates!inner(date)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateBookingStatus(bookingId: number, status: 'pending' | 'confirmed' | 'cancelled') {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Get all tours
export async function getTours() {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .order('created_at')

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Get tour by ID
export async function getTour(tourId: number) {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', tourId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}
