// Supabase Edge Function: OMEGA read-only operational summary
// Deploy: npx supabase functions deploy omega-operational-read --project-ref itihdgqgvlphtyidnvkt
// Auth: Authorization: Bearer <OMEGA_API_KEY>  (verify_jwt=false)
// Secrets: OMEGA_API_KEY (set via supabase secrets)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-omega-api-key, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SELECT_OPS = `
  id, booking_ref, adults, children, total_price, status, payment_status, payment_type,
  source, pickup_location, tour_time, guide_id, vehicle_id, tour_id, tour_date_id,
  created_at, updated_at,
  tours ( id, name, public_name, max_capacity, is_active ),
  tour_dates ( id, date, available_slots, total_booked ),
  guides ( id, name, availability_status, is_active ),
  vehicles ( id, name, passenger_capacity, status, is_active )
`;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Omega-Integration": "royal-nordic-read-v1",
    },
  });
}

function extractKey(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m?.[1]) return m[1].trim();
  return req.headers.get("x-omega-api-key")?.trim() || null;
}

function dateKeyHelsinki(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pax(b: Record<string, unknown>) {
  return Number(b.adults || 0) + Number(b.children || 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  const expected = Deno.env.get("OMEGA_API_KEY")?.trim();
  if (!expected) {
    return json(503, { ok: false, error: "misconfigured", detail: "OMEGA_API_KEY missing" });
  }
  const provided = extractKey(req);
  if (!provided || provided !== expected) {
    return json(401, { ok: false, error: "unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminBase = Deno.env.get("ADMIN_PUBLIC_URL")?.trim() || "https://admin.royalnordic.fi";
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const url = new URL(req.url);
  const horizon = Math.min(60, Math.max(1, parseInt(url.searchParams.get("horizon_days") || "14", 10) || 14));
  const started = Date.now();
  const today = dateKeyHelsinki();
  const until = addDays(today, horizon);

  try {
    const [{ data: tours }, { data: guides }, { data: vehicles }, { data: tourDates }, bookingsRes] =
      await Promise.all([
        supabase
          .from("tours")
          .select("id, name, public_name, max_capacity, adult_price, child_price, is_active, commission_percent")
          .order("id"),
        supabase.from("guides").select("id, name, availability_status, is_active").eq("is_active", true),
        supabase
          .from("vehicles")
          .select("id, name, passenger_capacity, status, is_active")
          .eq("is_active", true),
        supabase
          .from("tour_dates")
          .select("id, tour_id, date, available_slots, total_booked")
          .gte("date", today)
          .lte("date", until)
          .order("date"),
        supabase.from("bookings").select(SELECT_OPS).neq("status", "cancelled").limit(500),
      ]);

    if (bookingsRes.error) throw new Error(bookingsRes.error.message);
    const bookings = bookingsRes.data || [];
    const upcoming = bookings.filter((b) => {
      const d = (b.tour_dates as { date?: string } | null)?.date;
      return d && d >= today && d <= until;
    });
    const todayBookings = upcoming.filter(
      (b) => (b.tour_dates as { date?: string } | null)?.date === today,
    );

    const issues: Record<string, unknown>[] = [];
    for (const b of upcoming) {
      const date = (b.tour_dates as { date?: string } | null)?.date || null;
      if (!b.guide_id) {
        issues.push({
          type: "unassigned_guide",
          severity: date === today ? "critical" : "warning",
          booking_id: b.id,
          booking_ref: b.booking_ref || `RN-${b.id}`,
          tour_date: date,
          admin_url_path: `/bookings/${b.id}`,
        });
      }
      if (!b.vehicle_id) {
        issues.push({
          type: "unassigned_vehicle",
          severity: date === today ? "critical" : "warning",
          booking_id: b.id,
          booking_ref: b.booking_ref || `RN-${b.id}`,
          tour_date: date,
          admin_url_path: `/bookings/${b.id}`,
        });
      }
      if (
        (b.payment_status === "unpaid" || b.payment_status === "partial") &&
        (b.source === "direct_website" || b.source === "manual")
      ) {
        issues.push({
          type: "payment_issue",
          severity: date === today ? "critical" : "warning",
          booking_id: b.id,
          booking_ref: b.booking_ref || `RN-${b.id}`,
          tour_date: date,
          payment_status: b.payment_status,
          admin_url_path: `/bookings/${b.id}`,
        });
      }
    }

    const mapB = (b: Record<string, unknown>) => {
      const toursRel = b.tours as { public_name?: string; name?: string } | null;
      const datesRel = b.tour_dates as { date?: string } | null;
      const guidesRel = b.guides as { name?: string } | null;
      const vehiclesRel = b.vehicles as { name?: string } | null;
      return {
        external_id: String(b.id),
        booking_ref: b.booking_ref || `RN-${b.id}`,
        tour_date: datesRel?.date || null,
        tour_time: b.tour_time || null,
        product_id: b.tour_id,
        product_name: toursRel?.public_name || toursRel?.name || null,
        adults: Number(b.adults || 0),
        children: Number(b.children || 0),
        passengers: pax(b),
        booked_revenue_eur: Number(b.total_price || 0),
        status: b.status,
        payment_status: b.payment_status,
        source: b.source,
        pickup_location: b.pickup_location || null,
        guide_id: b.guide_id,
        guide_name: guidesRel?.name || null,
        vehicle_id: b.vehicle_id,
        vehicle_name: vehiclesRel?.name || null,
        unassigned_guide: !b.guide_id,
        unassigned_vehicle: !b.vehicle_id,
        admin_url: `${adminBase.replace(/\/$/, "")}/bookings/${b.id}`,
        updated_at: b.updated_at || b.created_at,
      };
    };

    const bookedRevenueUpcoming = upcoming.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const bookedRevenueToday = todayBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);

    return json(200, {
      ok: true,
      schema_version: 1,
      integration: "royal-nordic",
      mode: "read_only",
      generated_at: new Date().toISOString(),
      timezone: "Europe/Helsinki",
      today,
      horizon_days: horizon,
      latency_ms: Date.now() - started,
      summary: {
        bookings_today: todayBookings.length,
        bookings_upcoming: upcoming.length,
        passengers_today: todayBookings.reduce((s, b) => s + pax(b), 0),
        passengers_upcoming: upcoming.reduce((s, b) => s + pax(b), 0),
        booked_revenue_today_eur: Math.round(bookedRevenueToday * 100) / 100,
        booked_revenue_upcoming_eur: Math.round(bookedRevenueUpcoming * 100) / 100,
        unassigned_guide_count: issues.filter((i) => i.type === "unassigned_guide").length,
        unassigned_vehicle_count: issues.filter((i) => i.type === "unassigned_vehicle").length,
        capacity_conflict_count: (tourDates || []).filter(
          (td) => Number(td.total_booked || 0) > Number(td.available_slots || 0),
        ).length,
        payment_issue_count: issues.filter((i) => i.type === "payment_issue").length,
        critical_issue_count: issues.filter((i) => i.severity === "critical").length,
        active_products: (tours || []).filter((t) => t.is_active !== false).length,
        active_guides: (guides || []).length,
        active_vehicles: (vehicles || []).length,
      },
      revenue: {
        upcoming_gross_eur: Math.round(bookedRevenueUpcoming * 100) / 100,
        today_gross_eur: Math.round(bookedRevenueToday * 100) / 100,
        incomplete: false,
        note: "Gross booked totals from booking rows — not reconciled bank cash.",
      },
      today_tours: todayBookings.map(mapB),
      upcoming_bookings: upcoming.map(mapB),
      assignment_issues: issues,
      products: (tours || []).map((t) => ({
        id: t.id,
        name: t.name,
        public_name: t.public_name || t.name,
        max_capacity: t.max_capacity,
        is_active: t.is_active !== false,
      })),
      guides: guides || [],
      vehicles: vehicles || [],
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
        products: (tours || []).length,
        guides: (guides || []).length,
        vehicles: (vehicles || []).length,
        issues: issues.length,
      },
    });
  } catch (err) {
    console.error("[omega-operational-read]", err);
    return json(500, {
      ok: false,
      error: "internal_error",
      detail: "Failed to build operational summary",
      latency_ms: Date.now() - started,
    });
  }
});
