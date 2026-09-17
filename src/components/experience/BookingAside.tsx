type Props = {
  priceFrom: number
  priceNote?: string
  trustLines?: string[]
  children: React.ReactNode
  className?: string
}

/**
 * Dark elevated booking shell — integrates with Royal Nordic identity.
 * BookingForm logic stays unchanged; this is presentation only.
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
    <div className={`rn-book-panel rn-reveal ${className}`}>
      <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-dim">From</p>
        <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          €{priceFrom}
          <span className="ml-1.5 font-sans text-sm font-normal text-text-muted">{priceNote}</span>
        </p>
        <ul className="mt-4 space-y-1.5 text-xs text-text-muted">
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
