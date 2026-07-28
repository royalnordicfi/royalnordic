import { supabase } from '../lib/supabase'
import { todayTourDateISO } from '../lib/tourDate'
import type {
  BookingEvent,
  BookingSource,
  BookingStatus,
  Customer,
  Guide,
  OpsBooking,
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
  created_at, updated_at,
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
  }
}

function isMissingColumnError(message: string) {
  return (
    message.includes('column') ||
    message.includes('does not exist') ||
    message.includes('booking_ref') ||
    message.includes('payment_status') ||
    message.includes('Could not find')
  )
}

export async function fetchOpsBookings(filters?: {
  status?: string
  source?: string
  search?: string
  fromDate?: string
  toDate?: string
}): Promise<OpsBooking[]> {
  await requireAdmin()
  let query = supabase
    .from('bookings')
    .select(bookingSelectFull)
    .order('created_at', { ascending: false })
    .limit(500)

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.source && filters.source !== 'all') {
    query = query.eq('source', filters.source)
  }

  let { data, error } = await query
  if (error && isMissingColumnError(error.message)) {
    const legacy = await supabase
      .from('bookings')
      .select(bookingSelectLegacy)
      .order('created_at', { ascending: false })
      .limit(500)
    data = legacy.data
    error = legacy.error
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
    const legacy = await supabase
      .from('bookings')
      .select(bookingSelectLegacy)
      .eq('id', id)
      .single()
    data = legacy.data
    error = legacy.error
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
    // Table may not exist until migration applied
    if (error.message.includes('booking_events') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as BookingEvent[]
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

  if (patch.vehicle_id) {
    const passengers = (patch.adults ?? current.adults) + (patch.children ?? current.children)
    const { data: vehicle, error: vErr } = await supabase
      .from('vehicles')
      .select('passenger_capacity, name')
      .eq('id', patch.vehicle_id)
      .single()
    if (vErr) throw new Error(vErr.message)
    if (vehicle && passengers > vehicle.passenger_capacity) {
      throw new Error(
        `Vehicle "${vehicle.name}" capacity is ${vehicle.passenger_capacity}; booking has ${passengers} passengers`,
      )
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(bookingSelectFull)
    .single()

  if (error) throw new Error(error.message)

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

  return normalizeBooking(data as unknown as Record<string, unknown>)
}

async function ensureTourDate(tourId: number, date: string): Promise<number> {
  const { data: existing } = await supabase
    .from('tour_dates')
    .select('id')
    .eq('tour_id', tourId)
    .eq('date', date)
    .maybeSingle()

  if (existing?.id) return existing.id

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
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return created.id
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
}): Promise<OpsBooking> {
  await requireAdmin()
  const tour_date_id = await ensureTourDate(input.tour_id, input.tour_date)

  const payload = {
    tour_id: input.tour_id,
    tour_date_id,
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
  }

  let { data, error } = await supabase.from('bookings').insert([payload]).select('id').single()

  if (error && isMissingColumnError(error.message)) {
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
  }

  if (error) throw new Error(error.message)
  if (!data?.id) throw new Error('Booking create returned no id')

  const bookingId = data.id as number

  await supabase
    .from('bookings')
    .update({ booking_ref: `RN-${bookingId}` })
    .eq('id', bookingId)

  try {
    await logEvent(bookingId, 'created', null, 'manual', 'Manual booking created')
  } catch {
    // booking_events may not exist until migration 016
  }
  try {
    await upsertCustomerFromBooking({
      email: input.customer_email,
      name: input.customer_name,
      phone: input.customer_phone || null,
    })
  } catch {
    // customers table may not exist until migration 016
  }

  return fetchBooking(bookingId)
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

export async function updateProduct(
  id: number,
  patch: Partial<Product>,
): Promise<void> {
  await requireAdmin()
  const { error } = await supabase.from('tours').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchGuides(): Promise<Guide[]> {
  await requireAdmin()
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .order('name')
  if (error) {
    if (error.message.includes('guides') || error.code === '42P01') return []
    throw new Error(error.message)
  }
  return (data || []) as Guide[]
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
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('name')
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
      upcoming_booking:
        _dates.filter((d) => d >= today).sort()[0] || null,
    }))
    .sort((a, b) => (b.booking_count || 0) - (a.booking_count || 0))
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
      const { data: dup } = await supabase
        .from('bookings')
        .select('id')
        .eq('customer_email', row.customer_email.toLowerCase())
        .eq('tour_id', row.tour_id)
        .limit(20)

      const tourDateId = await ensureTourDate(row.tour_id, row.tour_date)
      const duplicate = (dup || []).length
        ? await supabase
            .from('bookings')
            .select('id, tour_date_id')
            .eq('customer_email', row.customer_email.toLowerCase())
            .eq('tour_id', row.tour_id)
            .eq('tour_date_id', tourDateId)
            .maybeSingle()
        : { data: null }

      if (duplicate.data?.id) {
        errors.push(`Row ${i + 1}: duplicate skipped (${row.customer_email} / ${row.tour_date})`)
        continue
      }

      await createManualBooking({
        ...row,
        source: row.source || 'other',
      })
      created++
    } catch (e) {
      errors.push(`Row ${i + 1}: ${e instanceof Error ? e.message : 'failed'}`)
    }
  }

  return { created, errors }
}
