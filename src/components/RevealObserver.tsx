import { useEffect } from 'react'

/** Subtle viewport entrance for premium motion. Respects reduced motion. */
export default function RevealObserver() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      document.querySelectorAll('.rn-reveal').forEach((el) => el.classList.add('is-visible'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    )

    const observeAll = () => {
      document.querySelectorAll('.rn-reveal:not(.is-visible)').forEach((el) => io.observe(el))
    }
    observeAll()

    const mo = new MutationObserver(observeAll)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
