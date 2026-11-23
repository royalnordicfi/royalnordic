import SalePrice from '../SalePrice'

type Props = {
  /** Omit for quote-only panels (custom transportation) */
  priceFrom?: number
  referencePrice?: number
  priceNote?: string
  /** Optional child catalogue price (shown under adult when on sale). */
  childPriceFrom?: number
  childReferencePrice?: number
  childPriceNote?: string
  adultSaveLabel?: string
  childSaveLabel?: string
  /** Replaces the “From €X” row when priceFrom is omitted */
  quoteLabel?: string
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
  childPriceFrom,
  childReferencePrice,
  childPriceNote = '/ child',
  adultSaveLabel,
  childSaveLabel,
  quoteLabel,
  trustLines = [
    'Free cancellation 24h',
    'Secure payment',
    'Hotel pickup',
  ],
  offerLine,
  children,
  className = '',
}: Props) {
  const showSale =
    typeof priceFrom === 'number' &&
    typeof referencePrice === 'number' &&
    referencePrice > priceFrom
  const showChildSale =
    typeof childPriceFrom === 'number' &&
    typeof childReferencePrice === 'number' &&
    childReferencePrice > childPriceFrom
  const trust = trustLines.slice(0, 3)

  return (
    <div className={`rn-book-panel-light rn-book-signature rn-book-aside ${className}`}>
      <div className="rn-book-aside__summary">
        {showSale && typeof priceFrom === 'number' ? (
          <SalePrice
            current={priceFrom}
            reference={referencePrice!}
            note={priceNote}
            size="sm"
            tone="light"
            compact
            saveAsPercent={!adultSaveLabel}
            saveLabel={adultSaveLabel}
            saveTone="green"
          />
        ) : typeof priceFrom === 'number' ? (
          <>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-panel-muted">From</p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <p
                className="rn-book-aside__price font-bold leading-none tracking-tight text-panel-ink"
                style={{ fontFamily: 'var(--rn-font-body)' }}
              >
                €{priceFrom}
              </p>
              <span className="text-[11.5px] font-medium text-panel-muted">{priceNote}</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-panel-muted">
              {quoteLabel || 'Personalized quote'}
            </p>
            <p className="mt-1 text-[12.5px] leading-snug text-panel-muted">
              {priceNote || 'Tell us your route — we reply with a quote.'}
            </p>
          </>
        )}
        {showChildSale ? (
          <div className="mt-2">
            <SalePrice
              current={childPriceFrom!}
              reference={childReferencePrice!}
              note={childPriceNote}
              size="sm"
              tone="light"
              compact
              showBadge={false}
              saveAsPercent={!childSaveLabel}
              saveLabel={childSaveLabel}
              saveTone="green"
            />
          </div>
        ) : typeof childPriceFrom === 'number' && !showSale ? (
          <p className="mt-1.5 text-[12px] text-panel-muted">
            Children from €{childPriceFrom}
            {childPriceNote ? ` ${childPriceNote.replace(/^\//, '').trim()}` : ''}
          </p>
        ) : null}
        {offerLine && !showSale ? (
          <p className="mt-1.5 text-[11px] leading-snug text-panel-muted">
            <span className="font-medium text-panel-ink">Direct booking · </span>
            {offerLine}
          </p>
        ) : null}
        {trust.length > 0 ? (
          <ul className="rn-book-aside__trust" aria-label="Booking reassurances">
            {trust.map((line) => (
              <li key={line}>
                <span className="rn-book-aside__trust-dot" aria-hidden />
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
