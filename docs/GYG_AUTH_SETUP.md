# GetYourGuide inbound Basic Auth — secure setup

Gateway: `https://royalnordic.fi/api/gyg/`  
Edge: `shared-bookings-external` on Supabase project `itihdgqgvlphtyidnvkt`

## Secret names (values never in git / Vercel / browser)

| Secret | Direction | Purpose |
|--------|-----------|---------|
| `SHARED_BOOKINGS_GYG_BASIC_USER` | GYG → Royal Nordic | Username **you** create and register in Integrator Portal |
| `SHARED_BOOKINGS_GYG_BASIC_PASSWORD` | GYG → Royal Nordic | Password **you** create and register in Integrator Portal |
| `SHARED_BOOKINGS_GYG_INGESTION_ENABLED` | flag | Keep `false` until live booking writes are approved |
| `SHARED_BOOKINGS_GYG_NOTIFY_USER` | Royal Nordic → GYG | From Integrator Portal → Set Up Your Testing Configuration |
| `SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD` | Royal Nordic → GYG | Same |
| `SHARED_BOOKINGS_GYG_NOTIFY_ENABLED` | flag | Keep `false` until outbound notify is approved |

## Operator procedure (inbound)

1. Generate a strong username + password in a password manager (do not reuse site passwords).
2. Set secrets on the production Supabase project only (CLI or Dashboard → Edge Functions → Secrets):

```bash
supabase secrets set \
  SHARED_BOOKINGS_GYG_BASIC_USER='…' \
  SHARED_BOOKINGS_GYG_BASIC_PASSWORD='…' \
  --project-ref itihdgqgvlphtyidnvkt
```

3. Confirm flags remain off:

```bash
supabase secrets set \
  SHARED_BOOKINGS_GYG_INGESTION_ENABLED=false \
  SHARED_BOOKINGS_GYG_NOTIFY_ENABLED=false \
  --project-ref itihdgqgvlphtyidnvkt
```

4. Enter the **same** inbound username/password in GetYourGuide Integrator Portal (test, then production when approved).
5. Verify: `GET https://royalnordic.fi/api/gyg/status` shows `credentials_configured: true` and `ingestion_env_enabled: false`.
6. Verify wrong password returns GYG `AUTHORIZATION_FAILURE` (HTTP 200 application error, no secret material in body).

## Outbound notify credentials

Copy from Integrator Portal → **Set Up Your Testing Configuration** (bottom). Set `SHARED_BOOKINGS_GYG_NOTIFY_USER` / `PASSWORD`. Leave `SHARED_BOOKINGS_GYG_NOTIFY_ENABLED=false` until separate approval.

## Rules

- Never commit, paste into chat, or put Basic Auth secrets in Vercel / `VITE_*` / frontend.
- Authentication is enforced in the Edge function against Supabase secrets; the Vercel gateway only rejects missing `Authorization` headers and proxies the rest.
- Do not enable ingestion or notify without explicit approval.
