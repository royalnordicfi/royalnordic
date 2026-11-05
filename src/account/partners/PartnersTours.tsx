import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchPartnerTourCatalog,
  formatPartnerNet,
  partnerTourImage,
  type PartnerTourCard,
} from './partnerTours'

export default function PartnersTours() {
  const [tours, setTours] = useState<PartnerTourCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await fetchPartnerTourCatalog()
      if (cancelled) return
      if (!res.ok) {
        setError(res.error || 'Could not load tours.')
        setTours([])
      } else {
        setTours(res.tours)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rn-rewards-skel h-64 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-200">
        {error}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white">Tours</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Active Royal Nordic experiences for your partnership. Partner net rates appear only when
          Royal Nordic has assigned them to your company — nothing is assumed.
        </p>
      </div>

      {tours.length === 0 ? (
        <div className="rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] px-5 py-10 text-center">
          <p className="font-display text-lg text-white/90">No active tours</p>
          <p className="mt-2 text-sm text-[var(--rn-text-muted)]">
            Check back later or contact Royal Nordic.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tours.map((tour) => {
            const img = partnerTourImage(tour)
            return (
              <li key={tour.tour_id}>
                <Link
                  to={`/partners/dashboard/tours/${tour.tour_id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] transition hover:border-aurora/35 hover:bg-white/[0.05]"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-black/40">
                    {img ? (
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-end bg-[radial-gradient(ellipse_at_30%_20%,rgba(15,143,99,0.35),transparent_55%),linear-gradient(160deg,#0c1410,#152019)] p-4"
                        aria-hidden
                      >
                        <span className="font-display text-sm text-white/70">Royal Nordic</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold leading-snug text-white sm:text-[1.05rem]">
                        {tour.title}
                      </h3>
                      <span
                        className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                          tour.availability_status === 'available'
                            ? 'bg-aurora/15 text-aurora-soft'
                            : 'bg-white/5 text-[var(--rn-text-dim)]'
                        }`}
                      >
                        {tour.availability_status === 'available' ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {tour.duration_text ? (
                      <p className="mt-1.5 text-xs text-[var(--rn-text-dim)]">{tour.duration_text}</p>
                    ) : null}
                    {tour.short_description ? (
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--rn-text-muted)]">
                        {tour.short_description}
                      </p>
                    ) : (
                      <div className="flex-1" />
                    )}
                    <div className="mt-4 border-t border-[var(--rn-border)] pt-3">
                      {tour.has_partner_price && tour.partner_net_eur != null ? (
                        <p className="text-sm">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
                            Partner net
                          </span>
                          <span className="mt-0.5 block font-display text-lg font-semibold text-aurora-soft">
                            {formatPartnerNet(tour.partner_net_eur)}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs leading-relaxed text-[var(--rn-text-muted)]">
                          Contact Royal Nordic for pricing
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
