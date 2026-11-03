import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  PRIVATE_SANTA_SEASON_FIRST,
  PRIVATE_SANTA_SEASON_LAST,
  STANDARD_GROUP_DEPARTURE,
  STANDARD_GROUP_SEASON_END,
  STANDARD_GROUP_SEASON_START,
  STANDARD_GROUP_TOUR_ID,
  isDateInAbsoluteTourWindow,
  isDateInTourSeason,
  isPrivateSantaTour,
  isStandardGroupTour,
  perPersonSubtotal,
} from '../_shared/tourBookingRules.ts'
import {
  computeReferralDiscount,
  normalizeReferralCode,
  rewardsCreditCertRedemptionAllowed,
  rewardsDiscountsEnabledFromEnv,
  roundMoney,
} from '../_shared/referralDiscount.ts'

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

    // Validate required fields (amount may be 0 for 100% Royal Nordic Credit).
    if (amount === undefined || amount === null || amount === '' || !currency || !tour_name || !tour_date) {
      throw new Error('Missing required fields')
    }
    if (Number(amount) < 0 || !Number.isFinite(Number(amount))) {
      throw new Error('Invalid payment amount')
    }

    const tourId = parseInt(String(metadata?.tour_id || ''), 10)
    let pricingModel = String(metadata?.pricing_model || 'per_person')
    let dbAdultPrice: number | null = null
    let dbChildPrice: number | null = null
    let tourBadge: string | null = null
    if (tourId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
      if (isStandardGroupTour(tourId) && (!supabaseUrl || !supabaseServiceKey)) {
        throw new Error('Unable to verify tour')
      }
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const fullSelect =
          'id, name, is_active, adult_price, child_price, max_capacity, pricing_model, season_start, season_end, departure_time, meeting_point, badge'
        let tourResult = await supabase.from('tours').select(fullSelect).eq('id', tourId).maybeSingle()
        if (tourResult.error && /column|schema cache/i.test(tourResult.error.message || '')) {
          tourResult = await supabase
            .from('tours')
            .select('id, name, is_active, adult_price, child_price, max_capacity, pricing_model, badge')
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
        if ('badge' in tourRow && tourRow.badge != null) tourBadge = String(tourRow.badge)

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
          if (
            isPrivateSantaTour(tourId, tourRow.name) &&
            !isDateInAbsoluteTourWindow(dateIso, PRIVATE_SANTA_SEASON_FIRST, PRIVATE_SANTA_SEASON_LAST)
          ) {
            throw new Error('This date is outside the Private Santa Claus operating season')
          }

          const remaining = Number(dateRow.available_slots) - Number(dateRow.total_booked || 0)
          const requested = adults + children
          const cap = Number(tourRow.max_capacity || 0)
          const isPerVehicle = pricingModel === 'per_vehicle' || tourId === 9

          if (isPerVehicle) {
            if (remaining < 1) throw new Error('This departure is sold out')
            if (requested < 1 || (cap > 0 && requested > cap)) {
              throw new Error(`This experience accepts 1–${cap || 8} guests`)
            }
          } else if (standardGroup) {
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

    // Server-side discount validation (WINTER20 XOR referral — never stack).
    // Tour id 1 (Guaranteed NL) already has a catalogue sale — never stack WINTER20.
    // Per-vehicle products never take guest discounts.
    const PROMO_ENABLED = true
    const PROMO_CODE = 'WINTER20'
    const PROMO_PERCENT = 20
    const PROMO_EXCLUDED_TOUR_IDS = new Set([1, 9, STANDARD_GROUP_TOUR_ID, 11])
    const subtotal = Number(metadata?.subtotal)
    const claimedDiscount = Number(metadata?.discount || 0)
    const promoCode = String(metadata?.discount_code || '').trim().toUpperCase()
    const referralCodeRaw = normalizeReferralCode(String(metadata?.referral_code || ''))
    const discountType = String(metadata?.discount_type || '').trim().toLowerCase()
    const charged = Number(amount)
    const promoTourId = parseInt(String(metadata?.tour_id || ''), 10)
    const promoAllowed =
      pricingModel !== 'per_vehicle' && !PROMO_EXCLUDED_TOUR_IDS.has(promoTourId)
    const rewardsEnabled = rewardsDiscountsEnabledFromEnv()

    if (pricingModel === 'per_vehicle' && dbAdultPrice != null) {
      const expected = Math.round(dbAdultPrice * 100) / 100
      if (Math.abs(charged - expected) > 0.02 || Math.abs(subtotal - expected) > 0.02) {
        throw new Error('Payment amount does not match per-vehicle pricing')
      }
      if (claimedDiscount > 0.02 || discountType === 'referral') {
        throw new Error('Invalid discount code or discount amount')
      }
    } else if (Number.isFinite(subtotal) && subtotal >= 0) {
      let expectedDiscount = 0
      let resolvedReferralCode = ''
      let resolvedReferrerId = ''

      const referralIntent =
        Boolean(referralCodeRaw) &&
        (discountType === 'referral' || (!promoCode && (claimedDiscount > 0.02 || rewardsEnabled)))

      if (referralIntent) {
        if (!rewardsEnabled) {
          throw new Error('Referral discounts are not active yet')
        } else {
          const supabaseUrl = Deno.env.get('SUPABASE_URL')
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Unable to verify referral code')
          }
          const supabase = createClient(supabaseUrl, supabaseServiceKey)
          const { data: resolved, error: resolveError } = await supabase.rpc(
            'resolve_referral_code_for_checkout',
            {
              p_code: referralCodeRaw,
              p_tour_id: promoTourId || null,
              p_customer_email: String(metadata?.customer_email || ''),
            },
          )
          if (resolveError) {
            console.error('Referral resolve failed:', resolveError)
            throw new Error('Unable to verify referral code')
          }
          const ok = Boolean(resolved?.ok)
          if (!ok) {
            const err = String(resolved?.error || 'invalid')
            if (err === 'self_referral') throw new Error('You cannot use your own referral code')
            throw new Error('Invalid referral code')
          }
          const tourEligible = Boolean(resolved?.eligible)
          const priced = computeReferralDiscount({
            subtotal,
            tourId: promoTourId,
            pricingModel,
            referralCode: referralCodeRaw,
            promoCode,
            discountsEnabled: true,
            codeValid: true,
            tourEligible,
            percent: Number(resolved?.discount_percent) || 10,
          })
          if (priced.error) throw new Error(priced.error)
          expectedDiscount = priced.discount
          resolvedReferralCode = String(resolved?.normalized || referralCodeRaw)
          resolvedReferrerId = String(resolved?.referrer_user_id || '')
          if (metadata) {
            metadata.referral_code = resolvedReferralCode
            metadata.referrer_user_id = resolvedReferrerId
            metadata.discount_type = 'referral'
            metadata.discount_code = ''
          }
        }
      } else if (PROMO_ENABLED && promoAllowed && promoCode === PROMO_CODE) {
        if (referralCodeRaw) {
          throw new Error('Referral and promotional discounts cannot be combined')
        }
        expectedDiscount = roundMoney(subtotal * (PROMO_PERCENT / 100))
        if (metadata) metadata.discount_type = 'winter_promo'
      } else if (promoCode && claimedDiscount > 0.02) {
        throw new Error('Invalid discount code or discount amount')
      } else if (referralCodeRaw && claimedDiscount > 0.02) {
        throw new Error('Referral discounts are not active yet')
      }

      const expectedTotal = roundMoney(subtotal - expectedDiscount)
      if (Math.abs(claimedDiscount - expectedDiscount) > 0.02) {
        throw new Error('Invalid discount code or discount amount')
      }

      const creditRequestedCents = Math.max(
        0,
        Math.round(Number(metadata?.credit_cents || metadata?.reward_credit_cents || 0)),
      )
      let creditAppliedCents = 0
      let redemptionId: string | null = null
      let cashCharge = expectedTotal

      if (creditRequestedCents > 0) {
        const authHeader = req.headers.get('Authorization') || ''
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!supabaseUrl || !supabaseServiceKey) {
          throw new Error('Unable to verify Royal Nordic Credit')
        }
        if (!authHeader.toLowerCase().startsWith('bearer ')) {
          throw new Error('Sign in to use Royal Nordic Credit')
        }

        const userClient = createClient(supabaseUrl, supabaseAnon || supabaseServiceKey, {
          global: { headers: { Authorization: authHeader } },
        })
        const { data: userData, error: userError } = await userClient.auth.getUser()
        if (userError || !userData?.user?.id) {
          throw new Error('Sign in to use Royal Nordic Credit')
        }
        const userId = userData.user.id
        const specialRequests = String(metadata?.special_requests || metadata?.notes || '')
        const creditAllowed = rewardsCreditCertRedemptionAllowed({
          userId,
          tourBadge,
          specialRequests,
        })
        if (!creditAllowed) {
          throw new Error('Royal Nordic Credit redemption is not active yet')
        }
        // Public flag stays OFF for normal customers; cert path is allowlisted + INTERNAL_CERT only.
        const payableCents = Math.round(expectedTotal * 100)
        const idemRaw =
          String(metadata?.credit_idempotency_key || '').trim() ||
          `checkout:${userId}:${metadata?.tour_date_id || ''}:${payableCents}:${creditRequestedCents}`
        const admin = createClient(supabaseUrl, supabaseServiceKey)
        await admin.rpc('release_expired_referral_credit_reservations', { p_limit: 50 })

        const { data: reserved, error: reserveError } = await admin.rpc(
          'reserve_referral_credit_for_checkout',
          {
            p_user_id: userId,
            p_amount_cents: creditRequestedCents,
            p_payable_cents: payableCents,
            p_idempotency_key: idemRaw.slice(0, 160),
            p_booking_id: null,
            p_ttl_minutes: 120,
          },
        )
        if (reserveError) {
          console.error('credit reserve failed', reserveError)
          throw new Error('Unable to reserve Royal Nordic Credit')
        }
        if (!reserved?.ok) {
          if (String(reserved?.error || '') === 'insufficient_credit') {
            throw new Error('Insufficient Royal Nordic Credit')
          }
          throw new Error('Unable to reserve Royal Nordic Credit')
        }
        creditAppliedCents = Number(reserved.amount_cents) || 0
        redemptionId = String(reserved.id)
        cashCharge = roundMoney(expectedTotal - creditAppliedCents / 100)
        if (metadata) {
          metadata.credit_cents = String(creditAppliedCents)
          metadata.credit_redemption_id = redemptionId
          metadata.credit_user_id = userId
          metadata.payable_total = String(expectedTotal)
          metadata.cash_paid = String(cashCharge)
          metadata.cash_paid_cents = String(Math.round(cashCharge * 100))
          metadata.total_price = String(expectedTotal)
        }
      } else if (metadata) {
        metadata.credit_cents = '0'
        metadata.cash_paid = String(expectedTotal)
        metadata.cash_paid_cents = String(Math.round(expectedTotal * 100))
        metadata.payable_total = String(expectedTotal)
      }

      if (Math.abs(charged - cashCharge) > 0.02) {
        if (redemptionId) {
          const admin = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          )
          await admin.rpc('release_referral_credit_for_checkout', {
            p_redemption_id: redemptionId,
            p_stripe_checkout_session_id: null,
            p_reason: 'amount_mismatch',
          })
        }
        throw new Error('Payment amount does not match pricing rules')
      }

      if (cashCharge <= 0.009 && creditAppliedCents > 0 && redemptionId) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        const { data: confirmed, error: confirmError } = await admin.rpc(
          'confirm_fully_credit_funded_booking',
          {
            p_user_id: String(metadata.credit_user_id),
            p_redemption_id: redemptionId,
            p_tour_id: parseInt(String(metadata.tour_id || ''), 10),
            p_tour_date_id: parseInt(String(metadata.tour_date_id || ''), 10),
            p_customer_name: String(metadata.customer_name || ''),
            p_customer_email: String(metadata.customer_email || ''),
            p_customer_phone: String(metadata.phone || ''),
            p_adults: parseInt(String(metadata.adults || '0'), 10),
            p_children: parseInt(String(metadata.children || '0'), 10),
            p_total_price_cents: Math.round(expectedTotal * 100),
            p_special_requests: String(metadata.special_requests || ''),
            p_tour_time: metadata.tour_time ? String(metadata.tour_time) : null,
            p_pickup_location: metadata.pickup_location
              ? String(metadata.pickup_location)
              : metadata.meeting_point
                ? String(metadata.meeting_point)
                : null,
            p_referral_code: String(metadata.referral_code || '') || null,
            p_referrer_user_id: metadata.referrer_user_id || null,
            p_referral_discount_cents: Math.round(Number(metadata.discount || 0) * 100),
            p_guest_subtotal_cents: Math.round(Number(metadata.subtotal || expectedTotal) * 100),
            p_cash_paid_cents: 0,
          },
        )
        if (confirmError || !confirmed?.ok) {
          console.error('credit-only booking failed', confirmError, confirmed)
          await admin.rpc('release_referral_credit_for_checkout', {
            p_redemption_id: redemptionId,
            p_stripe_checkout_session_id: null,
            p_reason: 'credit_only_failed',
          })
          throw new Error(
            String(confirmed?.error || confirmError?.message || 'Could not complete credit booking'),
          )
        }
        return new Response(
          JSON.stringify({
            creditOnly: true,
            bookingId: confirmed.booking_id,
            bookingRef: confirmed.booking_ref,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
        )
      }

      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
      const cancelPath = safeReturnPath(cancel_path, '/')
      const cancelUrl = `${SITE_ORIGIN}${cancelPath}`
      if (cashCharge <= 0) {
        throw new Error('Payment amount does not match pricing rules')
      }

      const session = await stripe.createCheckoutSession({
        payment_method_types: ['card', 'klarna', 'bancontact', 'eps'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: tour_name,
                description: `Tour on ${tour_date}`,
              },
              unit_amount: Math.round(cashCharge * 100),
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
        phone_number_collection: { enabled: true },
      })

      if (redemptionId) {
        const admin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        )
        await admin.rpc('attach_referral_credit_checkout_session', {
          p_redemption_id: redemptionId,
          p_stripe_checkout_session_id: session.id,
          p_cash_charge_cents: Math.round(cashCharge * 100),
        })
      }

      return new Response(JSON.stringify({ sessionId: session.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Per-vehicle / paths without subtotal-based discounting — no credit apply.
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    })

    const cancelPath = safeReturnPath(cancel_path, '/')
    const cancelUrl = `${SITE_ORIGIN}${cancelPath}`

    const session = await stripe.createCheckoutSession({
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
            unit_amount: Math.round(charged * 100),
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
