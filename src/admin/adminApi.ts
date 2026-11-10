import { supabase } from '../lib/supabase'
import { todayTourDateISO } from '../lib/tourDate'
import { sendCustomerConfirmationStrict } from '../lib/email'
import { validateTourPrices } from '../lib/tourPricing'
import { normalizeTourCms } from '../lib/tourCms'
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
import type {
  SharedBoard,
  SharedBookingsAccess,
  SharedDepartureSummary,
  SharedOperatorRow,
  SharedPassenger,
  SharedSupplierOption,
} from './sharedBookings'
import { normalizeSharedBookingsAccess, payloadHasForbiddenFields } from './sharedBookings'

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
  stripe_payment_intent_id, stripe_checkout_session_id, payment_link_url, payment_link_expires_at,
  tour_id, tour_date_id,
  created_at, updated_at, deleted_at, email_status, email_last_sent_at, email_last_error,
  tours ( id, name, public_name, max_capacity, pricing_model ),
  tour_dates ( id, date )
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
    guide_id: null,
    vehicle_id: null,
    guides: null,
    vehicles: null,
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
  /** Soft-removed (deleted_at) bookings only */
  onlyRemoved?: boolean
  includeDeleted?: boolean
  attention?: 'payment' | 'email' | 'pending'
}): Promise<OpsBooking[]> {
  await requireAdmin()
  let query = supabase
    .from('bookings')
    .select(bookingSelectFull)
    .order('created_at', { ascending: false })
    .limit(2000)

  if (filters?.onlyRemoved) {
    query = query.not('deleted_at', 'is', null)
  } else if (!filters?.includeDeleted) {
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
        stripe_payment_intent_id, tour_id, tour_date_id,
        created_at, updated_at,
        tours ( id, name, public_name, max_capacity ),
        tour_dates ( id, date )
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

  if (filters?.attention === 'payment') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        !b.deleted_at &&
        (b.payment_status === 'unpaid' ||
          b.payment_status === 'pending_crypto' ||
          b.status === 'pending_crypto_payment'),
    )
  } else if (filters?.attention === 'email') {
    rows = rows.filter(
      (b) =>
        b.status !== 'cancelled' &&
        !b.deleted_at &&
        (b.email_status === 'failed' || b.email_status === 'not_sent'),
    )
  } else if (filters?.attention === 'pending') {
    rows = rows.filter(
      (b) =>
        !b.deleted_at &&
        (b.status === 'pending' || b.status === 'pending_crypto_payment'),
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
        stripe_payment_intent_id, tour_id, tour_date_id,
        created_at, updated_at,
        tours ( id, name, public_name, max_capacity ),
        tour_dates ( id, date )
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

export async function updateBookingOps(
  id: number,
  patch: Partial<{
    status: BookingStatus
    payment_status: PaymentStatus
    pickup_location: string | null
    tour_time: string | null
    internal_notes: string | null
    special_requests: string | null
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
  if (current.deleted_at) throw new Error('Booking is removed — restore it before editing')

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
          stripe_payment_intent_id, tour_id, tour_date_id,
          created_at, updated_at,
          tours ( id, name, public_name, max_capacity ),
          tour_dates ( id, date )
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

/**
 * Soft-remove booking from operational lists (uses deleted_at).
 * Cancels first so capacity triggers free seats. Never refunds Stripe.
 * Paid bookings require acknowledgePaidResolved=true (payment handled outside admin).
 */
export async function removeBooking(
  id: number,
  opts?: { acknowledgePaidResolved?: boolean },
): Promise<void> {
  await requireAdmin()
  const current = await fetchBooking(id)
  if (current.deleted_at) return

  const isPaidLive = current.payment_status === 'paid'
  if (isPaidLive && !opts?.acknowledgePaidResolved) {
    throw new Error(
      'This booking is marked paid. Mark payment as refunded first, or confirm that payment was resolved outside admin. Removal never refunds Stripe.',
    )
  }

  // Cancel first so capacity trigger frees slots, then archive
  if (current.status !== 'cancelled') {
    await updateBookingOps(id, { status: 'cancelled' })
  }

  const by = await actorEmail()
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
        'Remove booking requires migration 018 (deleted_at). Apply 018_ops_hub_winter.sql.',
      )
    }
    throw new Error(error.message)
  }
  try {
    await logEvent(
      id,
      'removed',
      null,
      'removed',
      isPaidLive
        ? `Removed by ${by} with paid-resolved acknowledgement (no Stripe refund)`
        : `Removed by ${by}`,
    )
  } catch {
    /* optional */
  }
}

/** @deprecated Use removeBooking */
export async function softDeleteBooking(id: number): Promise<void> {
  return removeBooking(id, { acknowledgePaidResolved: true })
}

export async function restoreBooking(id: number): Promise<OpsBooking> {
  await requireAdmin()
  const current = await fetchBooking(id)
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
    await logEvent(
      id,
      'restored',
      'removed',
      current.status,
      'Booking restored to active lists (still cancelled until status changed)',
    )
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
  payment_type?: string
  booking_status?: BookingStatus
  pickup_location?: string
  source: BookingSource
  notes?: string
  send_confirmation?: boolean
}): Promise<OpsBooking> {
  await requireAdmin()
  const product = await fetchProduct(input.tour_id)
  const perVehicle = product?.pricing_model === 'per_vehicle'
  const tourDate = await ensureTourDate(input.tour_id, input.tour_date)
  const pax = input.adults + input.children
  const remaining = tourDate.available_slots - tourDate.total_booked
  if (perVehicle) {
    if (remaining < 1) {
      throw new Error(`This exclusive departure on ${input.tour_date} is already reserved`)
    }
    const cap = product?.max_capacity || 8
    if (pax < 1 || pax > cap) {
      throw new Error(`This experience accepts 1–${cap} guests`)
    }
  } else if (pax > remaining) {
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

  const status: BookingStatus =
    input.booking_status ||
    (input.payment_status === 'paid' ? 'confirmed' : 'pending')

  const payload = {
    tour_id: input.tour_id,
    tour_date_id: tourDate.id,
    customer_name: input.customer_name.trim(),
    customer_email: input.customer_email.trim().toLowerCase(),
    customer_phone: input.customer_phone?.trim() || null,
    adults: input.adults,
    children: input.children,
    total_price: input.total_price,
    status,
    payment_status: input.payment_status,
    payment_type: input.payment_type || 'manual',
    source: input.source,
    pickup_location: input.pickup_location || null,
    tour_time: input.tour_time || null,
    special_requests: input.notes || null,
    internal_notes: input.notes || null,
    email_status: 'not_sent' as EmailStatus,
  }

  let { data, error } = await supabase.from('bookings').insert([payload]).select('id').single()

  if (error && isMissingColumnError(error.message)) {
    const { email_status: _emailStatus, ...slim } = payload
    void _emailStatus
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

export async function createAdminPaymentLink(
  bookingId: number,
  options?: { sendEmail?: boolean },
): Promise<{
  url: string
  session_id: string
  expires_at: string
  livemode: boolean
  email_sent: boolean
  email_error: string | null
}> {
  const session = await requireAdmin()
  const { data, error } = await supabase.functions.invoke('create-admin-payment-link', {
    body: { booking_id: bookingId, send_email: options?.sendEmail === true },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error(data?.error || 'Payment link was not created')
  if (data.livemode === true) {
    console.warn('Live-mode payment link created — confirm ops policy before sharing with customers')
  }
  return {
    url: String(data.url),
    session_id: String(data.session_id || ''),
    expires_at: String(data.expires_at || ''),
    livemode: Boolean(data.livemode),
    email_sent: Boolean(data.email_sent),
    email_error: data.email_error ? String(data.email_error) : null,
  }
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
  if (error) throw new Error(friendlyDbError(error.message))
  return (data || []).map((row) => normalizeProduct(row as Record<string, unknown>))
}

export async function fetchProduct(id: number): Promise<Product> {
  await requireAdmin()
  const { data, error } = await supabase.from('tours').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(friendlyDbError(error.message))
  if (!data) throw new Error('Tour not found')
  return normalizeProduct(data as Record<string, unknown>)
}

function friendlyDbError(message: string): string {
  const m = String(message || '')
  if (/column .* does not exist/i.test(m) || /Could not find the/i.test(m)) {
    return 'Tour CMS fields are missing in the database. Apply migration 025_tour_cms.sql, then try again.'
  }
  if (/JWT|auth|permission|policy|RLS/i.test(m)) {
    return 'You do not have permission to edit tours. Sign in again as an admin.'
  }
  return 'Could not save tour changes. Please try again.'
}

function normalizeProduct(row: Record<string, unknown>): Product {
  return normalizeTourCms(row) as unknown as Product
}

export async function updateProduct(id: number, patch: Partial<Product>): Promise<void> {
  await requireAdmin()

  const next: Record<string, unknown> = { ...patch }
  delete next.id

  if (next.adult_price != null || next.child_price != null) {
    const current = await supabase.from('tours').select('adult_price, child_price').eq('id', id).single()
    if (current.error) throw new Error(friendlyDbError(current.error.message))
    const prices = validateTourPrices(
      Number(next.adult_price ?? current.data?.adult_price),
      Number(next.child_price ?? current.data?.child_price),
    )
    next.adult_price = prices.adult_price
    next.child_price = prices.child_price
  }

  if (next.reference_price != null && next.reference_price !== '') {
    const ref = Number(next.reference_price)
    if (!Number.isFinite(ref) || ref < 0 || ref > 10000) {
      throw new Error('Original/reference price must be between €0 and €10,000')
    }
    next.reference_price = Math.round(ref * 100) / 100
  } else if (next.reference_price === '') {
    next.reference_price = null
  }

  if (next.max_capacity != null) {
    const cap = Number(next.max_capacity)
    if (!Number.isInteger(cap) || cap < 1 || cap > 100) {
      throw new Error('Capacity must be an integer between 1 and 100')
    }
    next.max_capacity = cap
  }

  const seasonStart = typeof next.season_start === 'string' ? next.season_start.trim() : next.season_start
  const seasonEnd = typeof next.season_end === 'string' ? next.season_end.trim() : next.season_end
  if (seasonStart === '') next.season_start = null
  else if (typeof seasonStart === 'string') {
    if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(seasonStart)) {
      throw new Error('Season start must be MM-DD, for example 11-01')
    }
    next.season_start = seasonStart
  }
  if (seasonEnd === '') next.season_end = null
  else if (typeof seasonEnd === 'string') {
    if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(seasonEnd)) {
      throw new Error('Season end must be MM-DD, for example 03-31')
    }
    next.season_end = seasonEnd
  }
  const hasSeasonStart = Boolean(next.season_start)
  const hasSeasonEnd = Boolean(next.season_end)
  if (hasSeasonStart !== hasSeasonEnd) {
    throw new Error('Set both season start and season end, or leave both empty')
  }

  if (typeof next.departure_time === 'string') {
    const time = next.departure_time.trim()
    if (!time) next.departure_time = null
    else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new Error('Departure time must be HH:MM, for example 20:00')
    } else next.departure_time = time
  }

  if (next.sale_enabled && next.reference_price != null && next.adult_price != null) {
    if (Number(next.reference_price) <= Number(next.adult_price)) {
      throw new Error('When sale is enabled, original price must be higher than the current adult price')
    }
  }

  next.cms_updated_at = new Date().toISOString()

  const { error } = await supabase.from('tours').update(next).eq('id', id)
  if (error) throw new Error(friendlyDbError(error.message))
}

/** Compress and upload a tour gallery image to Supabase Storage (tour-media). */
export async function uploadTourMedia(tourId: number, file: File): Promise<{ url: string; path: string }> {
  await requireAdmin()
  if (!file.type.startsWith('image/')) {
    throw new Error('Please upload an image file (JPEG, PNG, or WebP).')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Image is too large. Please use a file under 12 MB.')
  }

  const blob = await compressImageForTour(file)
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `tour-${tourId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from('tour-media').upload(path, blob, {
    cacheControl: '31536000',
    contentType: blob.type,
    upsert: false,
  })
  if (error) {
    throw new Error(
      /bucket|not found|policy/i.test(error.message)
        ? 'Photo storage is not ready. Apply migration 025 (tour-media bucket), then try again.'
        : 'Could not upload photo. Please try again.',
    )
  }

  const { data } = supabase.storage.from('tour-media').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

async function compressImageForTour(file: File): Promise<Blob> {
  const maxEdge = 1920
  const quality = 0.82
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    return blob || file
  } catch {
    return file
  }
}

/** Soft-remove (or restore) a product. Inactive products are hidden from the public site/pages. */
export async function setProductActive(id: number, isActive: boolean): Promise<void> {
  await requireAdmin()
  const { error } = await supabase.from('tours').update({ is_active: isActive }).eq('id', id)
  if (error) throw new Error(friendlyDbError(error.message))
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
    if (b.deleted_at || b.status === 'cancelled') continue
    const email = (b.customer_email || '').toLowerCase()
    if (!email) continue
    const cur = byEmail.get(email) || { count: 0, value: 0, latest: '', upcoming: [] }
    cur.count += 1
    if (b.payment_status === 'paid') cur.value += Number(b.total_price) || 0
    if (b.created_at > cur.latest) cur.latest = b.created_at
    if (b.tour_dates?.date && b.tour_dates.date >= today) {
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
    if (b.deleted_at || b.status === 'cancelled') continue
    const email = (b.customer_email || '').toLowerCase()
    if (!email) continue
    const existing = byEmail.get(email)
    const tourDate = b.tour_dates?.date || null
    const paidValue = b.payment_status === 'paid' ? Number(b.total_price) || 0 : 0
    if (!existing) {
      byEmail.set(email, {
        id: 0,
        email,
        name: b.customer_name,
        phone: b.customer_phone,
        internal_notes: null,
        booking_count: 1,
        total_value: paidValue,
        latest_booking: b.created_at,
        upcoming_booking: tourDate,
        _dates: tourDate ? [tourDate] : [],
      })
    } else {
      existing.booking_count = (existing.booking_count || 0) + 1
      existing.total_value = (existing.total_value || 0) + paidValue
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
    const perVehicle = b.tours?.pricing_model === 'per_vehicle'
    const cur = map.get(key) || {
      date: b.tour_dates?.date || '',
      tour_name: b.tours?.public_name || b.tours?.name || 'Tour',
      tour_id: b.tour_id,
      guests: 0,
      capacity: perVehicle ? 1 : b.tours?.max_capacity || 0,
      booking_ids: [] as number[],
    }
    // Exclusive / per-vehicle products consume 1 slot per booking
    cur.guests += perVehicle ? 1 : b.adults + b.children
    cur.booking_ids.push(b.id)
    if (perVehicle) cur.capacity = 1
    else if (b.tours?.max_capacity) cur.capacity = b.tours.max_capacity
    map.set(key, cur)
  }
  return Array.from(map.entries())
    .filter(([, v]) => v.capacity > 0 && v.guests > v.capacity)
    .map(([tour_date_id, v]) => ({ tour_date_id, ...v }))
}

/** Guide/vehicle assignment removed from admin — always empty. */
export function detectAssignmentConflicts(bookings: OpsBooking[]): AssignmentConflict[] {
  void bookings
  return []
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

export type PartnerApplicationRow = {
  id: string
  company_name: string
  business_id: string
  country: string
  business_type: string
  contact_name: string
  business_email: string
  phone: string | null
  website: string | null
  description: string
  status: 'pending' | 'approved' | 'declined'
  applicant_user_id: string | null
  partner_company_id: string | null
  admin_note: string | null
  reviewed_at: string | null
  invitation_sent_at: string | null
  created_at: string
  updated_at: string
}

export async function fetchPartnerApplications(
  status?: string,
): Promise<PartnerApplicationRow[]> {
  await requireAdmin()
  let q = supabase
    .from('partner_applications')
    .select(
      'id, company_name, business_id, country, business_type, contact_name, business_email, phone, website, description, status, applicant_user_id, partner_company_id, admin_note, reviewed_at, invitation_sent_at, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data || []) as PartnerApplicationRow[]
}

export type PartnerCompanyAdminRow = {
  id: string
  name: string
  business_id: string | null
  vat_id: string | null
  country: string
  business_type: string
  website: string | null
  description: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postal_code: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at: string
  updated_at: string
}

export type PartnerMemberAdminRow = {
  id: string
  user_id: string
  partner_company_id: string
  application_id: string | null
  member_role: string
  status: string
  created_at: string
  revoked_at: string | null
}

export async function fetchPartnerCompanyAdmin(
  companyId: string,
): Promise<{ company: PartnerCompanyAdminRow | null; members: PartnerMemberAdminRow[] }> {
  await requireAdmin()
  const [{ data: company, error: cErr }, { data: members, error: mErr }] = await Promise.all([
    supabase
      .from('partner_companies')
      .select(
        'id, name, business_id, vat_id, country, business_type, website, description, address_line1, address_line2, city, postal_code, contact_name, contact_email, contact_phone, created_at, updated_at',
      )
      .eq('id', companyId)
      .maybeSingle(),
    supabase
      .from('partner_members')
      .select(
        'id, user_id, partner_company_id, application_id, member_role, status, created_at, revoked_at',
      )
      .eq('partner_company_id', companyId)
      .order('created_at', { ascending: false }),
  ])
  if (cErr) throw new Error(cErr.message)
  if (mErr) throw new Error(mErr.message)
  return {
    company: (company as PartnerCompanyAdminRow | null) || null,
    members: (members || []) as PartnerMemberAdminRow[],
  }
}

export type PartnerTourPriceRow = {
  id: string
  partner_company_id: string
  tour_id: number
  pricing_type: 'fixed_net' | 'percent_off_retail'
  fixed_net_eur: number | null
  percent_off: number | null
  currency: string
  is_active: boolean
  effective_from: string
  effective_to: string | null
  admin_note: string | null
  updated_at: string
}

export type PartnerPriceAuditRow = {
  id: string
  partner_tour_price_id: string | null
  partner_company_id: string
  tour_id: number
  action: string
  before_row: Record<string, unknown> | null
  after_row: Record<string, unknown> | null
  changed_by: string | null
  created_at: string
}

export async function fetchPartnerCompaniesList(): Promise<
  Array<{ id: string; name: string; country: string; business_type: string }>
> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('partner_companies')
    .select('id, name, country, business_type')
    .order('name')
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchPartnerTourPricesAdmin(
  companyId: string,
): Promise<PartnerTourPriceRow[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('partner_tour_prices')
    .select(
      'id, partner_company_id, tour_id, pricing_type, fixed_net_eur, percent_off, currency, is_active, effective_from, effective_to, admin_note, updated_at',
    )
    .eq('partner_company_id', companyId)
    .order('tour_id')
  if (error) throw new Error(error.message)
  return (data || []) as PartnerTourPriceRow[]
}

export async function fetchPartnerPriceAudit(
  companyId: string,
  limit = 30,
): Promise<PartnerPriceAuditRow[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('partner_tour_price_audit')
    .select(
      'id, partner_tour_price_id, partner_company_id, tour_id, action, before_row, after_row, changed_by, created_at',
    )
    .eq('partner_company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data || []) as PartnerPriceAuditRow[]
}

export async function upsertPartnerTourPriceAdmin(input: {
  partner_company_id: string
  tour_id: number
  pricing_type: 'fixed_net' | 'percent_off_retail'
  fixed_net_eur?: number | null
  percent_off?: number | null
  is_active?: boolean
  effective_from?: string
  effective_to?: string | null
  admin_note?: string | null
  price_id?: string | null
}): Promise<Record<string, unknown>> {
  await requireAdmin()
  const { data, error } = await supabase.rpc('admin_upsert_partner_tour_price', {
    p_partner_company_id: input.partner_company_id,
    p_tour_id: input.tour_id,
    p_pricing_type: input.pricing_type,
    p_fixed_net_eur: input.fixed_net_eur ?? null,
    p_percent_off: input.percent_off ?? null,
    p_is_active: input.is_active ?? true,
    p_effective_from: input.effective_from || undefined,
    p_effective_to: input.effective_to ?? null,
    p_admin_note: input.admin_note ?? null,
    p_price_id: input.price_id ?? null,
  })
  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(String(data?.error || 'upsert_failed'))
  return data as Record<string, unknown>
}

export function resolvePartnerNetPreview(
  retail: number,
  pricingType: 'fixed_net' | 'percent_off_retail',
  fixedNet: number | null,
  percentOff: number | null,
): number | null {
  if (pricingType === 'fixed_net') {
    if (fixedNet == null || Number.isNaN(fixedNet)) return null
    return Math.round(fixedNet * 100) / 100
  }
  if (percentOff == null || Number.isNaN(percentOff)) return null
  return Math.round(Math.max(retail * (1 - percentOff / 100), 0) * 100) / 100
}

export type PartnerBookingRequestAdminRow = {
  id: string
  reference: string
  partner_company_id: string
  tour_id: number
  tour_date: string
  adults: number
  children: number
  passenger_count: number
  guest_name: string
  guest_email: string
  guest_phone: string | null
  pickup_location: string | null
  special_requests: string | null
  unit_net_eur: number
  total_net_eur: number
  currency: string
  status: string
  booking_id: number | null
  admin_note: string | null
  created_at: string
  reviewed_at: string | null
  partner_companies?: { name: string } | null
  tours?: { name: string; public_name: string | null } | null
}

export async function fetchPartnerBookingRequestsAdmin(
  status?: string,
): Promise<PartnerBookingRequestAdminRow[]> {
  await requireAdmin()
  let q = supabase
    .from('partner_booking_requests')
    .select(
      `id, reference, partner_company_id, tour_id, tour_date, adults, children, passenger_count,
       guest_name, guest_email, guest_phone, pickup_location, special_requests,
       unit_net_eur, total_net_eur, currency, status, booking_id, admin_note, created_at, reviewed_at,
       partner_companies ( name ),
       tours ( name, public_name )`,
    )
    .order('created_at', { ascending: false })
  if (status && status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data || []) as PartnerBookingRequestAdminRow[]
}

export async function reviewPartnerBookingRequestAdmin(input: {
  request_id: string
  action: 'approve' | 'decline'
  admin_note?: string | null
}): Promise<Record<string, unknown>> {
  await requireAdmin()
  const { data, error } = await supabase.rpc('admin_review_partner_booking_request', {
    p_request_id: input.request_id,
    p_action: input.action,
    p_admin_note: input.admin_note ?? null,
  })
  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(String(data?.error || 'review_failed'))
  // Outbox is processed autonomously by pg_cron → Vault-authenticated edge invoke.
  return data as Record<string, unknown>
}

export type NotificationOutboxAdminRow = {
  id: string
  template_key: string
  recipient_email: string
  recipient_role: string
  status: string
  attempt_count: number
  last_error: string | null
  sent_at: string | null
  created_at: string
  partner_booking_request_id: string
  updated_at?: string | null
  next_attempt_at?: string | null
}

export async function fetchNotificationsForPartnerRequest(
  requestId: string,
): Promise<NotificationOutboxAdminRow[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('notification_outbox')
    .select(
      'id, template_key, recipient_email, recipient_role, status, attempt_count, last_error, sent_at, created_at, partner_booking_request_id, updated_at, next_attempt_at',
    )
    .eq('partner_booking_request_id', requestId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []) as NotificationOutboxAdminRow[]
}

export type NotificationOutboxProblem = NotificationOutboxAdminRow & {
  problem: string
  request_reference?: string | null
  request_status?: string | null
  company_name?: string | null
  max_attempts?: number
  next_attempt_at?: string | null
  updated_at?: string | null
}

export type NotificationOutboxHealth = {
  ok: boolean
  count: number
  items: NotificationOutboxProblem[]
  cron_configured: boolean
  vault_project_url_present: boolean
  vault_service_role_present: boolean
  error?: string
}

export async function fetchNotificationOutboxProblems(
  limit = 50,
): Promise<NotificationOutboxHealth> {
  await requireAdmin()
  const { data, error } = await supabase.rpc('admin_list_notification_outbox_problems', {
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(String(data?.error || 'failed'))
  return {
    ok: true,
    count: Number(data.count || 0),
    items: (data.items || []) as NotificationOutboxProblem[],
    cron_configured: Boolean(data.cron_configured),
    vault_project_url_present: Boolean(data.vault_project_url_present),
    vault_service_role_present: Boolean(data.vault_service_role_present),
  }
}

export async function retryPartnerBookingNotification(id: string): Promise<void> {
  await requireAdmin()
  const { data, error } = await supabase.rpc('admin_retry_notification_outbox', { p_id: id })
  if (error) throw new Error(error.message)
  if (!data?.ok) throw new Error(String(data?.error || 'retry_failed'))
  // Delivery is autonomous via cron; retry only re-queues. Optional flush omitted
  // so delivery does not depend on this browser call remaining open.
}

export async function reviewPartnerApplication(input: {
  application_id: string
  action: 'approve' | 'decline' | 'revoke'
  admin_note?: string | null
}): Promise<Record<string, unknown>> {
  const session = await requireAdmin()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-partner-application`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(input),
    },
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Partner review failed (${res.status})`)
  }
  return body
}

// ---------------------------------------------------------------------------
// Shared Bookings foundation
// ---------------------------------------------------------------------------

async function requireSharedBookingsSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) throw new Error('Authentication required')
  return data.session
}

export async function fetchSharedBookingsAccess(): Promise<SharedBookingsAccess> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('get_shared_bookings_access')
  if (error) throw new Error(error.message)
  return normalizeSharedBookingsAccess(data)
}

export async function listSharedDepartures(
  board: SharedBoard,
  from?: string,
  to?: string,
): Promise<{
  ok: boolean
  error?: string
  departures: SharedDepartureSummary[]
  channels_synced?: boolean
}> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('list_shared_departures', {
    p_board: board,
    p_from: from || undefined,
    p_to: to || undefined,
  })
  if (error) throw new Error(error.message)
  const payload = data as {
    ok: boolean
    error?: string
    departures?: SharedDepartureSummary[]
    channels_synced?: boolean
  }
  if (payload?.ok) {
    const leaks = payloadHasForbiddenFields(payload)
    if (leaks.length) {
      throw new Error(`forbidden_shared_bookings_field:${leaks.join(',')}`)
    }
  }
  return {
    ok: Boolean(payload?.ok),
    error: payload?.error,
    departures: Array.isArray(payload?.departures) ? payload.departures : [],
    channels_synced: Boolean(payload?.channels_synced),
  }
}

export async function fetchSharedDepartureDetail(id: string): Promise<{
  ok: boolean
  error?: string
  departure: SharedDepartureSummary
  passengers: SharedPassenger[]
  cancelled: SharedPassenger[]
  channels_synced: boolean
}> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('get_shared_departure_detail', {
    p_departure_id: id,
  })
  if (error) throw new Error(error.message)
  const payload = data as {
    ok: boolean
    error?: string
    departure?: SharedDepartureSummary
    passengers?: SharedPassenger[]
    cancelled?: SharedPassenger[]
    channels_synced?: boolean
  }
  if (payload?.ok) {
    const leaks = payloadHasForbiddenFields(payload)
    if (leaks.length) {
      throw new Error(`forbidden_shared_bookings_field:${leaks.join(',')}`)
    }
  }
  if (!payload?.ok || !payload.departure) {
    return {
      ok: false,
      error: payload?.error || 'not_found',
      departure: {
        id,
        board: 'shared_bus',
        departure_date: '',
        tour_code: '',
        tour_title: '',
        departure_time: null,
        meeting_point: null,
        capacity: 0,
        confirmed_passengers: 0,
        available_seats: 0,
        supplier_breakdown: [],
        channels_synced: false,
      },
      passengers: [],
      cancelled: [],
      channels_synced: false,
    }
  }
  return {
    ok: true,
    departure: payload.departure,
    passengers: Array.isArray(payload.passengers) ? payload.passengers : [],
    cancelled: Array.isArray(payload.cancelled) ? payload.cancelled : [],
    channels_synced: Boolean(payload.channels_synced),
  }
}

export async function completeSharedOperatorPasswordChange(): Promise<{
  ok: boolean
  error?: string
}> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('complete_shared_operator_password_change')
  if (error) throw new Error(error.message)
  return data as { ok: boolean; error?: string }
}

export async function listSharedBookingOperators(): Promise<{
  ok: boolean
  error?: string
  operators: SharedOperatorRow[]
}> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('list_shared_booking_operators')
  if (error) throw new Error(error.message)
  const payload = data as { ok: boolean; error?: string; operators?: SharedOperatorRow[] }
  return {
    ok: Boolean(payload?.ok),
    error: payload?.error,
    operators: Array.isArray(payload?.operators) ? payload.operators : [],
  }
}

export async function listSharedSuppliersAdmin(): Promise<{
  ok: boolean
  error?: string
  suppliers: SharedSupplierOption[]
}> {
  await requireSharedBookingsSession()
  const { data, error } = await supabase.rpc('list_shared_suppliers_admin')
  if (error) throw new Error(error.message)
  const payload = data as { ok: boolean; error?: string; suppliers?: SharedSupplierOption[] }
  return {
    ok: Boolean(payload?.ok),
    error: payload?.error,
    suppliers: Array.isArray(payload?.suppliers) ? payload.suppliers : [],
  }
}

async function sharedOperatorAdminFetch(body: Record<string, unknown>) {
  const session = await requireSharedBookingsSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-shared-booking-operator`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    },
  )
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(payload.error || `Operator request failed (${res.status})`)
  }
  return payload
}

export async function createSharedBookingOperator(input: {
  email: string
  display_name?: string
  supplier_id: string
}): Promise<{ temporary_password: string; operator: SharedOperatorRow }> {
  const payload = await sharedOperatorAdminFetch({ action: 'create', ...input })
  if (!payload.temporary_password) throw new Error('temporary_password_missing')
  return {
    temporary_password: String(payload.temporary_password),
    operator: payload.operator as SharedOperatorRow,
  }
}

export async function setSharedOperatorActive(operatorId: string, isActive: boolean): Promise<void> {
  await sharedOperatorAdminFetch({
    action: 'set_active',
    operator_id: operatorId,
    is_active: isActive,
  })
}

export async function resetSharedOperatorTemporaryPassword(
  operatorId: string,
): Promise<{ temporary_password: string }> {
  const payload = await sharedOperatorAdminFetch({
    action: 'reset_temporary_password',
    operator_id: operatorId,
  })
  if (!payload.temporary_password) throw new Error('temporary_password_missing')
  return { temporary_password: String(payload.temporary_password) }
}
