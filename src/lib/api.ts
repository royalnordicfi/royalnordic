import { supabase } from './supabase'
import { sendBookingNotification, sendCustomerConfirmation } from './email'
import type { Tour, TourDate, Booking } from './supabase'

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    throw new Error('Admin authentication required')
  }
  return data.session
}

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

// Update tour availability API (admin session + RLS)
export async function updateTourAvailability(tourId: number, date: string, availableSlots: number) {
  await requireAdminSession()

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

// Create booking — prefers SECURITY DEFINER RPC after RLS migration
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
  let bookingId: number | null = null

  const { data: rpcRows, error: rpcError } = await supabase.rpc('create_public_booking', {
    p_tour_id: bookingData.tour_id,
    p_tour_date_id: bookingData.tour_date_id,
    p_customer_name: bookingData.customer_name,
    p_customer_email: bookingData.customer_email,
    p_customer_phone: bookingData.customer_phone || null,
    p_adults: bookingData.adults,
    p_children: bookingData.children,
    p_total_price: bookingData.total_price,
    p_stripe_payment_intent_id: bookingData.stripe_payment_intent_id,
    p_special_requests: bookingData.special_requests || null,
  })

  if (!rpcError) {
    bookingId = Array.isArray(rpcRows)
      ? rpcRows[0]?.id ?? null
      : (rpcRows as { id?: number } | null)?.id ?? null
  } else {
    // Fallback until migration 015 is applied (insert without RETURNING)
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

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert([{ ...bookingData, status: 'confirmed' }])
      .select('id')
      .single()

    if (insertError) {
      throw new Error(rpcError.message || insertError.message)
    }

    bookingId = booking.id

    // Legacy path only: trigger may also update slots; keep for pre-RLS compat
    await supabase
      .from('tour_dates')
      .update({ total_booked: dateData.total_booked + requestedSlots })
      .eq('id', bookingData.tour_date_id)
  }

  const booking = { id: bookingId ?? 0 }

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

  if (tourData && dateDataForEmail) {
    const emailData = {
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
      paymentStatus: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    }

    try {
      await sendBookingNotification(emailData)
    } catch (error) {
      console.error('Failed to send admin email notification:', error)
    }

    try {
      await sendCustomerConfirmation(emailData)
    } catch (error) {
      console.error('Failed to send customer confirmation:', error)
    }
  }

  return booking
}

export async function getAdminBookings() {
  await requireAdminSession()

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
    console.error('Error fetching admin bookings:', error)
    throw new Error(error.message || 'Failed to load bookings')
  }

  return (data || []).map((booking: any) => ({
    ...booking,
    tours: booking.tours || { name: 'Unknown Tour' },
    tour_dates: booking.tour_dates || { date: new Date().toISOString() },
  }))
}

export async function updateBookingStatus(bookingId: number, status: 'pending' | 'confirmed' | 'cancelled') {
  await requireAdminSession()

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

export async function deleteBooking(bookingId: number) {
  await requireAdminSession()

  const { error } = await supabase.from('bookings').delete().eq('id', bookingId)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function sendManualConfirmationEmail(booking: {
  id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  adults: number
  children: number
  total_price: number
  special_requests?: string
  created_at: string
  tours: { name: string }
  tour_dates: { date: string }
}) {
  await requireAdminSession()

  const emailData = {
    bookingId: booking.id,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone || '',
    tourName: booking.tours.name,
    tourDate: booking.tour_dates.date,
    adults: booking.adults,
    children: booking.children,
    totalPrice: booking.total_price,
    specialRequests: booking.special_requests,
    paymentStatus: 'confirmed' as const,
    createdAt: booking.created_at,
  }

  try {
    await sendCustomerConfirmation(emailData)
    return { success: true, message: 'Confirmation email sent successfully' }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send confirmation email')
  }
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
