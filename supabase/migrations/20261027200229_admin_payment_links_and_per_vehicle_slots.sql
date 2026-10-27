-- Admin payment-link metadata + correct inventory accounting for per_vehicle products.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_link_url text,
  ADD COLUMN IF NOT EXISTS payment_link_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_checkout_session
  ON public.bookings (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Per-vehicle / private products consume 1 exclusive allocation, not guest count.
CREATE OR REPLACE FUNCTION public.update_tour_date_slots()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  pricing text;
  delta integer;
  old_delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT pricing_model INTO pricing FROM public.tours WHERE id = NEW.tour_id;
    delta := CASE WHEN pricing = 'per_vehicle' THEN 1 ELSE COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) END;
    UPDATE public.tour_dates
      SET total_booked = total_booked + delta
    WHERE id = NEW.tour_date_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      SELECT pricing_model INTO pricing FROM public.tours WHERE id = COALESCE(NEW.tour_id, OLD.tour_id);
      old_delta := CASE WHEN pricing = 'per_vehicle' THEN 1 ELSE COALESCE(OLD.adults, 0) + COALESCE(OLD.children, 0) END;
      delta := CASE WHEN pricing = 'per_vehicle' THEN 1 ELSE COALESCE(NEW.adults, 0) + COALESCE(NEW.children, 0) END;
      IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
        UPDATE public.tour_dates
          SET total_booked = GREATEST(0, total_booked - old_delta)
        WHERE id = OLD.tour_date_id;
      ELSIF OLD.status = 'cancelled' AND NEW.status IS DISTINCT FROM 'cancelled' THEN
        UPDATE public.tour_dates
          SET total_booked = total_booked + delta
        WHERE id = NEW.tour_date_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT pricing_model INTO pricing FROM public.tours WHERE id = OLD.tour_id;
    old_delta := CASE WHEN pricing = 'per_vehicle' THEN 1 ELSE COALESCE(OLD.adults, 0) + COALESCE(OLD.children, 0) END;
    UPDATE public.tour_dates
      SET total_booked = GREATEST(0, total_booked - old_delta)
    WHERE id = OLD.tour_date_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
