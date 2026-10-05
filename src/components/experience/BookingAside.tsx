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
 * Premium booking assistant surface — sticky sibling to tour content.
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

  return (
    <div className={`rn-book-panel-light rn-book-signature ${className}`}>
      <div className="border-b border-black/[0.06] px-5 py-5 sm:px-6">
        {showSale ? (
          <SalePrice
            current={priceFrom}
            reference={referencePrice}
            note={priceNote}
            size="md"
            tone="light"
          />
        ) : (
          <>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-panel-muted">From</p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <p className="font-display text-[2rem] font-semibold leading-none tracking-tight text-panel-ink sm:text-[2.15rem]">
                €{priceFrom}
              </p>
              <span className="text-sm text-panel-muted">{priceNote}</span>
            </div>
          </>
        )}
        {offerLine && !showSale ? (
          <p className="mt-3 text-[12.5px] leading-snug text-panel-muted">
            <span className="font-medium text-panel-ink">Direct booking · </span>
            {offerLine}
          </p>
        ) : null}
        <ul className="mt-4 space-y-2 text-[12.5px] leading-snug text-panel-muted">
          {trustLines.slice(0, 4).map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-aurora" aria-hidden>
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
