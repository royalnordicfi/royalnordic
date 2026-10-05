import SalePrice from '../SalePrice'

type Props = {
  priceFrom: number
  referencePrice?: number
  priceNote?: string
  trustLines?: string[]
  offerLine?: string
  children: React.ReactNode
  className?: string
}

/**
 * Premium booking assistant surface.
 * Sticky / viewport fit is owned by `.rn-sticky-book` on the layout wrapper.
 */
export default function BookingAside({
  priceFrom,
  referencePrice,
  priceNote = '/ adult',
  trustLines = [
    'Free cancellation up to 24h before',
    'Secure Stripe payment',
    'Hotel pickup in Rovaniemi',
  ],
  offerLine,
  children,
  className = '',
}: Props) {
  const showSale = typeof referencePrice === 'number' && referencePrice > priceFrom
  const trust = trustLines.slice(0, 4)

  return (
    <div className={`rn-book-panel-light rn-book-signature rn-book-aside ${className}`}>
      <div className="rn-book-aside__summary">
        {showSale ? (
          <SalePrice
            current={priceFrom}
            reference={referencePrice}
            note={priceNote}
            size="sm"
            tone="light"
            compact
          />
        ) : (
          <>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-panel-muted">From</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <p className="font-display text-[1.45rem] font-semibold leading-none tracking-tight text-panel-ink">
                €{priceFrom}
              </p>
              <span className="text-[12px] text-panel-muted">{priceNote}</span>
            </div>
          </>
        )}
        {offerLine && !showSale ? (
          <p className="mt-2 text-[11.5px] leading-snug text-panel-muted">
            <span className="font-medium text-panel-ink">Direct booking · </span>
            {offerLine}
          </p>
        ) : null}
        {trust.length > 0 ? (
          <ul className="rn-book-aside__trust" aria-label="Booking reassurances">
            {trust.map((line) => (
              <li key={line}>
                <span className="rn-book-aside__trust-mark" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="rn-book-aside__body">{children}</div>
    </div>
  )
}
