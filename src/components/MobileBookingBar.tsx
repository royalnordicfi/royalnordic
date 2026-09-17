import { useEffect } from 'react'

type MobileBookingBarProps = {
  priceFrom: number
  onBook: () => void
  label?: string
}

/** Persistent mobile CTA — sets --mobile-book-bar for WhatsApp clearance. */
const MobileBookingBar = ({ priceFrom, onBook, label = 'Check availability' }: MobileBookingBarProps) => {
  useEffect(() => {
    document.documentElement.style.setProperty('--mobile-book-bar', '4.75rem')
    return () => {
      document.documentElement.style.setProperty('--mobile-book-bar', '0px')
    }
  }, [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-snow/95 px-4 py-3 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-rn items-center justify-between gap-3">
        <div>
          <p className="text-xs text-ink-muted">From</p>
          <p className="text-lg font-semibold text-ink">€{priceFrom}</p>
        </div>
        <button type="button" onClick={onBook} className="rn-btn-primary px-6">
          {label}
        </button>
      </div>
    </div>
  )
}

export default MobileBookingBar
