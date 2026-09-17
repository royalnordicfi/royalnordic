type Props = {
  priceFrom: number
  priceNote?: string
  trustLines?: string[]
  children: React.ReactNode
  className?: string
}

/**
 * Warm-white booking surface — signature commerce contrast on Arctic dark.
 */
export default function BookingAside({
  priceFrom,
  priceNote = '/ person',
  trustLines = [
    'Free cancellation up to 24h before',
    'Secure Stripe payment',
    'Hotel pickup in Rovaniemi',
  ],
  children,
  className = '',
}: Props) {
  return (
    <div className={`rn-book-panel-light rn-book-signature ${className}`}>
      <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-panel-muted">From</p>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-[2.15rem] font-semibold leading-none tracking-tight text-panel-ink sm:text-[2.35rem]">
            €{priceFrom}
          </p>
          <span className="text-sm text-panel-muted">{priceNote}</span>
        </div>
        <ul className="mt-4 space-y-1.5 text-xs leading-snug text-panel-muted">
          {trustLines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-aurora" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
