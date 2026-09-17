import { useEffect } from 'react'

const REVEAL_SELECTORS = ['.rn-reveal', '.rn-reveal-img'] as const

/**
 * Viewport entrance motion. Marks near-viewport elements immediately so
 * long grids never leave opaque "ghost" voids that look like broken pagination.
 */
export default function RevealObserver() {
  useEffect(() => {
    const markAllVisible = () => {
      REVEAL_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.classList.add('is-visible'))
      })
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      markAllVisible()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          io.unobserve(entry.target)
        })
      },
      {
        root: null,
        // Reveal early — avoids invisible card rows creating empty black bands
        rootMargin: '12% 0px 35% 0px',
        threshold: 0.01,
      }
    )

    const observeAll = () => {
      REVEAL_SELECTORS.forEach((sel) => {
        document.querySelectorAll(`${sel}:not(.is-visible)`).forEach((el) => {
          const rect = el.getBoundingClientRect()
          const vh = window.innerHeight || 0
          // Already on screen or within one viewport below — show now
          if (rect.top < vh * 1.35) {
            el.classList.add('is-visible')
            return
          }
          io.observe(el)
        })
      })
    }

    observeAll()
    // Catch late paint / route transitions
    const t = window.setTimeout(observeAll, 80)
    const mo = new MutationObserver(() => observeAll())
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(t)
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
