import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { RnReview } from '../data/reviews'

type Props = {
  reviews: RnReview[]
  eyebrow?: string
  title?: string
  className?: string
  autoPlayMs?: number
}

function FiveYellowStars() {
  return (
    <div className="rn-review-stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="rn-review-star" size={13} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </div>
  )
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
  const useDotStrip = count <= 8

  return (
    <section
      className={`rn-section rn-section--reviews relative overflow-hidden ${className}`}
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="rn-eyebrow">{eyebrow}</p>
            <h2 className="rn-h2-tight mt-1.5 text-white">{title}</h2>
          </div>
          {count > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rn-icon-btn"
                aria-label="Previous review"
                onClick={() => go(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="rn-icon-btn"
                aria-label="Next review"
                onClick={() => go(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        <figure
          className={`rn-reveal rn-review-editorial mt-5 max-w-2xl transition duration-300 ${
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
          <FiveYellowStars />
          <blockquote className="rn-review-quote mt-2.5">“{review.quote}”</blockquote>
          <figcaption className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12px] sm:text-[12.5px]">
            <span className="font-medium text-white">{review.name}</span>
            {review.location && (
              <>
                <span className="text-white/20" aria-hidden>
                  ·
                </span>
                <span className="text-text-muted">{review.location}</span>
              </>
            )}
            {review.date && (
              <>
                <span className="text-white/20" aria-hidden>
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
            <div className="mt-5 flex gap-1.5" role="tablist" aria-label="Review slides">
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show review ${i + 1}`}
                  className={`h-0.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-8 bg-aurora-soft/90' : 'w-3.5 bg-white/15 hover:bg-white/30'
                  }`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
          ) : (
            <p
              className="mt-5 text-[12px] tabular-nums text-text-dim"
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
