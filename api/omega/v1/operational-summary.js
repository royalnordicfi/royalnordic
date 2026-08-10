/**
 * OMEGA read-only operational summary for Royal Nordic.
 * Server-only. No writes. Minimal PII (no email/phone/name/notes).
 *
 * Auth: Authorization: Bearer <OMEGA_API_KEY>  OR  x-omega-api-key: <OMEGA_API_KEY>
 * Env: OMEGA_API_KEY, SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY
 *
 * Transport: Web Handler (Request/Response) -- Vercel's current documented
 * zero-config shape for non-Next.js /api functions ("Vercel Functions use a
 * Web Handler, which consists of the request parameter that is an instance
 * of the web standard Request API"). Previously this used the legacy Node
 * (req, res) helper-style signature as an ESM default export; that
 * combination (ESM + Node helpers, no `builds` entry to hint the runtime)
 * is not the flagship-documented pattern and produced a platform-level 404
 * in production even though the file was correctly deployed. Only the
 * transport layer below changed -- every business-logic function
 * (buildOperationalSummary, buildIssues, mapBooking, timingSafeEqual, etc.)
 * is unchanged.
 */

import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual as nodeTimingSafeEqual } from 'crypto'

const SELECT_OPS = `
  id, booking_ref, adults, children, total_price, status, payment_status, payment_type,
  source, pickup_location, tour_time, guide_id, vehicle_id, tour_id, tour_date_id,
  created_at, updated_at,
  tours ( id, name, public_name, max_capacity, is_active ),
  tour_dates ( id, date, available_slots, total_booked ),
  guides ( id, name, availability_status, is_active ),
  vehicles ( id, name, passenger_capacity, status, is_active )
`

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json',
      'X-Omega-Integration': 'royal-nordic-read-v1',
    },
  })
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  // Buffers of different length would throw inside node's timingSafeEqual;
  // returning false here is still constant-time relative to a real secret
  // comparison since key length is not itself sensitive.
  if (ba.length !== bb.length) return false
  try {
    return nodeTimingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

function extractApiKey(request) {
  const header = request.headers.get('authorization') || ''
  const bearer = String(header).match(/^Bearer\s+(.+)$/i)
  if (bearer?.[1]) return bearer[1].trim()
  const x = request.headers.get('x-omega-api-key')
  if (x) return String(x).trim()
  return null
}

function dateKeyHelsinki(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function passengers(b) {
  return Number(b.adults || 0) + Number(b.children || 0)
}

function adminDeepLink(adminBase, bookingId) {
  const base = (adminBase || 'https://admin.royalnordic.fi').replace(/\/$/, '')
  return `${base}/bookings/${bookingId}`
}

function buildIssues(bookings, tourDates, today) {
  const issues = []
  const byDateTour = new Map()

  for (const b of bookings) {
    if (b.status === 'cancelled') continue
    const date = b.tour_dates?.date || null
    const pax = passengers(b)
    const isUpcoming = date && date >= today

    if (isUpcoming && !b.guide_id) {
      issues.push({
        type: 'unassigned_guide',
        severity: date === today ? 'critical' : 'warning',
        booking_id: b.id,
        booking_ref: b.booking_ref || `RN-${b.id}`,
        tour_date: date,
        tour_time: b.tour_time,
        product_name: b.tours?.public_name || b.tours?.name || null,
        passengers: pax,
        admin_url_path: `/bookings/${b.id}`,
      })
    }
    if (isUpcoming && !b.vehicle_id) {
      issues.push({
        type: 'unassigned_vehicle',
        severity: date === today ? 'critical' : 'warning',
        booking_id: b.id,
        booking_ref: b.booking_ref || `RN-${b.id}`,
        tour_date: date,
        tour_time: b.tour_time,
        product_name: b.tours?.public_name || b.tours?.name || null,
        passengers: pax,
        admin_url_path: `/bookings/${b.id}`,
      })
    }
    if (
      isUpcoming &&
      (b.payment_status === 'unpaid' || b.payment_status === 'partial') &&
      (b.source === 'direct_website' || b.source === 'manual')
    ) {
      issues.push({
        type: 'payment_issue',
        severity: date === today ? 'critical' : 'warning',
        booking_id: b.id,
        booking_ref: b.booking_ref || `RN-${b.id}`,
        tour_date: date,
        payment_status: b.payment_status,
        source: b.source,
        admin_url_path: `/bookings/${b.id}`,
      })
    }

    if (date && b.tour_id) {
      const key = `${b.tour_id}:${date}`
      const cur = byDateTour.get(key) || { tour_id: b.tour_id, date, pax: 0, capacity: null }
      cur.pax += pax
      cur.capacity = b.tours?.max_capacity ?? cur.capacity
      byDateTour.set(key, cur)
    }
  }

  for (const td of tourDates) {
    const booked = Number(td.total_booked || 0)
    const slots = Number(td.available_slots || 0)
    if (slots > 0 && booked > slots) {
      issues.push({
        type: 'capacity_conflict',
        severity: td.date === today ? 'critical' : 'warning',
        tour_date_id: td.id,
        tour_id: td.tour_id,
        tour_date: td.date,
        total_booked: booked,
        available_slots: slots,
        admin_url_path: '/calendar',
      })
    }
  }

  for (const cur of byDateTour.values()) {
    if (cur.capacity != null && cur.pax > cur.capacity) {
      issues.push({
        type: 'capacity_conflict',
        severity: cur.date === today ? 'critical' : 'warning',
        tour_id: cur.tour_id,
        tour_date: cur.date,
        passengers: cur.pax,
        max_capacity: cur.capacity,
        admin_url_path: '/calendar',
      })
    }
  }

  return issues
}

function mapBooking(b, adminBase) {
  const date = b.tour_dates?.date || null
  return {
    external_id: String(b.id),
    booking_ref: b.booking_ref || `RN-${b.id}`,
    tour_date: date,
    tour_time: b.tour_time || null,
    product_id: b.tour_id,
    product_name: b.tours?.public_name || b.tours?.name || null,
    adults: Number(b.adults || 0),
    children: Number(b.children || 0),
    passengers: passengers(b),
    booked_revenue_eur: Number(b.total_price || 0),
    status: b.status,
    payment_status: b.payment_status || null,
    payment_type: b.payment_type || null,
    source: b.source || null,
    pickup_location: b.pickup_location || null,
    guide_id: b.guide_id,
    guide_name: b.guides?.name || null,
    vehicle_id: b.vehicle_id,
    vehicle_name: b.vehicles?.name || null,
    unassigned_guide: !b.guide_id,
    unassigned_vehicle: !b.vehicle_id,
    admin_url: adminDeepLink(adminBase, b.id),
    updated_at: b.updated_at || b.created_at,
  }
}

export async function buildOperationalSummary({ supabase, adminBase, horizonDays = 14 }) {
  const generatedAt = new Date().toISOString()
  const today = dateKeyHelsinki()
  const until = addDays(today, horizonDays)

  const [{ data: tours }, { data: guides }, { data: vehicles }, { data: tourDates }, bookingsRes] =
    await Promise.all([
      supabase
        .from('tours')
        .select('id, name, public_name, max_capacity, adult_price, child_price, is_active, commission_percent')
        .order('id'),
      supabase.from('guides').select('id, name, availability_status, is_active').eq('is_active', true),
      supabase
        .from('vehicles')
        .select('id, name, passenger_capacity, status, is_active')
        .eq('is_active', true),
      supabase
        .from('tour_dates')
        .select('id, tour_id, date, available_slots, total_booked')
        .gte('date', today)
        .lte('date', until)
        .order('date'),
      supabase
        .from('bookings')
        .select(SELECT_OPS)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(500),
    ])

  let bookings = bookingsRes.data || []
  if (bookingsRes.error) {
    // Fallback if ops columns / joins fail (pre-migration 016)
    const legacy = await supabase
      .from('bookings')
      .select(
        `
        id, adults, children, total_price, status, payment_type,
        tour_id, tour_date_id, created_at,
        tours ( id, name, max_capacity ),
        tour_dates ( id, date, available_slots, total_booked )
      `,
      )
      .neq('status', 'cancelled')
      .limit(500)
    if (legacy.error) throw new Error(legacy.error.message)
    bookings = (legacy.data || []).map((b) => ({
      ...b,
      booking_ref: `RN-${b.id}`,
      payment_status: b.status === 'confirmed' ? 'paid' : 'unpaid',
      source: 'direct_website',
      pickup_location: null,
      tour_time: null,
      guide_id: null,
      vehicle_id: null,
      guides: null,
      vehicles: null,
      updated_at: b.created_at,
    }))
  }

  const upcoming = bookings.filter((b) => {
    const d = b.tour_dates?.date
    return d && d >= today && d <= until
  })
  const todayBookings = upcoming.filter((b) => b.tour_dates?.date === today)
  const cancelledWindow = [] // cancelled excluded from main query; optional separate if needed

  const issues = buildIssues(upcoming, tourDates || [], today)

  const bookedRevenueUpcoming = upcoming.reduce((s, b) => s + Number(b.total_price || 0), 0)
  const bookedRevenueToday = todayBookings.reduce((s, b) => s + Number(b.total_price || 0), 0)
  const passengersUpcoming = upcoming.reduce((s, b) => s + passengers(b), 0)
  const passengersToday = todayBookings.reduce((s, b) => s + passengers(b), 0)

  const bySource = {}
  for (const b of upcoming) {
    const src = b.source || 'unknown'
    bySource[src] = (bySource[src] || 0) + Number(b.total_price || 0)
  }

  const products = (tours || []).map((t) => ({
    id: t.id,
    name: t.name,
    public_name: t.public_name || t.name,
    max_capacity: t.max_capacity,
    adult_price: t.adult_price,
    child_price: t.child_price,
    is_active: t.is_active !== false,
    commission_percent: t.commission_percent ?? null,
  }))

  return {
    schema_version: 1,
    integration: 'royal-nordic',
    mode: 'read_only',
    generated_at: generatedAt,
    timezone: 'Europe/Helsinki',
    today,
    horizon_days: horizonDays,
    summary: {
      bookings_today: todayBookings.length,
      bookings_upcoming: upcoming.length,
      passengers_today: passengersToday,
      passengers_upcoming: passengersUpcoming,
      booked_revenue_today_eur: Math.round(bookedRevenueToday * 100) / 100,
      booked_revenue_upcoming_eur: Math.round(bookedRevenueUpcoming * 100) / 100,
      unassigned_guide_count: issues.filter((i) => i.type === 'unassigned_guide').length,
      unassigned_vehicle_count: issues.filter((i) => i.type === 'unassigned_vehicle').length,
      capacity_conflict_count: issues.filter((i) => i.type === 'capacity_conflict').length,
      payment_issue_count: issues.filter((i) => i.type === 'payment_issue').length,
      critical_issue_count: issues.filter((i) => i.severity === 'critical').length,
      active_products: products.filter((p) => p.is_active).length,
      active_guides: (guides || []).length,
      active_vehicles: (vehicles || []).length,
    },
    revenue: {
      upcoming_gross_eur: Math.round(bookedRevenueUpcoming * 100) / 100,
      today_gross_eur: Math.round(bookedRevenueToday * 100) / 100,
      by_source: bySource,
      incomplete: false,
      note: 'Gross booked totals from booking rows — not reconciled bank cash.',
    },
    today_tours: todayBookings.map((b) => mapBooking(b, adminBase)),
    upcoming_bookings: upcoming.map((b) => mapBooking(b, adminBase)),
    cancelled_recent: cancelledWindow,
    assignment_issues: issues,
    products,
    guides: (guides || []).map((g) => ({
      id: g.id,
      name: g.name,
      availability_status: g.availability_status,
      is_active: g.is_active,
    })),
    vehicles: (vehicles || []).map((v) => ({
      id: v.id,
      name: v.name,
      passenger_capacity: v.passenger_capacity,
      status: v.status,
      is_active: v.is_active,
    })),
    capacity: (tourDates || []).map((td) => ({
      tour_date_id: td.id,
      tour_id: td.tour_id,
      date: td.date,
      available_slots: td.available_slots,
      total_booked: td.total_booked,
      remaining_slots: Math.max(0, Number(td.available_slots || 0) - Number(td.total_booked || 0)),
    })),
    record_counts: {
      bookings_returned: upcoming.length,
      products: products.length,
      guides: (guides || []).length,
      vehicles: (vehicles || []).length,
      capacity_rows: (tourDates || []).length,
      issues: issues.length,
    },
  }
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-omega-api-key, content-type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      })
    }

    if (request.method !== 'GET') {
      return json(405, { ok: false, error: 'method_not_allowed' })
    }

    const expected = process.env.OMEGA_API_KEY?.trim() || process.env.ROYAL_NORDIC_OMEGA_API_KEY?.trim()
    if (!expected) {
      return json(503, {
        ok: false,
        error: 'misconfigured',
        detail: 'OMEGA_API_KEY not set on Royal Nordic',
      })
    }

    const provided = extractApiKey(request)
    if (!provided || !timingSafeEqual(provided, expected)) {
      return json(401, { ok: false, error: 'unauthorized' })
    }

    const supabaseUrl =
      process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim()
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    if (!supabaseUrl || !serviceKey) {
      return json(503, {
        ok: false,
        error: 'misconfigured',
        detail: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY required',
      })
    }

    const adminBase =
      process.env.ROYAL_NORDIC_ADMIN_URL?.trim() ||
      process.env.ADMIN_PUBLIC_URL?.trim() ||
      'https://admin.royalnordic.fi'

    const started = Date.now()
    try {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const url = new URL(request.url)
      const horizon = Math.min(
        60,
        Math.max(1, parseInt(url.searchParams.get('horizon_days') || '14', 10) || 14),
      )
      const summary = await buildOperationalSummary({
        supabase,
        adminBase,
        horizonDays: horizon,
      })
      return json(200, {
        ok: true,
        latency_ms: Date.now() - started,
        ...summary,
      })
    } catch (err) {
      console.error('[omega-operational-summary]', err?.message || err)
      return json(500, {
        ok: false,
        error: 'internal_error',
        detail: 'Failed to build operational summary',
        latency_ms: Date.now() - started,
      })
    }
  },
}
