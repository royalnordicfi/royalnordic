-- Prevent duplicate bookings for the same Stripe PaymentIntent
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_id
  ON public.bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL
    AND btrim(stripe_payment_intent_id) <> '';

-- Backfill refs for webhook bookings that landed without booking_ref
UPDATE public.bookings
SET booking_ref = 'RN-' || id::text
WHERE booking_ref IS NULL;
