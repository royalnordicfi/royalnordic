import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { RN_SNOWMOBILE_PROMO } from '../../lib/bokun'

type Props = {
  className?: string
}

/** Compact RN10 code strip — copy and enter at Bókun checkout. */
export default function RnPromoCodeCard({ className = '' }: Props) {
  const [copied, setCopied] = useState(false)
  const { code, percent } = RN_SNOWMOBILE_PROMO

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
      <div className="rn-promo-code__head">
        <p className="rn-promo-code__title">
          −{percent}% with <span className="rn-promo-code__code">{code}</span>
        </p>
        <p className="rn-promo-code__hint">Enter at Bókun checkout</p>
      </div>
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
              <Copy size={14} aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
