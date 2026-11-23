# Google Calendar + admin reminders — activation

Production sync and reminder emails stay **off** until both layers are enabled.

## 1. Apply database migration

```bash
supabase db push
# or apply supabase/migrations/20261123180000_google_calendar_sync.sql in SQL editor
```

## 2. Deploy edge functions

```bash
supabase functions deploy google-calendar-oauth
supabase functions deploy process-calendar-sync
supabase functions deploy process-booking-reminders
supabase functions deploy stripe-webhook   # enqueue hooks
```

## 3. Configure Google Cloud

1. Create/select a GCP project.
2. Enable **Google Calendar API**.
3. Configure OAuth consent screen (Internal for Workspace, or External + test users).
4. Create OAuth **Web** client.
5. Authorized redirect URI (must match secret):
   - `https://admin.royalnordic.fi/integrations?google=callback`
6. Create a dedicated Google Calendar for Royal Nordic ops (share only with authorized ops accounts).

## 4. Set Supabase Edge secrets

Generate a 32-byte key:

```bash
openssl rand -base64 32
```

```bash
supabase secrets set \
  GOOGLE_CLIENT_ID=... \
  GOOGLE_CLIENT_SECRET=... \
  GOOGLE_TOKEN_ENCRYPTION_KEY=... \
  GOOGLE_OAUTH_REDIRECT_URI='https://admin.royalnordic.fi/integrations?google=callback' \
  GOOGLE_CALENDAR_SYNC_ENABLED=false \
  GOOGLE_CALENDAR_REMINDERS_ENABLED=false
```

Keep both `*_ENABLED` flags **false** until verification is complete.

## 5. Connect in Admin

1. Open `https://admin.royalnordic.fi/integrations`
2. **Connect Google** with the ops account that owns/accesses the dedicated calendar.
3. Set **Calendar ID** (`primary` or the calendar’s ID from “List calendars”).
4. Set **Admin reminder email**.
5. Run **Dry-run upcoming bookings** — confirm which rows are ready vs `needs_departure_time`.
6. Optionally **Enqueue sync** (queues only; workers still no-op while env flags are false).

## 6. Verification (still no production sends)

- Create/update/cancel a test booking → `calendar_sync_outbox` / `booking_reminder_outbox` rows appear.
- Confirm checkout still succeeds if Google is disconnected.
- Unit tests: `npx tsx --test src/lib/googleCalendarDeparture.test.ts`

## 7. Activate production (explicit approval required)

Only after dry-run review:

```bash
supabase secrets set \
  GOOGLE_CALENDAR_SYNC_ENABLED=true \
  GOOGLE_CALENDAR_REMINDERS_ENABLED=true
```

Then in Admin → Integrations:

1. Enable **calendar sync (DB)**
2. Enable **admin reminders (DB)**
3. Enqueue upcoming sync if desired
4. Confirm one real event appears on the dedicated calendar
5. Confirm reminder emails only after a near-window test booking (or wait for a real 6h/10h/24h window)

## Kill switch

- Untick DB toggles, or set env flags back to `false`, or **Disconnect Google**.
- Cancelled / soft-deleted bookings enqueue `delete` and cancel pending reminders.
