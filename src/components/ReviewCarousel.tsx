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
  const paused = useRef(false)
  const touchX = useRef<number | null>(null)
  const count = reviews.length

  const go = useCallback(
    (dir: -1 | 1) => {
      if (!count) return
      setIndex((i) => (i + dir + count) % count)
    },
    [count]
  )

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
      <div className="pointer-events-none absolute inset-0 rn-ambient-aurora opacity-60" aria-hidden />
      <div className="rn-container relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="rn-eyebrow">{eyebrow}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">{title}</h2>
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
          className="rn-reveal mt-8 max-w-3xl"
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
          <blockquote className="font-display text-xl leading-snug text-white sm:text-2xl lg:text-[1.75rem] lg:leading-snug">
            “{review.quote}”
          </blockquote>
          <figcaption className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-muted">
            <span className="font-medium text-white">{review.name}</span>
            {review.location && (
              <>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span>{review.location}</span>
              </>
            )}
            {review.date && (
              <>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span>{review.date}</span>
              </>
            )}
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <span className="text-aurora-soft">{review.source}</span>
          </figcaption>
        </figure>

        {count > 1 && (
          <div className="mt-8 flex gap-1.5" role="tablist" aria-label="Review slides">
            {reviews.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show review ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === index ? 'w-8 bg-aurora' : 'w-3 bg-white/20 hover:bg-white/35'
                }`}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
