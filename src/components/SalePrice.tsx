type Size = 'sm' | 'md' | 'lg'

type Props = {
  current: number
  reference: number
  note?: string
  size?: Size
  /** Light panel (booking aside) vs dark page surfaces */
  tone?: 'dark' | 'light'
  showBadge?: boolean
  showSave?: boolean
  /** Inline save cue on the price row — denser booking widgets */
  compact?: boolean
  className?: string
}

/**
 * Premium sale price: reference struck through, current dominant, restrained save cue.
 */
export default function SalePrice({
  current,
  reference,
  note = 'per adult',
  size = 'md',
  tone = 'dark',
  showBadge = true,
  showSave = true,
  compact = false,
  className = '',
}: Props) {
  const save = Math.max(0, reference - current)
  const light = tone === 'light'
  const saveEl =
    showSave && save > 0 ? (
      <span className="rn-sale-price__save">Save €{save}</span>
    ) : null

  return (
    <div
      className={`rn-sale-price rn-sale-price--${size} ${light ? 'rn-sale-price--light' : ''} ${
        compact ? 'rn-sale-price--compact' : ''
      } ${className}`}
    >
      {showBadge ? <p className="rn-sale-price__badge">Special offer</p> : null}
      <div className="rn-sale-price__row">
        <span className="rn-sale-price__was" aria-label={`Was €${reference}`}>
          €{reference}
        </span>
        <span className="rn-sale-price__now">€{current}</span>
        {note ? <span className="rn-sale-price__note">{note}</span> : null}
        {compact ? saveEl : null}
      </div>
      {!compact ? saveEl : null}
    </div>
  )
}
