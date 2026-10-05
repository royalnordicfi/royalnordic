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
  className = '',
}: Props) {
  const save = Math.max(0, reference - current)
  const light = tone === 'light'

  return (
    <div className={`rn-sale-price rn-sale-price--${size} ${light ? 'rn-sale-price--light' : ''} ${className}`}>
      {showBadge ? <p className="rn-sale-price__badge">Special offer</p> : null}
      <div className="rn-sale-price__row">
        <span className="rn-sale-price__was" aria-label={`Was €${reference}`}>
          €{reference}
        </span>
        <span className="rn-sale-price__now">€{current}</span>
        {note ? <span className="rn-sale-price__note">{note}</span> : null}
      </div>
      {showSave && save > 0 ? (
        <p className="rn-sale-price__save">
          Save €{save}
        </p>
      ) : null}
    </div>
  )
}
