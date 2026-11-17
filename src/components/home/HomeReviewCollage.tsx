import { useEffect, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import {
  HOME_COLLAGE_REVIEWS,
  homeCollageRows,
  type HomeCollageReview,
} from '../../data/homeReviewCollage'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="rn-ql-rcard__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }, (_, i) => (
        <Star key={i} size={11} fill="currentColor" strokeWidth={0} aria-hidden />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: HomeCollageReview }) {
  const meta = [review.source, review.location].filter(Boolean).join(' · ')
  return (
    <article className="rn-ql-rcard">
      <Stars rating={review.rating} />
      <blockquote className="rn-ql-rcard__quote">
        <p>“{review.quote}”</p>
      </blockquote>
      <footer className="rn-ql-rcard__foot">
        <cite className="rn-ql-rcard__name">{review.name}</cite>
        <span className="rn-ql-rcard__meta">{meta}</span>
      </footer>
    </article>
  )
}

function MarqueeRow({
  reviews,
  direction,
  durationSec,
}: {
  reviews: HomeCollageReview[]
  direction: 'ltr' | 'rtl'
  durationSec: number
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    const pause = () => setPaused(true)
    const resume = () => setPaused(false)
    el.addEventListener('pointerdown', pause)
    el.addEventListener('pointerup', resume)
    el.addEventListener('pointerleave', resume)
    el.addEventListener('pointercancel', resume)
    return () => {
      el.removeEventListener('pointerdown', pause)
      el.removeEventListener('pointerup', resume)
      el.removeEventListener('pointerleave', resume)
      el.removeEventListener('pointercancel', resume)
    }
  }, [])

  const sequence = [...reviews, ...reviews]

  return (
    <div
      className={`rn-ql-rcollage__row rn-ql-rcollage__row--${direction}${paused ? ' is-paused' : ''}`}
      ref={scrollerRef}
      tabIndex={0}
      aria-label="Guest review strip"
    >
      <div
        className="rn-ql-rcollage__track"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {sequence.map((review, i) => (
          <div
            key={`${review.id}-${i}`}
            className="rn-ql-rcollage__item"
            aria-hidden={i >= reviews.length ? true : undefined}
          >
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  )
}

function SwipeRow({ reviews }: { reviews: HomeCollageReview[] }) {
  return (
    <div className="rn-ql-rcollage__swipe" aria-label="Guest review strip">
      <div className="rn-ql-rcollage__swipe-track">
        {reviews.map((review) => (
          <div key={review.id} className="rn-ql-rcollage__item">
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  )
}

const HOME_STATIC = HOME_COLLAGE_REVIEWS.slice(0, 6)

export default function HomeReviewCollage() {
  const [rowA, rowB] = homeCollageRows()
  const [mode, setMode] = useState<'marquee' | 'swipe' | 'static'>('marquee')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(pointer: coarse)')
    const update = () => {
      if (reduce.matches) setMode('static')
      else if (coarse.matches) setMode('swipe')
      else setMode('marquee')
    }
    update()
    reduce.addEventListener('change', update)
    coarse.addEventListener('change', update)
    return () => {
      reduce.removeEventListener('change', update)
      coarse.removeEventListener('change', update)
    }
  }, [])

  return (
    <section
      className="rn-ql-section rn-ql-section--inset rn-ql-rcollage"
      aria-labelledby="rn-ql-rcollage-heading"
    >
      <div className="rn-container">
        <header className="rn-ql-section__head rn-reveal">
          <div>
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Guest stories
            </p>
            <h2 id="rn-ql-rcollage-heading" className="rn-ql-h2 mt-3">
              Moments worth remembering.
            </h2>
          </div>
        </header>
      </div>

      {mode === 'static' ? (
        <div className="rn-container mt-10 sm:mt-12">
          <ul className="rn-ql-rcollage__static">
            {HOME_STATIC.map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} />
              </li>
            ))}
          </ul>
        </div>
      ) : mode === 'swipe' ? (
        <div className="rn-ql-rcollage__stage mt-10 sm:mt-12">
          <SwipeRow reviews={rowA} />
          <SwipeRow reviews={rowB} />
        </div>
      ) : (
        <div className="rn-ql-rcollage__stage mt-10 sm:mt-12">
          <MarqueeRow reviews={rowA} direction="rtl" durationSec={72} />
          <MarqueeRow reviews={rowB} direction="ltr" durationSec={84} />
        </div>
      )}
    </section>
  )
}
