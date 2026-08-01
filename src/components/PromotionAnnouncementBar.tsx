import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  PROMO_BAR_HEIGHT_PX,
  WINTER_PROMOTION,
} from '../config/winterPromotion'
import {
  getPromoDestination,
  isAnnouncementBarActive,
  setPromoBarCssVar,
  trackWinterPromoEvent,
} from '../lib/winterPromotion'

const HIDDEN_PATH_PREFIXES = ['/payment-success', '/crypto-payment-success']

const PromotionAnnouncementBar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const config = WINTER_PROMOTION
  const active = isAnnouncementBarActive(config)
  const hideOnPath = HIDDEN_PATH_PREFIXES.some((p) =>
    location.pathname.startsWith(p)
  )
  const show = active && !hideOnPath

  useEffect(() => {
    setPromoBarCssVar(show)
    return () => setPromoBarCssVar(false)
  }, [show])

  const marqueeChunks = useMemo(() => {
    const msg = config.announcementText
    return [msg, msg, msg, msg]
  }, [config.announcementText])

  if (!show) return null

  const goToDestination = () => {
    trackWinterPromoEvent('winter20_bar_clicked')
    const dest = getPromoDestination(config)
    if (location.pathname === dest.pathname) {
      if (dest.hash) {
        const id = dest.hash.replace('#', '')
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }
    navigate({
      pathname: dest.pathname,
      hash: dest.hash.startsWith('#') ? dest.hash : dest.hash ? `#${dest.hash}` : '',
    })
    if (dest.hash) {
      window.setTimeout(() => {
        const id = dest.hash.replace(/^#/, '')
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 120)
    }
  }

  return (
    <div
      className="rn-promo-bar fixed inset-x-0 top-0 z-[60] border-b border-emerald-900/40 bg-emerald-950 text-emerald-50"
      style={{
        height: PROMO_BAR_HEIGHT_PX,
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
      role="region"
      aria-label="Winter booking promotion"
    >
      <button
        type="button"
        onClick={goToDestination}
        className="group flex h-full w-full items-center justify-center px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-emerald-300"
        aria-label={`${config.announcementText}. Book now.`}
      >
        <span className="rn-promo-bar__static truncate px-2 text-center font-clean text-[11px] font-medium tracking-wide sm:text-xs">
          {config.announcementText}
          <span className="ml-2 inline font-semibold text-emerald-300 underline-offset-2 group-hover:underline">
            BOOK NOW
          </span>
        </span>

        <span className="rn-promo-bar__marquee hidden w-full overflow-hidden" aria-hidden>
          <span className="rn-promo-bar__track inline-flex whitespace-nowrap font-clean text-[11px] font-medium tracking-wide sm:text-xs">
            {marqueeChunks.map((chunk, i) => (
              <span key={`${chunk}-${i}`} className="mx-8 inline-flex items-center gap-3">
                {chunk}
                <span className="font-semibold text-emerald-300">BOOK NOW</span>
              </span>
            ))}
          </span>
        </span>
      </button>
    </div>
  )
}

export default PromotionAnnouncementBar
