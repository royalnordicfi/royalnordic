import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_KEY = 'rn_intro_seen_v1'
const MAX_MS = 5000

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return true
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode */
  }
}

/**
 * Skippable Northern Lights timelapse intro with logo reveal.
 * Once per browser session. Skipped entirely when reduced-motion is preferred.
 */
export default function SiteIntro() {
  const [active, setActive] = useState(false)
  const closing = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const dismiss = useCallback(() => {
    if (closing.current) return
    closing.current = true
    markSeen()
    const root = document.getElementById('rn-site-intro')
    root?.classList.add('rn-intro--out')
    window.setTimeout(() => {
      setActive(false)
      document.documentElement.classList.remove('rn-intro-lock')
    }, 420)
  }, [])

  useEffect(() => {
    if (alreadySeen() || prefersReducedMotion()) {
      markSeen()
      return
    }
    setActive(true)
    document.documentElement.classList.add('rn-intro-lock')
  }, [])

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(dismiss, MAX_MS)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        dismiss()
      }
    }
    window.addEventListener('keydown', onKey)
    const v = videoRef.current
    if (v) {
      v.muted = true
      void v.play().catch(() => {
        /* autoplay blocked — still show logo on poster */
      })
    }
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, dismiss])

  if (!active) return null

  return (
    <div
      id="rn-site-intro"
      className="rn-intro"
      role="dialog"
      aria-modal="true"
      aria-label="Royal Nordic introduction"
    >
      <video
        ref={videoRef}
        className="rn-intro__video"
        muted
        playsInline
        preload="auto"
        poster="/nortti1.jpg"
        aria-hidden
      >
        <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
      </video>
      <div className="rn-intro__veil" aria-hidden />
      <div className="rn-intro__brand">
        <img
          src="/royalnordiclogotransparent.png"
          alt=""
          className="rn-intro__mark"
          width={56}
          height={56}
        />
        <p className="rn-intro__name">Royal Nordic</p>
        <p className="rn-intro__place">Rovaniemi · Finnish Lapland</p>
      </div>
      <button type="button" className="rn-intro__skip" onClick={dismiss}>
        Skip
      </button>
    </div>
  )
}
