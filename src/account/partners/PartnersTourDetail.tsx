import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PartnersBookingRequestForm from './PartnersBookingRequestForm'
import {
  fetchPartnerTourDetail,
  formatPartnerNet,
  partnerTourImage,
  type PartnerTourDetail,
  type PartnerTourPricing,
} from './partnerTours'

export default function PartnersTourDetailPage() {
  const { tourId: tourIdParam } = useParams()
  const tourId = Number(tourIdParam)
  const [tour, setTour] = useState<PartnerTourDetail | null>(null)
  const [pricing, setPricing] = useState<PartnerTourPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Number.isFinite(tourId) || tourId <= 0) {
      setError('Tour not found.')
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await fetchPartnerTourDetail(tourId)
      if (cancelled) return
      if (!res.ok || !res.tour) {
        setError(res.error === 'tour_not_found' ? 'Tour not found.' : res.error || 'Could not load tour.')
        setTour(null)
        setPricing(null)
      } else {
        setTour(res.tour)
        setPricing(res.pricing || null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [tourId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rn-rewards-skel h-8 w-48" />
        <div className="rn-rewards-skel aspect-[16/9] w-full max-w-3xl" />
        <div className="rn-rewards-skel h-40 w-full max-w-2xl" />
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-sm text-red-200">
          {error || 'Tour not found.'}
        </p>
        <Link to="/partners/dashboard/tours" className="rn-btn-secondary min-h-[44px] inline-flex">
          ← Back to tours
        </Link>
      </div>
    )
  }

  const img = partnerTourImage(tour)
  const inclusions = (tour.included_items || []).filter((x) => x?.text)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          to="/partners/dashboard/tours"
          className="text-sm text-[var(--rn-text-muted)] transition hover:text-aurora-soft"
        >
          ← Tours
        </Link>
        <h2 className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.02em] text-white sm:text-[1.85rem]">
          {tour.title}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--rn-text-muted)]">
          {tour.duration_text ? <span>{tour.duration_text}</span> : null}
          {tour.group_size_text ? <span>· {tour.group_size_text}</span> : null}
          <span
            className={
              tour.availability_status === 'available' ? 'text-aurora-soft' : 'text-[var(--rn-text-dim)]'
            }
          >
            · {tour.availability_status === 'available' ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--rn-radius)] border border-[var(--rn-border)]">
        {img ? (
          <img src={img} alt="" className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] items-end bg-[radial-gradient(ellipse_at_30%_20%,rgba(15,143,99,0.35),transparent_55%),linear-gradient(160deg,#0c1410,#152019)] p-6">
            <span className="font-display text-white/70">Royal Nordic</span>
          </div>
        )}
      </div>

      <section className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
          Partner pricing
        </p>
        {pricing?.has_partner_price && pricing.partner_net_eur != null ? (
          <>
            <p className="mt-2 font-display text-2xl font-semibold text-aurora-soft">
              {formatPartnerNet(pricing.partner_net_eur)}
            </p>
            <p className="mt-1 text-sm text-[var(--rn-text-muted)]">
              Partner net rate (EUR) — assigned to your company. Not a public or assumed discount.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
            Contact Royal Nordic for pricing. No partner net rate is assigned for this tour yet.
          </p>
        )}
      </section>

      {(tour.tagline || tour.card_description || tour.full_description || tour.description) && (
        <section>
          <h3 className="font-display text-lg font-semibold text-white">About</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
            {tour.full_description || tour.card_description || tour.tagline || tour.description}
          </p>
        </section>
      )}

      {inclusions.length > 0 ? (
        <section>
          <h3 className="font-display text-lg font-semibold text-white">Inclusions</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rn-text-muted)]">
            {inclusions.map((item, i) => (
              <li key={item.id || i} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-aurora-soft" aria-hidden />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(tour.meeting_point || tour.pickup_info) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {tour.meeting_point ? (
            <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                Meeting point
              </p>
              <p className="mt-2 text-sm text-white/90">{tour.meeting_point}</p>
            </div>
          ) : null}
          {tour.pickup_info ? (
            <div className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                Pickup
              </p>
              <p className="mt-2 text-sm text-white/90">{tour.pickup_info}</p>
            </div>
          ) : null}
        </section>
      )}

      {pricing?.has_partner_price && pricing.partner_net_eur != null ? (
        <section className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.02] p-5 sm:p-6">
          <PartnersBookingRequestForm
            tourId={tour.id}
            unitNetEur={Number(pricing.partner_net_eur)}
            pickupHint={tour.pickup_info || tour.meeting_point}
          />
        </section>
      ) : (
        <section className="rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] px-5 py-8 text-center">
          <p className="font-display text-lg font-semibold text-white/90">Booking unavailable</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--rn-text-muted)]">
            Request booking requires an active partner net rate for this tour. Contact Royal Nordic
            for pricing.
          </p>
        </section>
      )}
    </div>
  )
}
