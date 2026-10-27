import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  STANDARD_GROUP_DEPARTURE,
  STANDARD_GROUP_SEASON_END,
  STANDARD_GROUP_SEASON_START,
  STANDARD_GROUP_TOUR_ID,
  isDateInTourSeason,
  isStandardGroupTour,
  perPersonSubtotal,
} from '../_shared/tourBookingRules.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_ORIGIN = (Deno.env.get('SITE_URL') || 'https://royalnordic.fi').replace(/\/$/, '')

/** Only allow same-site relative paths (blocks open redirects). */
function safeReturnPath(raw: unknown, fallback: string): string {
  const path = String(raw ?? '').trim()
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  if (path.includes('://') || /[\s<>"']/.test(path)) return fallback
  if (path.length > 240) return fallback
  return path
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not configured')
    }

    // Parse request body
    const { amount, currency, tour_name, tour_date, metadata, cancel_path } = await req.json()

    // Validate required fields
    if (!amount || !currency || !tour_name || !tour_date) {
      throw new Error('Missing required fields')
    }

    const tourId = parseInt(String(metadata?.tour_id || ''), 10)
    let pricingModel = String(metadata?.pricing_model || 'per_person')
    let dbAdultPrice: number | null = null
    let dbChildPrice: number | null = null
    if (tourId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (isStandardGroupTour(tourId) && (!supabaseUrl || !supabaseServiceKey)) {
        throw new Error('Unable to verify tour')
      }
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const fullSelect =
          'id, name, is_active, adult_price, child_price, max_capacity, pricing_model, season_start, season_end, departure_time, meeting_point'
        let tourResult = await supabase.from('tours').select(fullSelect).eq('id', tourId).maybeSingle()
        if (tourResult.error && /column|schema cache/i.test(tourResult.error.message || '')) {
          tourResult = await supabase
            .from('tours')
            .select('id, name, is_active, adult_price, child_price, max_capacity, pricing_model')
            .eq('id', tourId)
            .maybeSingle()
        }
        if (tourResult.error && /column|schema cache/i.test(tourResult.error.message || '')) {
          tourResult = await supabase
            .from('tours')
            .select('id, name, is_active, adult_price, child_price, max_capacity')
            .eq('id', tourId)
            .maybeSingle()
        }
        const { data: tourRow, error: tourError } = tourResult
        if (tourError) {
          console.error('Tour lookup failed:', tourError)
          throw new Error('Unable to verify tour')
        }
        if (!tourRow || tourRow.is_active === false) {
          throw new Error('This experience is no longer available for booking')
        }
        if (tourRow.pricing_model) pricingModel = String(tourRow.pricing_model)
        if (tourRow.adult_price != null) dbAdultPrice = Number(tourRow.adult_price)
        if (tourRow.child_price != null) dbChildPrice = Number(tourRow.child_price)

        const tourDateId = parseInt(String(metadata?.tour_date_id || ''), 10)
        const adults = parseInt(String(metadata?.adults || '0'), 10)
        const children = parseInt(String(metadata?.children || '0'), 10)
        const standardGroup = isStandardGroupTour(tourId, tourRow.name)

        if (tourDateId) {
          const { data: dateRow, error: dateError } = await supabase
            .from('tour_dates')
            .select('id, tour_id, date, available_slots, total_booked')
            .eq('id', tourDateId)
            .maybeSingle()
          if (dateError || !dateRow || Number(dateRow.tour_id) !== tourId) {
            throw new Error('This date is not available for this tour')
          }

          const seasonStart = tourRow.season_start || (standardGroup ? STANDARD_GROUP_SEASON_START : null)
          const seasonEnd = tourRow.season_end || (standardGroup ? STANDARD_GROUP_SEASON_END : null)
          const dateIso = String(dateRow.date).slice(0, 10)
          if (!isDateInTourSeason(dateIso, seasonStart, seasonEnd)) {
            throw new Error('This date is outside the operating season')
          }

          if (standardGroup) {
            const remaining = Number(dateRow.available_slots) - Number(dateRow.total_booked || 0)
            const requested = adults + children
            const cap = Number(tourRow.max_capacity || 0)
            if (requested < 1 || requested > remaining || (cap > 0 && requested > cap)) {
              throw new Error(
                remaining > 0
                  ? `Only ${Math.min(remaining, cap || remaining)} places left on this departure`
                  : 'This departure is sold out',
              )
            }
            if (dbAdultPrice == null || dbChildPrice == null) {
              throw new Error('Unable to verify tour')
            }
            const expected = perPersonSubtotal(adults, children, dbAdultPrice, dbChildPrice)
            if (!Number.isFinite(Number(metadata?.subtotal)) || Math.abs(Number(metadata.subtotal) - expected) > 0.02) {
              throw new Error('Payment amount does not match pricing rules')
            }
          }
        } else if (standardGroup) {
          throw new Error('Choose an available departure date')
        }

        if (standardGroup && metadata) {
          metadata.tour_time = tourRow.departure_time || STANDARD_GROUP_DEPARTURE
          if (tourRow.meeting_point) metadata.meeting_point = `Meeting point: ${tourRow.meeting_point}`
        }
      }
    }

    // Server-side promo validation (must match src/config/winterPromotion.ts)
    // Tour id 1 (Guaranteed NL) already has a catalogue sale — never stack WINTER20.
    // Per-vehicle transfers never take WINTER20.
    const PROMO_ENABLED = true
    const PROMO_CODE = 'WINTER20'
    const PROMO_PERCENT = 20
    const PROMO_EXCLUDED_TOUR_IDS = new Set([1, 9, STANDARD_GROUP_TOUR_ID])
    const subtotal = Number(metadata?.subtotal)
    const claimedDiscount = Number(metadata?.discount || 0)
    const code = String(metadata?.discount_code || '').trim().toUpperCase()
    const charged = Number(amount)
    const promoTourId = parseInt(String(metadata?.tour_id || ''), 10)
    const promoAllowed =
      pricingModel !== 'per_vehicle' && !PROMO_EXCLUDED_TOUR_IDS.has(promoTourId)

    if (pricingModel === 'per_vehicle' && dbAdultPrice != null) {
      const expected = Math.round(dbAdultPrice * 100) / 100
      if (Math.abs(charged - expected) > 0.02 || Math.abs(subtotal - expected) > 0.02) {
        throw new Error('Payment amount does not match per-vehicle pricing')
      }
      if (claimedDiscount > 0.02) {
        throw new Error('Invalid discount code or discount amount')
      }
    } else if (Number.isFinite(subtotal) && subtotal >= 0) {
      const expectedDiscount =
        PROMO_ENABLED && promoAllowed && code === PROMO_CODE
          ? Math.round(subtotal * (PROMO_PERCENT / 100) * 100) / 100
          : 0
      const expectedTotal = Math.round((subtotal - expectedDiscount) * 100) / 100
      if (Math.abs(claimedDiscount - expectedDiscount) > 0.02) {
        throw new Error('Invalid discount code or discount amount')
      }
      if (Math.abs(charged - expectedTotal) > 0.02) {
        throw new Error('Payment amount does not match pricing rules')
      }
    }

    // Create Stripe Checkout Session
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const cancelPath = safeReturnPath(cancel_path, '/')
    const cancelUrl = `${SITE_ORIGIN}${cancelPath}`

    const session = await stripe.createCheckoutSession({
      // Methods active on the current Stripe account (acct_1Sx7hXCFu64j1T1g).
      payment_method_types: [
        'card',
        'klarna',
        'bancontact',
        'eps',
      ],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: tour_name,
              description: `Tour on ${tour_date}`,
            },
            unit_amount: Math.round(charged * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${SITE_ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: metadata,
      customer_email: metadata.customer_email,
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

// Stripe class for Deno
class Stripe {
  private secretKey: string
  private baseURL = 'https://api.stripe.com/v1'

  constructor(secretKey: string) {
    this.secretKey = secretKey
  }

  async createCheckoutSession(params: any) {
    const body = new URLSearchParams({
      'line_items[0][price_data][currency]': params.line_items[0].price_data.currency,
      'line_items[0][price_data][product_data][name]': params.line_items[0].price_data.product_data.name,
      'line_items[0][price_data][product_data][description]': params.line_items[0].price_data.product_data.description,
      'line_items[0][price_data][unit_amount]': params.line_items[0].price_data.unit_amount.toString(),
      'line_items[0][quantity]': params.line_items[0].quantity.toString(),
      'mode': params.mode,
      'success_url': params.success_url,
      'cancel_url': params.cancel_url,
      'customer_email': params.customer_email,
      'billing_address_collection': params.billing_address_collection,
      'phone_number_collection[enabled]': params.phone_number_collection.enabled.toString(),
      ...Object.fromEntries(
        Object.entries(params.metadata).map(([key, value]) => [`metadata[${key}]`, String(value ?? '')])
      ),
    })

    // Stripe expects repeated keys, not a comma-joined value.
    for (const type of params.payment_method_types) {
      body.append('payment_method_types[]', type)
    }

    const response = await fetch(`${this.baseURL}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe API error: ${error}`)
    }

    return response.json()
  }
}
