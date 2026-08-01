import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Copy, X } from 'lucide-react'
import { WINTER_PROMOTION } from '../config/winterPromotion'
import {
  dismissPopup,
  getPromoDestination,
  isPopupCampaignActive,
  isPopupDismissed,
  trackWinterPromoEvent,
  wasCodeAppliedThisSession,
  wasPopupDismissedThisSession,
} from '../lib/winterPromotion'

const HIDDEN_PATH_PREFIXES = ['/payment-success', '/crypto-payment-success']

const WinterPromoPopup = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const config = WINTER_PROMOTION
  const titleId = useId()
  const descId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const hideOnPath = HIDDEN_PATH_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  )

  const close = useCallback(() => {
    setOpen(false)
    dismissPopup(config)
    trackWinterPromoEvent('winter20_popup_dismissed')
    window.setTimeout(() => {
      previouslyFocused.current?.focus?.()
    }, 0)
  }, [config])

  useEffect(() => {
    if (!isPopupCampaignActive(config) || hideOnPath) return
    if (isPopupDismissed(config) || wasPopupDismissedThisSession(config)) return
    if (wasCodeAppliedThisSession(config)) return

    const timer = window.setTimeout(() => {
      if (isPopupDismissed(config) || wasPopupDismissedThisSession(config)) return
      previouslyFocused.current = document.activeElement as HTMLElement | null
      setOpen(true)
      trackWinterPromoEvent('winter20_popup_viewed')
    }, config.popupDelayMs)

    return () => window.clearTimeout(timer)
  }, [config, hideOnPath, location.pathname])

  useEffect(() => {
    if (!open) return

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, close])

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(config.discountCode)
      setCopied(true)
      trackWinterPromoEvent('winter20_code_copied')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const bookNow = () => {
    trackWinterPromoEvent('winter20_popup_cta_clicked')
    dismissPopup(config)
    setOpen(false)
    const dest = getPromoDestination(config)
    navigate({
      pathname: dest.pathname,
      hash: dest.hash.startsWith('#') ? dest.hash : dest.hash ? `#${dest.hash}` : '',
    })
    if (dest.hash) {
      window.setTimeout(() => {
        document
          .getElementById(dest.hash.replace(/^#/, ''))
          ?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }
  }

  if (!open || !isPopupCampaignActive(config) || hideOnPath) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative max-h-[min(92vh,640px)] w-full max-w-md overflow-y-auto rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-gray-950 via-black to-gray-950 p-6 shadow-2xl sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="absolute right-3 top-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close promotion"
        >
          <X size={20} />
        </button>

        <p className="mb-3 font-clean text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
          Limited Time
        </p>
        <h2
          id={titleId}
          className="mb-3 pr-8 font-luxury text-2xl font-bold leading-tight text-white sm:text-3xl"
        >
          {config.popupHeading}
        </h2>
        <p id={descId} className="mb-6 font-clean text-sm leading-relaxed text-gray-300 sm:text-base">
          {config.popupBody}
        </p>

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
          <p className="mb-2 font-clean text-xs uppercase tracking-wider text-gray-400">
            Promo code
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="font-mono text-2xl font-bold tracking-[0.2em] text-emerald-300 sm:text-3xl">
              {config.discountCode}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-emerald-500/40 text-emerald-300 transition-colors hover:bg-emerald-500/15"
              aria-label={copied ? 'Code copied' : `Copy code ${config.discountCode}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          {copied && (
            <p className="mt-2 font-clean text-xs text-emerald-400" aria-live="polite">
              Copied
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={bookNow}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 font-elegant text-base font-bold tracking-wider text-white transition-all hover:from-emerald-500 hover:to-emerald-400"
        >
          BOOK NOW
        </button>
      </div>
    </div>,
    document.body
  )
}

export default WinterPromoPopup
