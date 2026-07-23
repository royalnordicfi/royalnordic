# OMEGA read-only integration (Royal Nordic)

## Purpose

Secure server-to-server read API so OMEGA can see today's tours, upcoming bookings,
assignment issues, and booked revenue — without write access and without customer email/phone/name.

## Endpoints

### Preferred (Vercel, after deploy)

`GET https://admin.royalnordic.fi/api/omega/v1/operational-summary?horizon_days=14`

### Fallback (Supabase Edge Function)

`GET https://itihdgqgvlphtyidnvkt.supabase.co/functions/v1/omega-operational-read?horizon_days=14`

## Auth

```
Authorization: Bearer <OMEGA_API_KEY>
```

or

```
x-omega-api-key: <OMEGA_API_KEY>
```

## Royal Nordic environment (Vercel project `royalnordic`)

| Variable | Required | Notes |
|---|---|---|
| `OMEGA_API_KEY` | yes | Shared secret with OMEGA (`ROYAL_NORDIC_API_KEY`) |
| `SUPABASE_URL` | yes | `https://itihdgqgvlphtyidnvkt.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only; never expose to browser |
| `ADMIN_PUBLIC_URL` | optional | Default `https://admin.royalnordic.fi` |

Edge function secret:

```bash
npx supabase secrets set OMEGA_API_KEY=... --project-ref itihdgqgvlphtyidnvkt
npx supabase functions deploy omega-operational-read --project-ref itihdgqgvlphtyidnvkt
```

## OMEGA environment

| Variable | Required | Notes |
|---|---|---|
| `ROYAL_NORDIC_ADMIN_URL` | yes | `https://admin.royalnordic.fi` (deep links) |
| `ROYAL_NORDIC_API_KEY` | yes | Same value as RN `OMEGA_API_KEY` |
| `ROYAL_NORDIC_API_URL` | optional | Full summary URL; defaults try admin `/api/omega/...` then edge function |

## Security

- Read-only queries only
- No customer email / phone / name / internal notes in payload
- API key compared with timing-safe equality on Vercel handler
- Unauthorized → 401
- Missing config → 503
- Failures do not write to Royal Nordic

## Response (abridged)

```json
{
  "ok": true,
  "schema_version": 1,
  "generated_at": "...",
  "today": "2026-07-23",
  "summary": { "bookings_today": 2, "critical_issue_count": 1 },
  "today_tours": [],
  "upcoming_bookings": [],
  "assignment_issues": [],
  "products": [],
  "revenue": { "upcoming_gross_eur": 0, "incomplete": false }
}
```
