import { useEffect } from 'react'

type MobileBookingBarProps = {
  priceFrom: number
  referencePrice?: number
  onBook: () => void
  label?: string
}

/** Persistent mobile CTA — sets --mobile-book-bar for WhatsApp clearance. */
const MobileBookingBar = ({
  priceFrom,
  referencePrice,
  onBook,
  label = 'Check availability',
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
                <span className="text-sm text-white/45 line-through decoration-sale/80">€{referencePrice}</span>
                <span className="font-display text-xl font-semibold leading-none text-white">€{priceFrom}</span>
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-sale">/ adult · special offer</p>
            </>
          ) : (
            <>
              <p className="text-[10px] uppercase tracking-[0.14em] text-text-dim">From</p>
              <p className="font-display text-xl font-semibold leading-none text-white">€{priceFrom}</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onBook}
          className="rn-btn-primary min-h-[48px] min-w-[10.5rem] shrink-0 px-5 text-[13px] tracking-wide"
        >
          {label}
        </button>
      </div>
    </div>
  )
}

export default MobileBookingBar
