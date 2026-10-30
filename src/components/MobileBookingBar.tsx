import { useEffect } from 'react'

type MobileBookingBarProps = {
  priceFrom: number
  referencePrice?: number
  onBook: () => void
  label?: string
  /** Price unit shown under From (e.g. "/ adult", "/ vehicle"). */
  unitLabel?: string
}

/** Persistent mobile CTA — sets --mobile-book-bar for WhatsApp clearance. */
const MobileBookingBar = ({
  priceFrom,
  referencePrice,
  onBook,
  label = 'Check availability',
  unitLabel = '/ adult',
}: MobileBookingBarProps) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--mobile-book-bar', '4.75rem')
    return () => {
      document.documentElement.style.setProperty('--mobile-book-bar', '0px')
    }
  }, [])

  const showSale = typeof referencePrice === 'number' && referencePrice > priceFrom

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#040807]/96 py-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="rn-container flex items-center justify-between gap-3">
        <div className="min-w-0">
          {showSale ? (
            <>
              <p className="flex items-baseline gap-2">
                <span className="text-sm text-white/45 line-through decoration-[color-mix(in_srgb,var(--rn-sale)_80%,transparent)]">
                  €{Number.isInteger(referencePrice) ? referencePrice : referencePrice.toFixed(2)}
                </span>
                <span className="font-display text-xl font-semibold leading-none text-[var(--rn-sale)]">
                  €{Number.isInteger(priceFrom) ? priceFrom : priceFrom.toFixed(2)}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] font-medium tracking-[0.04em] text-[var(--rn-sale-soft)]">
                {unitLabel} · special offer
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-medium tracking-[0.06em] text-text-dim">From</p>
              <p
                className="text-[1.3rem] font-bold leading-none tracking-tight text-white"
                style={{ fontFamily: 'var(--rn-font-body)' }}
              >
                €{priceFrom}
                <span className="ml-1.5 text-[11px] font-medium tracking-normal text-text-dim">
                  {unitLabel}
                </span>
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onBook}
          className="rn-btn-primary min-h-[48px] min-w-[9.75rem] shrink-0 px-4 text-[13px] tracking-wide sm:min-w-[10.5rem] sm:px-5"
        >
          {label}
        </button>
      </div>
    </div>
  )
}

export default MobileBookingBar
