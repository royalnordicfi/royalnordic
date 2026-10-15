import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { RN_SNOWMOBILE_PROMO } from '../../lib/bokun'

type Props = {
  className?: string
  /** When true, claim automatic application (only if verified in Bókun). Default: manual. */
  autoApplied?: boolean
}

/**
 * Premium RN10 promo surface for partner Bókun products.
 * Default is honest manual checkout entry — Bókun docs do not document a public
 * auto-apply URL parameter for experience-calendar widgets.
 */
export default function RnPromoCodeCard({ className = '', autoApplied = false }: Props) {
  const [copied, setCopied] = useState(false)
  const { code, percent, adultRegular, adultWithCode, childRegular, childWithCode } =
    RN_SNOWMOBILE_PROMO

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`rn-promo-code ${className}`}>
      <p className="rn-promo-code__eyebrow">Exclusive Royal Nordic offer</p>
      <p className="rn-promo-code__title">
        Save {percent}% with code <span className="rn-promo-code__code">{code}</span>
      </p>
      {autoApplied ? (
        <p className="rn-promo-code__hint">Your {percent}% discount is automatically applied at checkout.</p>
      ) : (
        <p className="rn-promo-code__hint">
          Enter <strong>{code}</strong> in the Bókun checkout to save {percent}%. The code also helps
          identify Royal Nordic bookings.
        </p>
      )}

      <div className="rn-promo-code__row">
        <div className="rn-promo-code__chip" aria-label={`Promo code ${code}`}>
          {code}
        </div>
        <button type="button" className="rn-promo-code__copy" onClick={copy}>
          {copied ? (
            <>
              <Check size={14} aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden /> Copy code
            </>
          )}
        </button>
      </div>

      <p className="rn-promo-code__prices">
        Example with {code}: adult €{adultRegular} → €{adultWithCode.toFixed(2)} · child €{childRegular}{' '}
        → €{childWithCode.toFixed(2)}. Final total is confirmed in checkout.
      </p>
    </div>
  )
}
