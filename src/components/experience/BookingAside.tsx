type Props = {
  priceFrom: number
  priceNote?: string
  trustLines?: string[]
  offerLine?: string
  children: React.ReactNode
  className?: string
}

/**
 * Warm-white booking surface — signature commerce contrast on Arctic dark.
 * Keep visual weight light; details live in the form progressive flow.
 */
export default function BookingAside({
  priceFrom,
  priceNote = '/ person',
  trustLines = [
    'Free cancellation up to 24h before',
    'Secure Stripe payment',
    'Hotel pickup in Rovaniemi',
  ],
  offerLine,
  children,
  className = '',
}: Props) {
  return (
    <div className={`rn-book-panel-light rn-book-signature ${className}`}>
      <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6 sm:py-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-panel-muted">From</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <p className="font-display text-[2rem] font-semibold leading-none tracking-tight text-panel-ink sm:text-[2.15rem]">
            €{priceFrom}
          </p>
          <span className="text-sm text-panel-muted">{priceNote}</span>
        </div>
        {offerLine ? (
          <p className="mt-3 text-[12.5px] leading-snug text-panel-muted">
            <span className="font-medium text-panel-ink">Direct booking · </span>
            {offerLine}
          </p>
        ) : null}
        <ul className="mt-4 space-y-1.5 text-[12px] leading-snug text-panel-muted">
          {trustLines.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-aurora/80" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}
