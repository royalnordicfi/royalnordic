import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RnReview } from '../data/reviews'

type Props = {
  reviews: RnReview[]
  eyebrow?: string
  title?: string
  className?: string
  autoPlayMs?: number
}

export default function ReviewCarousel({
  reviews,
  eyebrow = 'Guest stories',
  title = 'What travellers remember',
  className = '',
  autoPlayMs = 9000,
}: Props) {
  const [index, setIndex] = useState(0)
  const [fade, setFade] = useState(true)
  const paused = useRef(false)
  const touchX = useRef<number | null>(null)
  const count = reviews.length

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!count) return
      setFade(false)
      window.setTimeout(() => {
        setIndex((i) => (i + dir + count) % count)
        setFade(true)
      }, 180)
    },
    [count]
  )

  const goTo = (i: number) => {
    if (i === index) return
    setFade(false)
    window.setTimeout(() => {
      setIndex(i)
      setFade(true)
    }, 180)
  }

  useEffect(() => {
    if (count < 2 || autoPlayMs <= 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    const id = window.setInterval(() => {
      if (!paused.current) go(1)
    }, autoPlayMs)
    return () => window.clearInterval(id)
  }, [autoPlayMs, count, go])

  if (!count) return null
  const review = reviews[index]
  const useDotStrip = count <= 5

  return (
    <section
      className={`rn-section relative overflow-hidden ${className}`}
      aria-roledescription="carousel"
      aria-label={title}
      onMouseEnter={() => {
        paused.current = true
      }}
      onMouseLeave={() => {
        paused.current = false
      }}
      onFocusCapture={() => {
        paused.current = true
      }}
      onBlurCapture={() => {
        paused.current = false
      }}
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-80" aria-hidden />
      <div className="rn-container relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="rn-eyebrow">{eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm text-text-dim">Verified Royal Nordic guest reviews</p>
          </div>
          {count > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rn-icon-btn"
                aria-label="Previous review"
                onClick={() => go(-1)}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="rn-icon-btn"
                aria-label="Next review"
                onClick={() => go(1)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <figure
          className={`rn-reveal rn-review-editorial mt-8 max-w-3xl transition duration-300 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current
            touchX.current = null
            if (Math.abs(dx) < 40) return
            go(dx < 0 ? 1 : -1)
          }}
        >
          <blockquote className="font-display text-xl leading-snug text-white sm:text-2xl lg:text-[1.65rem] lg:leading-snug">
            “{review.quote}”
          </blockquote>
          <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <span className="font-medium text-white">{review.name}</span>
            {review.location && (
              <>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span className="text-text-muted">{review.location}</span>
              </>
            )}
            {review.date && (
              <>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span className="text-text-dim">{review.date}</span>
              </>
            )}
            <span className="rn-review-verified">{review.source}</span>
          </figcaption>
        </figure>

        {count > 1 &&
          (useDotStrip ? (
            <div className="mt-8 flex gap-1.5" role="tablist" aria-label="Review slides">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show review ${i + 1}`}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-10 bg-aurora-soft/90' : 'w-4 bg-white/15 hover:bg-white/30'
                  }`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          ) : (
            <p
              className="mt-8 text-sm tabular-nums text-text-dim"
              aria-live="polite"
              aria-label={`Review ${index + 1} of ${count}`}
            >
              {index + 1} / {count}
            </p>
          ))}
      </div>
    </section>
  )
}
