import { supabase } from '../lib/supabase'
import { todayTourDateISO } from '../lib/tourDate'
import { sendCustomerConfirmationStrict } from '../lib/email'
import { validateTourPrices } from '../lib/tourPricing'
import type {
  AssignmentConflict,
  BookingEmail,
  BookingEvent,
  BookingSource,
  BookingStatus,
  CapacityConflict,
  Customer,
  EmailStatus,
  Guide,
  OpsBooking,
  OpsNote,
  OpsNotePriority,
  OpsNoteStatus,
  PaymentStatus,
  Product,
  Vehicle,
} from './types'

async function requireAdmin() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('Admin authentication required')
  return data.session
}

async function actorEmail() {
  const session = await requireAdmin()
  return session.user.email || 'admin'
}

async function logEvent(
  bookingId: number,
  eventType: string,
  fromValue?: string | null,
  toValue?: string | null,
  note?: string | null,
) {
  const created_by = await actorEmail()
  await supabase.from('booking_events').insert([
    {
      booking_id: bookingId,
      event_type: eventType,
      from_value: fromValue ?? null,
      to_value: toValue ?? null,
      note: note ?? null,
      created_by,
    },
  ])
}

const bookingSelectFull = `
  id, booking_ref, customer_name, customer_email, customer_phone,
  adults, children, total_price, status, payment_status, payment_type, crypto_type,
  source, pickup_location, tour_time, special_requests, internal_notes,
  stripe_payment_intent_id, guide_id, vehicle_id, tour_id, tour_date_id,
  created_at, updated_at, deleted_at, email_status, email_last_sent_at, email_last_error,
  tours ( id, name, public_name, max_capacity ),
  tour_dates ( id, date ),
  guides ( id, name, phone ),
  vehicles ( id, name, passenger_capacity, registration_number )
`

const bookingSelectLegacy = `
  id, customer_name, customer_email, customer_phone,
  adults, children, total_price, status, payment_type, crypto_type,
  special_requests, stripe_payment_intent_id, tour_id, tour_date_id, created_at,
  tours ( id, name, max_capacity ),
  tour_dates ( id, date )
`

function normalizeBooking(row: Record<string, unknown>): OpsBooking {
  const b = row as unknown as OpsBooking
  return {
    ...b,
    booking_ref: b.booking_ref ?? (b.id ? `RN-${b.id}` : null),
    source: b.source || 'direct_website',
    payment_status:
      b.payment_status ||
      (b.status === 'confirmed'
        ? 'paid'
        : b.status === 'pending_crypto_payment'
          ? 'pending_crypto'
          : 'unpaid'),
    pickup_location: b.pickup_location ?? null,
    tour_time: b.tour_time ?? null,
    internal_notes: b.internal_notes ?? null,
    guide_id: b.guide_id ?? null,
    vehicle_id: b.vehicle_id ?? null,
    guides: b.guides ?? null,
    vehicles: b.vehicles ?? null,
    deleted_at: b.deleted_at ?? null,
    email_status: b.email_status || 'not_sent',
    email_last_sent_at: b.email_last_sent_at ?? null,
    email_last_error: b.email_last_error ?? null,
  }
}

function isMissingColumnError(message: string) {
  return (
    message.includes('column') ||
    message.includes('does not exist') ||
    message.includes('booking_ref') ||
    message.includes('payment_status') ||
    message.includes('deleted_at') ||
    message.includes('email_status') ||
    message.includes('Could not find')
  )
}

export async function fetchOpsBookings(filters?: {
  status?: string
  source?: string
  search?: string
  fromDate?: string
  toDate?: string
  includeDeleted?: boolean
  attention?: 'payment' | 'guide' | 'vehicle' | 'email' | 'pending'
}): Promise<OpsBooking[]> {
  await requireAdmin()
  let query = supabase
    .from('bookings')
    .select(bookingSelectFull)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (!filters?.includeDeleted) {
    query = query.is('deleted_at', null)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.source && filters.source !== 'all') {
    query = query.eq('source', filters.source)
  }

  let { data, error } = await query
  if (error && isMissingColumnError(error.message)) {
    // Retry without soft-delete / email columns
    let fallback = supabase
      .from('bookings')
      .select(
        `
        id, booking_ref, customer_name, customer_email, customer_phone,
        adults, children, total_price, status, payment_status, payment_type, crypto_type,
        source, pickup_location, tour_time, special_requests, internal_notes,
        stripe_payment_intent_id, guide_id, vehicle_id, tour_id, tour_date_id,
        created_at, updated_at,
        tours ( id, name, public_name, max_capacity ),
        tour_dates ( id, date ),
        guides ( id, name, phone ),
        vehicles ( id, name, passenger_capacity, registration_number )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(2000)
    if (filters?.status && filters.status !== 'all') fallback = fallback.eq('status', filters.status)
    if (filters?.source && filters.source !== 'all') fallback = fallback.eq('source', filters.source)
    const mid = await fallback
    if (mid.error && isMissingColumnError(mid.error.message)) {
      const legacy = await supabase
        .from('bookings')
        .select(bookingSelectLegacy)
        .order('created_at', { ascending: false })
        .limit(2000)
      data = legacy.data
      error = legacy.error
    } else {
      data = mid.data
      error = mid.error
    }
  }
  if (error) throw new Error(error.message)

  let rows = ((data || []) as unknown as Record<string, unknown>[]).map(normalizeBooking)

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase()
    rows = rows.filter((b) => {
      const hay = [
        b.booking_ref,
        b.customer_name,
        b.customer_email,
        b.customer_phone,
        b.tours?.name,
        b.tours?.public_name,
        b.pickup_location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }

  if (filters?.fromDate) {
    rows = rows.filter((b) => (b.tour_dates?.date || '') >= filters.fromDate!)
  }
  if (filters?.toDate) {
    rows = rows.filter((b) => (b.tour_dates?.date || '') <= filters.toDate!)
  }

  const today = todayTourDateISO()
  if (filters?.attention === 'payment') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        (b.payment_status === 'unpaid' ||
          b.payment_status === 'pending_crypto' ||
          b.status === 'pending_crypto_payment'),
    )
  } else if (filters?.attention === 'guide') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        (b.tour_dates?.date || '') >= today &&
        !b.guide_id,
    )
  } else if (filters?.attention === 'vehicle') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        (b.tour_dates?.date || '') >= today &&
        !b.vehicle_id,
    )
  } else if (filters?.attention === 'email') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        (b.email_status === 'failed' || b.email_status === 'not_sent'),
    )
  } else if (filters?.attention === 'pending') {
    rows = rows.filter(
      (b) => b.status === 'pending' || b.status === 'pending_crypto_payment',
    )
  }

  return rows
}

export async function fetchBooking(id: number): Promise<OpsBooking> {
  await requireAdmin()
  let { data, error } = await supabase
    .from('bookings')
    .select(bookingSelectFull)
    .eq('id', id)
    .single()
  if (error && isMissingColumnError(error.message)) {
    const mid = await supabase
      .from('bookings')
      .select(
        `
        id, booking_ref, customer_name, customer_email, customer_phone,
        adults, children, total_price, status, payment_status, payment_type, crypto_type,
        source, pickup_location, tour_time, special_requests, internal_notes,
        stripe_payment_intent_id, guide_id, vehicle_id, tour_id, tour_date_id,
        created_at, updated_at,
        tours ( id, name, public_name, max_capacity ),
        tour_dates ( id, date ),
        guides ( id, name, phone ),
        vehicles ( id, name, passenger_capacity, registration_number )
      `,
      )
      .eq('id', id)
      .single()
    if (mid.error && isMissingColumnError(mid.error.message)) {
      const legacy = await supabase
        .from('bookings')
        .select(bookingSelectLegacy)
        .eq('id', id)
        .single()
      data = legacy.data
      error = legacy.error
    } else {
      data = mid.data
      error = mid.error
    }
  }
  if (error) throw new Error(error.message)
  return normalizeBooking(data as unknown as Record<string, unknown>)
}

export async function fetchBookingEvents(bookingId: number): Promise<BookingEvent[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('booking_events')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
  if (error) {
    if (error.message.includes('booking_events') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as BookingEvent[]
}

export async function fetchBookingEmails(bookingId: number): Promise<BookingEmail[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('booking_emails')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
  if (error) {
    if (error.message.includes('booking_emails') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as BookingEmail[]
}

async function assertNoAssignmentConflict(
  kind: 'guide' | 'vehicle',
  resourceId: number,
  tourDateId: number,
  excludeBookingId: number,
) {
  const col = kind === 'guide' ? 'guide_id' : 'vehicle_id'
  let q = supabase
    .from('bookings')
    .select('id, booking_ref, status, deleted_at')
    .eq(col, resourceId)
    .eq('tour_date_id', tourDateId)
    .neq('id', excludeBookingId)
    .neq('status', 'cancelled')
  const { data, error } = await q
  if (error) throw new Error(error.message)
  const conflicts = (data || []).filter((b: { deleted_at?: string | null }) => !b.deleted_at)
  if (conflicts.length) {
    const refs = conflicts.map((b: { booking_ref?: string; id: number }) => b.booking_ref || `#${b.id}`).join(', ')
    throw new Error(
      `${kind === 'guide' ? 'Guide' : 'Vehicle'} already assigned on this date to ${refs}`,
    )
  }
}

export async function updateBookingOps(
  id: number,
  patch: Partial<{
    status: BookingStatus
    payment_status: PaymentStatus
    pickup_location: string | null
    tour_time: string | null
    internal_notes: string | null
    special_requests: string | null
    guide_id: number | null
    vehicle_id: number | null
    source: BookingSource
    customer_name: string
    customer_email: string
    customer_phone: string | null
    adults: number
    children: number
    total_price: number
  }>,
): Promise<OpsBooking> {
  await requireAdmin()
  const current = await fetchBooking(id)
  if (current.deleted_at) throw new Error('Booking is deleted — restore it before editing')

  if (patch.vehicle_id) {
    const passengers = (patch.adults ?? current.adults) + (patch.children ?? current.children)
    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .select('passenger_capacity, name, status')
      .eq('id', patch.vehicle_id)
      .single()
    if (vErr) throw new Error(vErr.message)
    if (vehicle?.status === 'maintenance') {
      throw new Error(`Vehicle "${vehicle.name}" is in maintenance`)
    }
    if (vehicle && passengers > vehicle.passenger_capacity) {
      throw new Error(
        `Vehicle "${vehicle.name}" capacity is ${vehicle.passenger_capacity}; booking has ${passengers} passengers`,
      )
    }
    await assertNoAssignmentConflict('vehicle', patch.vehicle_id, current.tour_date_id, id)
  }

  if (patch.guide_id) {
    await assertNoAssignmentConflict('guide', patch.guide_id, current.tour_date_id, id)
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(bookingSelectFull)
    .single()

  if (error) {
    if (isMissingColumnError(error.message)) {
      const mid = await supabase
        .from('bookings')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(
          `
          id, booking_ref, customer_name, customer_email, customer_phone,
          adults, children, total_price, status, payment_status, payment_type, crypto_type,
          source, pickup_location, tour_time, special_requests, internal_notes,
          stripe_payment_intent_id, guide_id, vehicle_id, tour_id, tour_date_id,
          created_at, updated_at,
          tours ( id, name, public_name, max_capacity ),
          tour_dates ( id, date ),
          guides ( id, name, phone ),
          vehicles ( id, name, passenger_capacity, registration_number )
        `,
        )
        .single()
      if (mid.error) throw new Error(mid.error.message)
      return finishUpdate(id, current, patch, mid.data as unknown as Record<string, unknown>)
    }
    throw new Error(error.message)
  }

  return finishUpdate(id, current, patch, data as unknown as Record<string, unknown>)
}

async function finishUpdate(
  id: number,
  current: OpsBooking,
  patch: Parameters<typeof updateBookingOps>[1],
  data: Record<string, unknown>,
) {
  try {
    if (patch.status && patch.status !== current.status) {
      await logEvent(id, 'status_change', current.status, patch.status)
    }
    if (patch.payment_status && patch.payment_status !== current.payment_status) {
      await logEvent(id, 'payment_status_change', current.payment_status, patch.payment_status)
    }
    if (patch.guide_id !== undefined && patch.guide_id !== current.guide_id) {
      await logEvent(id, 'guide_assigned', String(current.guide_id), String(patch.guide_id))
    }
    if (patch.vehicle_id !== undefined && patch.vehicle_id !== current.vehicle_id) {
      await logEvent(id, 'vehicle_assigned', String(current.vehicle_id), String(patch.vehicle_id))
    }
    if (patch.internal_notes !== undefined && patch.internal_notes !== current.internal_notes) {
      await logEvent(id, 'note_updated', null, null, 'Internal notes updated')
    }
    if (
      (patch.customer_name && patch.customer_name !== current.customer_name) ||
      (patch.customer_email && patch.customer_email !== current.customer_email) ||
      (patch.customer_phone !== undefined && patch.customer_phone !== current.customer_phone)
    ) {
      await logEvent(id, 'customer_updated', null, null, 'Customer details updated')
    }
  } catch {
    // timeline optional until migration 016
  }

  try {
    await upsertCustomerFromBooking({
      email: patch.customer_email ?? current.customer_email,
      name: patch.customer_name ?? current.customer_name,
      phone: patch.customer_phone ?? current.customer_phone,
    })
  } catch {
    // customers optional until migration 016
  }

  return normalizeBooking(data)
}

export async function softDeleteBooking(id: number): Promise<void> {
  await requireAdmin()
  const current = await fetchBooking(id)
  if (current.deleted_at) return

  // Cancel first so capacity trigger frees slots, then soft-delete
  if (current.status !== 'cancelled') {
    await updateBookingOps(id, { status: 'cancelled' })
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (isMissingColumnError(error.message)) {
      throw new Error(
        'Soft delete requires migration 018. Until then use Cancel, or apply 018_ops_hub_winter.sql.',
      )
    }
    throw new Error(error.message)
  }
  try {
    await logEvent(id, 'soft_deleted', null, 'deleted', 'Booking soft-deleted')
  } catch {
    /* optional */
  }
}

export async function restoreBooking(id: number): Promise<OpsBooking> {
  await requireAdmin()
  const { error } = await supabase
    .from('bookings')
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) {
    if (isMissingColumnError(error.message)) {
      throw new Error('Restore requires migration 018 (deleted_at column).')
    }
    throw new Error(error.message)
  }
  try {
    await logEvent(id, 'restored', 'deleted', null, 'Booking restored from soft-delete')
  } catch {
    /* optional */
  }
  return fetchBooking(id)
}

export async function hardDeleteBooking(id: number): Promise<void> {
  await requireAdmin()
  const current = await fetchBooking(id)
  // Cancel so slot trigger adjusts total_booked before row disappears
  if (current.status !== 'cancelled' && !current.deleted_at) {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
  }
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

async function ensureTourDate(tourId: number, date: string): Promise<{ id: number; available_slots: number; total_booked: number }> {
  const { data: existing } = await supabase
    .from('tour_dates')
    .select('id, available_slots, total_booked')
    .eq('tour_id', tourId)
    .eq('date', date)
    .maybeSingle()

  if (existing?.id) {
    return {
      id: existing.id,
      available_slots: existing.available_slots,
      total_booked: existing.total_booked,
    }
  }

  const { data: tour } = await supabase
    .from('tours')
    .select('max_capacity')
    .eq('id', tourId)
    .single()

  const { data: created, error } = await supabase
    .from('tour_dates')
    .insert([
      {
        tour_id: tourId,
        date,
        available_slots: tour?.max_capacity ?? 8,
        total_booked: 0,
      },
    ])
    .select('id, available_slots, total_booked')
    .single()

  if (error) throw new Error(error.message)
  return {
    id: created.id,
    available_slots: created.available_slots,
    total_booked: created.total_booked,
  }
}

export async function createManualBooking(input: {
  customer_name: string
  customer_email: string
  customer_phone?: string
  tour_id: number
  tour_date: string
  tour_time?: string
  adults: number
  children: number
  total_price: number
  payment_status: PaymentStatus
  pickup_location?: string
  source: BookingSource
  notes?: string
  guide_id?: number | null
  vehicle_id?: number | null
  send_confirmation?: boolean
}): Promise<OpsBooking> {
  await requireAdmin()
  const tourDate = await ensureTourDate(input.tour_id, input.tour_date)
  const pax = input.adults + input.children
  const remaining = tourDate.available_slots - tourDate.total_booked
  if (pax > remaining) {
    throw new Error(
      `Not enough capacity on ${input.tour_date}: ${remaining} seats left, booking needs ${pax}`,
    )
  }

  // Duplicate prevention: same email + tour + date (active)
  const { data: existingRows } = await supabase
    .from('bookings')
    .select('id, status, deleted_at')
    .eq('customer_email', input.customer_email.trim().toLowerCase())
    .eq('tour_id', input.tour_id)
    .eq('tour_date_id', tourDate.id)

  const dup = (existingRows || []).find(
    (b: { status: string; deleted_at?: string | null }) =>
      b.status !== 'cancelled' && !b.deleted_at,
  )
  if (dup) {
    throw new Error(
      `Duplicate booking: this customer already has an active booking for this tour on ${input.tour_date}`,
    )
  }

  if (input.guide_id) {
    await assertNoAssignmentConflict('guide', input.guide_id, tourDate.id, 0)
  }
  if (input.vehicle_id) {
    await assertNoAssignmentConflict('vehicle', input.vehicle_id, tourDate.id, 0)
  }

  const payload = {
    tour_id: input.tour_id,
    tour_date_id: tourDate.id,
    customer_name: input.customer_name.trim(),
    customer_email: input.customer_email.trim().toLowerCase(),
    customer_phone: input.customer_phone?.trim() || null,
    adults: input.adults,
    children: input.children,
    total_price: input.total_price,
    status: input.payment_status === 'paid' ? 'confirmed' : 'pending',
    payment_status: input.payment_status,
    payment_type: 'manual',
    source: input.source,
    pickup_location: input.pickup_location || null,
    tour_time: input.tour_time || null,
    special_requests: input.notes || null,
    internal_notes: input.notes || null,
    guide_id: input.guide_id ?? null,
    vehicle_id: input.vehicle_id ?? null,
    email_status: 'not_sent' as EmailStatus,
  }

  let { data, error } = await supabase.from('bookings').insert([payload]).select('id').single()

  if (error && isMissingColumnError(error.message)) {
    const { email_status: _e, guide_id, vehicle_id, ...rest } = payload
    const slim = { ...rest, guide_id, vehicle_id }
    const mid = await supabase.from('bookings').insert([slim]).select('id').single()
    if (mid.error && isMissingColumnError(mid.error.message)) {
      const legacy = await supabase
        .from('bookings')
        .insert([
          {
            tour_id: payload.tour_id,
            tour_date_id: payload.tour_date_id,
            customer_name: payload.customer_name,
            customer_email: payload.customer_email,
            customer_phone: payload.customer_phone,
            adults: payload.adults,
            children: payload.children,
            total_price: payload.total_price,
            status: payload.status,
            payment_type: 'manual',
            special_requests: payload.special_requests,
          },
        ])
        .select('id')
        .single()
      data = legacy.data
      error = legacy.error
    } else {
      data = mid.data
      error = mid.error
    }
  }

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Booking create returned no id')

  const bookingId = data.id as number

  await supabase.from('bookings').update({ booking_ref: `RN-${bookingId}` }).eq('id', bookingId)

  try {
    await logEvent(bookingId, 'created', null, 'manual', 'Manual booking created')
  } catch {
    /* optional */
  }
  try {
    await upsertCustomerFromBooking({
      email: input.customer_email,
      name: input.customer_name,
      phone: input.customer_phone || null,
    })
  } catch {
    /* optional */
  }

  let booking = await fetchBooking(bookingId)

  if (input.send_confirmation !== false) {
    try {
      await sendBookingConfirmationEmail(bookingId)
      booking = await fetchBooking(bookingId)
    } catch (e) {
      // Booking stays; email failure is recorded on the row when migration 018 applied
      console.error(e)
    }
  }

  return booking
}

export async function sendBookingConfirmationEmail(bookingId: number): Promise<{
  success: boolean
  message: string
}> {
  await requireAdmin()
  const booking = await fetchBooking(bookingId)
  if (booking.deleted_at) throw new Error('Cannot email a deleted booking')

  const created_by = await actorEmail()
  const emailPayload = {
    bookingId: booking.id,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone || '',
    tourName: booking.tours?.public_name || booking.tours?.name || 'Tour',
    tourDate: booking.tour_dates?.date || '',
    adults: booking.adults,
    children: booking.children,
    totalPrice: Number(booking.total_price),
    specialRequests: booking.special_requests || undefined,
    paymentStatus: (booking.status === 'confirmed' || booking.payment_status === 'paid'
      ? 'confirmed'
      : booking.status === 'cancelled'
        ? 'cancelled'
        : 'pending') as 'pending' | 'confirmed' | 'cancelled',
    createdAt: booking.created_at,
  }

  try {
    const result = await sendCustomerConfirmationStrict(emailPayload)
    const messageId = (result as { messageId?: string })?.messageId || null

    await supabase
      .from('bookings')
      .update({
        email_status: 'sent',
        email_last_sent_at: new Date().toISOString(),
        email_last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    await supabase.from('booking_emails').insert([
      {
        booking_id: bookingId,
        template_key: 'customer_confirmation',
        to_email: booking.customer_email,
        status: 'sent',
        provider_message_id: messageId,
        error_message: null,
        created_by,
      },
    ])

    try {
      await logEvent(bookingId, 'email_sent', null, 'sent', 'Customer confirmation email sent')
    } catch {
      /* optional */
    }

    return { success: true, message: 'Confirmation email sent' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Send failed'
    await supabase
      .from('bookings')
      .update({
        email_status: 'failed',
        email_last_error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)

    await supabase.from('booking_emails').insert([
      {
        booking_id: bookingId,
        template_key: 'customer_confirmation',
        to_email: booking.customer_email,
        status: 'failed',
        provider_message_id: null,
        error_message: msg,
        created_by,
      },
    ])

    try {
      await logEvent(bookingId, 'email_failed', null, 'failed', msg)
    } catch {
      /* optional */
    }

    throw new Error(msg)
  }
}

async function upsertCustomerFromBooking(c: {
  email: string
  name: string
  phone?: string | null
}) {
  const email = c.email.trim().toLowerCase()
  if (!email) return
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('customers')
      .update({
        name: c.name,
        phone: c.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('customers').insert([
      {
        email,
        name: c.name,
        phone: c.phone || null,
      },
    ])
  }
}

export async function fetchProducts(): Promise<Product[]> {
  await requireAdmin()
  const { data, error } = await supabase.from('tours').select('*').order('id')
  if (error) throw new Error(error.message)
  return (data || []) as Product[]
}

export async function updateProduct(id: number, patch: Partial<Product>): Promise<void> {
  await requireAdmin()

  const next: Partial<Product> = { ...patch }
  if (next.adult_price != null || next.child_price != null) {
    const current = await supabase.from('tours').select('adult_price, child_price').eq('id', id).single()
    if (current.error) throw new Error(current.error.message)
    const prices = validateTourPrices(
      Number(next.adult_price ?? current.data?.adult_price),
      Number(next.child_price ?? current.data?.child_price),
    )
    next.adult_price = prices.adult_price
    next.child_price = prices.child_price
  }
  if (next.max_capacity != null) {
    const cap = Number(next.max_capacity)
    if (!Number.isInteger(cap) || cap < 1 || cap > 100) {
      throw new Error('Capacity must be an integer between 1 and 100')
    }
    next.max_capacity = cap
  }

  const { error } = await supabase.from('tours').update(next).eq('id', id)
  if (error) throw new Error(error.message)
}

/** Soft-remove (or restore) a product. Inactive products are hidden from the public site/pages. */
export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  await requireAdmin()
  const { error } = await supabase.from('tours').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchTransportationRequests(
  status?: string,
): Promise<import('./types').TransportationRequest[]> {
  await requireAdmin()
  let q = supabase
    .from('transportation_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status && status !== 'all') {
    q = q.eq('status', status)
  }
  const { data, error } = await q
  if (error) {
    if (error.message.includes('transportation_requests') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as import('./types').TransportationRequest[]
}

export async function updateTransportationRequestStatus(
  id: number,
  status: string,
): Promise<void> {
  await requireAdmin()
  const { error } = await supabase
    .from('transportation_requests')
    .update({ status })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function countOpenTransportationRequests(): Promise<number> {
  await requireAdmin()
  const { count, error } = await supabase
    .from('transportation_requests')
    .select('id', { count: 'exact', head: true })
    .in('status', ['new', 'quoted'])
  if (error) return 0
  return count || 0
}

export async function fetchGuides(): Promise<Guide[]> {
  await requireAdmin()
  const { data, error } = await supabase.from('guides').select('*').order('name')
  if (error) {
    if (error.message.includes('guides') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []).map((g) => ({
    ...g,
    languages: (g as Guide).languages ?? null,
  })) as Guide[]
}

export async function saveGuide(
  guide: Partial<Guide> & { name: string },
  id?: number,
): Promise<void> {
  await requireAdmin()
  if (id) {
    const { error } = await supabase
      .from('guides')
      .update({ ...guide, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('guides').insert([guide])
    if (error) throw new Error(error.message)
  }
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  await requireAdmin()
  const { data, error } = await supabase.from('vehicles').select('*').order('name')
  if (error) {
    if (error.message.includes('vehicles') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as Vehicle[]
}

export async function saveVehicle(
  vehicle: Partial<Vehicle> & { name: string; passenger_capacity: number },
  id?: number,
): Promise<void> {
  await requireAdmin()
  if (id) {
    const { error } = await supabase
      .from('vehicles')
      .update({ ...vehicle, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('vehicles').insert([vehicle])
    if (error) throw new Error(error.message)
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  await requireAdmin()
  const { data, error } = await supabase.from('customers').select('*').order('updated_at', {
    ascending: false,
  })
  if (error) {
    if (error.message.includes('customers') || error.code === '42P01') {
      return fetchCustomersDerived()
    }
    throw new Error(error.message)
  }

  const bookings = await fetchOpsBookings()
  const today = todayTourDateISO()
  const byEmail = new Map<string, { count: number; value: number; latest: string; upcoming: string[] }>()

  for (const b of bookings) {
    const email = (b.customer_email || '').toLowerCase()
    if (!email) continue
    const cur = byEmail.get(email) || { count: 0, value: 0, latest: '', upcoming: [] }
    cur.count += 1
    cur.value += Number(b.total_price) || 0
    if (b.created_at > cur.latest) cur.latest = b.created_at
    if (b.tour_dates?.date && b.tour_dates.date >= today && b.status !== 'cancelled') {
      cur.upcoming.push(b.tour_dates.date)
    }
    byEmail.set(email, cur)
  }

  return ((data || []) as Customer[]).map((c) => {
    const stats = byEmail.get(c.email.toLowerCase())
    return {
      ...c,
      booking_count: stats?.count || 0,
      total_value: stats?.value || 0,
      latest_booking: stats?.latest || null,
      upcoming_booking: stats?.upcoming.sort()[0] || null,
    }
  })
}

/** Fallback when customers table missing — aggregate from bookings. */
export async function fetchCustomersDerived(): Promise<Customer[]> {
  await requireAdmin()
  const bookings = await fetchOpsBookings()
  const byEmail = new Map<string, Customer & { _dates: string[] }>()

  for (const b of bookings) {
    const email = (b.customer_email || '').toLowerCase()
    if (!email) continue
    const existing = byEmail.get(email)
    const tourDate = b.tour_dates?.date || null
    if (!existing) {
      byEmail.set(email, {
        id: 0,
        email,
        name: b.customer_name,
        phone: b.customer_phone,
        internal_notes: null,
        booking_count: 1,
        total_value: Number(b.total_price) || 0,
        latest_booking: b.created_at,
        upcoming_booking: tourDate,
        _dates: tourDate ? [tourDate] : [],
      })
    } else {
      existing.booking_count = (existing.booking_count || 0) + 1
      existing.total_value = (existing.total_value || 0) + (Number(b.total_price) || 0)
      if (b.created_at > (existing.latest_booking || '')) {
        existing.latest_booking = b.created_at
        existing.name = b.customer_name
        existing.phone = b.customer_phone
      }
      if (tourDate) existing._dates.push(tourDate)
    }
  }

  const today = todayTourDateISO()
  return Array.from(byEmail.values())
    .map(({ _dates, ...c }) => ({
      ...c,
      upcoming_booking: _dates.filter((d) => d >= today).sort()[0] || null,
    }))
    .sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0))
}

export async function updateCustomer(
  id: number,
  patch: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'internal_notes'>>,
): Promise<Customer> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('customers')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as Customer
}

export async function mergeCustomers(keepId: number, mergeId: number): Promise<void> {
  await requireAdmin()
  if (keepId === mergeId) throw new Error('Cannot merge a customer into itself')

  const { data: keep, error: kErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', keepId)
    .single()
  const { data: merge, error: mErr } = await supabase
    .from('customers')
    .select('*')
    .eq('id', mergeId)
    .single()
  if (kErr || mErr || !keep || !merge) throw new Error('Customer not found')

  // Re-point bookings from merge email → keep email (history preserved)
  const { error: bErr } = await supabase
    .from('bookings')
    .update({
      customer_email: keep.email,
      customer_name: keep.name || merge.name,
      customer_phone: keep.phone || merge.phone,
      updated_at: new Date().toISOString(),
    })
    .eq('customer_email', merge.email)
  if (bErr) throw new Error(bErr.message)

  const notes = [keep.internal_notes, merge.internal_notes, `Merged from ${merge.email}`]
    .filter(Boolean)
    .join('\n')
  await supabase
    .from('customers')
    .update({
      name: keep.name || merge.name,
      phone: keep.phone || merge.phone,
      internal_notes: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', keepId)

  const { error: dErr } = await supabase.from('customers').delete().eq('id', mergeId)
  if (dErr) throw new Error(dErr.message)
}

export async function deleteCustomer(id: number): Promise<void> {
  await requireAdmin()
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, email')
    .eq('id', id)
    .single()
  if (error || !customer) throw new Error(error?.message || 'Customer not found')

  const { count, error: cErr } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', customer.email)
    .is('deleted_at', null)
    .neq('status', 'cancelled')

  if (cErr && !isMissingColumnError(cErr.message)) throw new Error(cErr.message)

  // If soft-delete column missing, recount without it
  let active = count || 0
  if (cErr && isMissingColumnError(cErr.message)) {
    const { count: c2, error: e2 } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('customer_email', customer.email)
      .neq('status', 'cancelled')
    if (e2) throw new Error(e2.message)
    active = c2 || 0
  }

  if (active > 0) {
    throw new Error(
      `Cannot delete: ${active} active booking(s) still reference this email. Cancel or reassign bookings first.`,
    )
  }

  const { error: dErr } = await supabase.from('customers').delete().eq('id', id)
  if (dErr) throw new Error(dErr.message)
}

export async function fetchBookingsForCustomerEmail(email: string): Promise<OpsBooking[]> {
  return fetchOpsBookings({ search: email.trim().toLowerCase() }).then((rows) =>
    rows.filter((b) => b.customer_email.toLowerCase() === email.trim().toLowerCase()),
  )
}

export function detectCapacityConflicts(bookings: OpsBooking[]): CapacityConflict[] {
  const map = new Map<
    number,
    { date: string; tour_name: string; tour_id: number; guests: number; capacity: number; booking_ids: number[] }
  >()
  for (const b of bookings) {
    if (b.status === 'cancelled' || b.deleted_at) continue
    const key = b.tour_date_id
    if (!key) continue
    const cur = map.get(key) || {
      date: b.tour_dates?.date || '',
      tour_name: b.tours?.public_name || b.tours?.name || 'Tour',
      tour_id: b.tour_id,
      guests: 0,
      capacity: b.tours?.max_capacity || 0,
      booking_ids: [] as number[],
    }
    cur.guests += b.adults + b.children
    cur.booking_ids.push(b.id)
    if (b.tours?.max_capacity) cur.capacity = b.tours.max_capacity
    map.set(key, cur)
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.capacity > 0 && v.guests > v.capacity)
    .map(([tour_date_id, v]) => ({ tour_date_id, ...v }))
}

export function detectAssignmentConflicts(bookings: OpsBooking[]): AssignmentConflict[] {
  const guides = new Map<string, { name: string; ids: number[] }>()
  const vehicles = new Map<string, { name: string; ids: number[] }>()

  for (const b of bookings) {
    if (b.status === 'cancelled' || b.deleted_at) continue
    const date = b.tour_dates?.date
    if (!date) continue
    if (b.guide_id) {
      const key = `${b.guide_id}|${date}`
      const cur = guides.get(key) || { name: b.guides?.name || `Guide #${b.guide_id}`, ids: [] }
      cur.ids.push(b.id)
      guides.set(key, cur)
    }
    if (b.vehicle_id) {
      const key = `${b.vehicle_id}|${date}`
      const cur = vehicles.get(key) || {
        name: b.vehicles?.name || `Vehicle #${b.vehicle_id}`,
        ids: [],
      }
      cur.ids.push(b.id)
      vehicles.set(key, cur)
    }
  }

  const out: AssignmentConflict[] = []
  for (const [key, v] of guides) {
    if (v.ids.length < 2) continue
    const [id, date] = key.split('|')
    out.push({
      kind: 'guide',
      resource_id: Number(id),
      resource_name: v.name,
      date,
      booking_ids: v.ids,
    })
  }
  for (const [key, v] of vehicles) {
    if (v.ids.length < 2) continue
    const [id, date] = key.split('|')
    out.push({
      kind: 'vehicle',
      resource_id: Number(id),
      resource_name: v.name,
      date,
      booking_ids: v.ids,
    })
  }
  return out
}

export async function fetchOpsNotes(status: OpsNoteStatus | 'active' = 'active'): Promise<OpsNote[]> {
  await requireAdmin()
  let q = supabase.from('ops_notes').select('*').order('created_at', { ascending: false })
  if (status === 'active') {
    q = q.in('status', ['open', 'done'])
  } else {
    q = q.eq('status', status)
  }
  const { data, error } = await q
  if (error) {
    if (error.message.includes('ops_notes') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as OpsNote[]
}

export async function createOpsNote(input: {
  title: string
  body?: string
  priority?: OpsNotePriority
  due_date?: string | null
  assigned_to?: string | null
  related_booking_id?: number | null
}): Promise<OpsNote> {
  await requireAdmin()
  const created_by = await actorEmail()
  const { data, error } = await supabase
    .from('ops_notes')
    .insert([
      {
        title: input.title.trim(),
        body: input.body?.trim() || null,
        priority: input.priority || 'normal',
        due_date: input.due_date || null,
        assigned_to: input.assigned_to ?? created_by,
        related_booking_id: input.related_booking_id ?? null,
        created_by,
        status: 'open',
      },
    ])
    .select('*')
    .single()
  if (error) {
    if (error.message.includes('ops_notes') || error.code === '42P01') {
      throw new Error('Operations notes require migration 018_ops_hub_winter.sql')
    }
    throw new Error(error.message)
  }
  return data as OpsNote
}

export async function updateOpsNote(
  id: number,
  patch: Partial<{
    title: string
    body: string | null
    priority: OpsNotePriority
    due_date: string | null
    assigned_to: string | null
    status: OpsNoteStatus
  }>,
): Promise<OpsNote> {
  await requireAdmin()
  const extra: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status === 'done') extra.completed_at = new Date().toISOString()
  if (patch.status === 'open') extra.completed_at = null
  const { data, error } = await supabase
    .from('ops_notes')
    .update({ ...patch, ...extra })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return data as OpsNote
}

export async function importBookingsCsv(
  rows: Array<{
    customer_name: string
    customer_email: string
    customer_phone?: string
    tour_id: number
    tour_date: string
    adults: number
    children: number
    total_price: number
    source: BookingSource
    payment_status: PaymentStatus
    pickup_location?: string
  }>,
): Promise<{ created: number; errors: string[] }> {
  await requireAdmin()
  let created = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      await createManualBooking({
        ...row,
        source: row.source || 'other',
        send_confirmation: false,
      })
      created++
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  return { created, errors }
}
