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
  /** Prefer “−10%” over “Save €X” (avoids float noise on percent promos) */
  saveAsPercent?: boolean
  /** Override save text entirely, e.g. "−10%" */
  saveLabel?: string
  /** Inline save cue on the price row — denser booking widgets */
  compact?: boolean
  className?: string
}

function formatEuro(n: number) {
  return Number.isInteger(n) ? `€${n}` : `€${n.toFixed(2)}`
}

function defaultSaveLabel(reference: number, current: number, asPercent: boolean) {
  if (current >= reference || reference <= 0) return null
  if (asPercent) {
    const pct = Math.round(((reference - current) / reference) * 100)
    return pct > 0 ? `−${pct}%` : null
  }
  const save = Math.round((reference - current) * 100) / 100
  if (save <= 0) return null
  return `Save ${formatEuro(save)}`
}

/**
 * Premium sale price: reference struck through, current in sale red, restrained save cue.
 */
export default function SalePrice({
  current,
  reference,
  note = 'per adult',
  size = 'md',
  tone = 'dark',
  showBadge = true,
  showSave = true,
  saveAsPercent = false,
  saveLabel,
  compact = false,
  className = '',
}: Props) {
  const light = tone === 'light'
  const label = showSave ? saveLabel ?? defaultSaveLabel(reference, current, saveAsPercent) : null
  const saveEl = label ? <span className="rn-sale-price__save">{label}</span> : null

  return (
    <div
      className={`rn-sale-price rn-sale-price--${size} ${light ? 'rn-sale-price--light' : ''} ${
        compact ? 'rn-sale-price--compact' : ''
      } ${className}`}
    >
      {showBadge ? <p className="rn-sale-price__badge">Special offer</p> : null}
      <div className="rn-sale-price__row">
        <span className="rn-sale-price__was" aria-label={`Was ${formatEuro(reference)}`}>
          {formatEuro(reference)}
        </span>
        <span className="rn-sale-price__now">{formatEuro(current)}</span>
        {note ? <span className="rn-sale-price__note">{note}</span> : null}
        {compact ? saveEl : null}
      </div>
      {!compact ? saveEl : null}
    </div>
  )
}
