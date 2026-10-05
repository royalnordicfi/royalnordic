# Product truth — Guaranteed Northern Lights Tour

## Operational source of truth

Commercial content (prices, sale, copy, highlights, inclusions, photos, FAQ, SEO) is managed in **Royal Nordic Admin → Tours** and stored on `public.tours` (migration `025_tour_cms.sql`).

Checkout always charges `tours.adult_price` (and child_price). Historical bookings keep the amount paid at booking time.

## Fallback constants (prerender / offline)

`src/seo/guaranteedNorthernLightsTour.ts` holds fallback catalog values used when CMS data is unavailable or for static prerender:

- Current adult price: €99 (`GUARANTEED_NL_CATALOG_ADULT_PRICE`)
- Reference price: €129 (`GUARANTEED_NL_REFERENCE_ADULT_PRICE`)

## Guarantee

If the Northern Lights cannot be captured by our professional DSLR cameras during the tour, the customer receives a **100% refund**.

If the Aurora is captured in our photographs, the tour is considered successful even if it appears faint to the naked eye.

## Photography

Royal Nordic / the guide **takes professional photos of the customers with the Northern Lights** (included).

## Apply migration

```bash
# via Supabase CLI or dashboard SQL
supabase db push
# or run supabase/migrations/025_tour_cms.sql
```

After migration, edit tour id 1 in Admin — do not hardcode commercial changes in React for normal operations.
