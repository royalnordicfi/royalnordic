import { useEffect } from 'react'

const REVEAL_SELECTORS = ['.rn-reveal', '.rn-reveal-img'] as const

/** Subtle viewport entrance for premium motion. Respects reduced motion. */
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
        rootMargin: '0px 0px -4% 0px',
        threshold: [0, 0.06, 0.14],
      }
    )

    const observeAll = () => {
      REVEAL_SELECTORS.forEach((sel) => {
        document.querySelectorAll(`${sel}:not(.is-visible)`).forEach((el) => io.observe(el))
      })
    }
    observeAll()

    const mo = new MutationObserver(() => {
      observeAll()
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
