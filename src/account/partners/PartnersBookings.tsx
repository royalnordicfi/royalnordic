export default function PartnersBookings() {
  return (
    <div className="max-w-xl">
      <h2 className="font-display text-xl font-semibold tracking-tight text-white">Bookings</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
        Partner booking tools are not available yet. This page is reserved for future trade bookings
        and does not show pricing, inventory, or commissions.
      </p>

      <div className="mt-8 rounded-[var(--rn-radius)] border border-dashed border-[var(--rn-border)] bg-white/[0.02] px-5 py-10 text-center">
        <p className="font-display text-lg font-semibold text-white/90">No bookings</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--rn-text-muted)]">
          When booking opens for approved partners, your reservations will list here.
        </p>
        <button
          type="button"
          disabled
          className="mt-6 inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-[var(--rn-radius-sm)] border border-[var(--rn-border)] px-4 text-sm text-[var(--rn-text-dim)] opacity-60"
        >
          New booking — coming soon
        </button>
      </div>
    </div>
  )
}
