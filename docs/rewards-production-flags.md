# Royal Nordic Rewards — production flags & rollback

Public Rewards earning/redemption stays **OFF** until an explicit launch decision.
Do not enable global credit redemption without an additional protective restriction.

## Four production flags

| Flag | Where | Default | Purpose |
|------|--------|---------|---------|
| `REWARDS_DISCOUNTS_ENABLED` | Supabase Edge secret | unset / false | Guest 10% referral discount at checkout API |
| `VITE_REWARDS_DISCOUNTS_ENABLED` | Vercel / build env | unset / false | Checkout UI surfaces for referral discount |
| `REWARDS_CREDIT_REDEMPTION_ENABLED` | Supabase Edge secret | unset / false | Royal Nordic Credit apply/reserve at checkout API |
| `VITE_REWARDS_CREDIT_REDEMPTION_ENABLED` | Vercel / build env | unset / false | Checkout UI for applying credit |

### Dependencies

1. **Guest discount live path** requires both edge + Vite discount flags `true`, plus eligible tour (ids 8/10), valid code, XOR vs WINTER20.
2. **Credit redemption live path** requires both credit flags `true`, signed-in user, available credit balance, and successful reserve before Stripe / zero-pay confirm.
3. **Credit maturity** does **not** depend on these flags. Cron `mature-referral-credits` (pg_cron → `run_referral_credit_maintenance`) runs regardless so pending credit can become available after tour end.
4. **Scoped LIVE certification** (Phase 3.3): optional edge secret `REWARDS_CREDIT_CERT_USER_IDS` (comma-separated UUIDs). Allows credit **only** for listed users on tours with badge exactly `INTERNAL_CERT`. Special-request tags alone never unlock credit on public tours. Does **not** enable public redemption. Keep public credit flags OFF while using this.

### Enable (launch only — separate approval)

```bash
# Edge (immediate for API)
npx supabase secrets set REWARDS_DISCOUNTS_ENABLED=true --yes
npx supabase secrets set REWARDS_CREDIT_REDEMPTION_ENABLED=true --yes

# Frontend (requires Vercel rebuild/deploy)
# Set in Vercel project env, then redeploy:
#   VITE_REWARDS_DISCOUNTS_ENABLED=true
#   VITE_REWARDS_CREDIT_REDEMPTION_ENABLED=true
```

### Rollback (seconds for edge; rebuild for UI)

```bash
npx supabase secrets unset REWARDS_DISCOUNTS_ENABLED --yes
npx supabase secrets unset REWARDS_CREDIT_REDEMPTION_ENABLED --yes
# Optionally clear cert allowlist:
npx supabase secrets unset REWARDS_CREDIT_CERT_USER_IDS --yes
```

Unset Vite flags in Vercel and redeploy if UI must hide controls immediately after a bad launch.
Edge unset alone blocks new discounted / credit checkouts even if an old SPA build still shows inputs.

### Maturity cron

- Job name: `mature-referral-credits`
- Schedule: every 15 minutes (`*/15 * * * *`)
- Body: `SELECT public.run_referral_credit_maintenance(200);`
- Logs: `referral_credit_job_runs` (`ok`, `result`, `error`)
- Safety: `FOR UPDATE SKIP LOCKED` + ledger idempotency `mature:{earning_id}` — duplicate cron ticks cannot double-credit
- Also releases expired credit reservations

Manual trigger (service role):

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/mature-referral-credits" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit":100}'
```

### Messaging

Landing / SEO: **Give 10% off. Earn 10% credit.** Credit toward future Royal Nordic bookings — not cash. No cash payout / withdrawal promises.
