-- Admin Ops Hub winter: email tracking, soft-delete, ops notes, guide languages
-- Requires 015 (is_admin) and 016 (guides/vehicles/customers/booking_events).
-- Idempotent.

-- ---------- BOOKINGS: soft delete + email status ----------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS email_status TEXT NOT NULL DEFAULT 'not_sent';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS email_last_sent_at TIMESTAMPTZ;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS email_last_error TEXT;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_email_status_check;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_email_status_check
  CHECK (email_status IN ('not_sent', 'queued', 'sent', 'failed'));

CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON public.bookings(deleted_at);
CREATE INDEX IF NOT EXISTS idx_bookings_email_status ON public.bookings(email_status);

-- ---------- BOOKING EMAIL LOG (honest delivery attempts) ----------
CREATE TABLE IF NOT EXISTS public.booking_emails (
  id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL DEFAULT 'customer_confirmation',
  to_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_emails_booking_id ON public.booking_emails(booking_id);

ALTER TABLE public.booking_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking_emails_admin_all" ON public.booking_emails;
CREATE POLICY "booking_emails_admin_all" ON public.booking_emails
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- GUIDES: languages ----------
ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS languages TEXT;

-- ---------- OPS NOTES (operational tasks, not project management) ----------
CREATE TABLE IF NOT EXISTS public.ops_notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date DATE,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'done', 'archived')),
  related_booking_id BIGINT REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ops_notes_status ON public.ops_notes(status);
CREATE INDEX IF NOT EXISTS idx_ops_notes_due_date ON public.ops_notes(due_date);

ALTER TABLE public.ops_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ops_notes_admin_all" ON public.ops_notes;
CREATE POLICY "ops_notes_admin_all" ON public.ops_notes
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
