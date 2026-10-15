import { Link } from 'react-router-dom'

export type TourCardProps = {
  to: string
  image: string
  imageAlt: string
  title: string
  description?: string
  location?: string
  duration?: string
  groupSize?: string
  pickup?: boolean
  badge?: string
  priceFrom?: number
  /** Optional struck-through reference price (sale presentation) */
  referencePrice?: number
  /** Shown after price — default "/ adult" */
  priceUnit?: string
  ctaLabel?: string
  className?: string
  /** @deprecated Uniform cards only — ignored for sizing */
  featured?: boolean
  imagePosition?: string
}

function formatMoney(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function discountPercent(reference: number, current: number) {
  if (reference <= 0 || current >= reference) return 0
  return Math.round(((reference - current) / reference) * 100)
}

const TourCard = ({
  to,
  image,
  imageAlt,
  title,
  description,
  location = 'Rovaniemi',
  duration,
  groupSize,
  pickup,
  badge,
  priceFrom,
  referencePrice,
  priceUnit = '/ adult',
  ctaLabel = 'Explore',
  className = '',
  imagePosition = 'center',
}: TourCardProps) => {
  const meta = [duration, groupSize, pickup ? 'Hotel pickup' : null].filter(Boolean).join(' · ')
  const showSale =
    typeof priceFrom === 'number' &&
    typeof referencePrice === 'number' &&
    referencePrice > priceFrom
  const pct = showSale ? discountPercent(referencePrice!, priceFrom!) : 0

  return (
    <Link to={to} className={`rn-tour-card group ${className}`}>
      <div className="rn-tour-card__media">
        <img
          src={image}
          alt={imageAlt}
          className="rn-tour-card__img"
          style={{ objectPosition: imagePosition }}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget
            if (el.dataset.fallback) return
            el.dataset.fallback = '1'
            el.src = '/nortti1.jpg'
          }}
        />
        <div className="rn-tour-card__shade" aria-hidden />
        {badge && <span className="rn-tour-card__badge">{badge}</span>}
        {pct > 0 ? (
          <span className="rn-tour-card__pct" aria-label={`${pct}% off`}>
            −{pct}%
          </span>
        ) : null}
      </div>
      <div className="rn-tour-card__body">
        <p className="rn-tour-card__eyebrow">{location}</p>
        <h3 className="rn-tour-card__title">{title}</h3>
        {description && <p className="rn-tour-card__desc">{description}</p>}
        {meta && <p className="rn-tour-card__meta">{meta}</p>}
        <div className="rn-tour-card__foot">
          {typeof priceFrom === 'number' ? (
            <div className="rn-tour-card__price">
              {showSale ? (
                <p className="rn-tour-card__price-row">
                  <span className="rn-tour-card__was">€{formatMoney(referencePrice!)}</span>
                  <span className="rn-tour-card__now">€{formatMoney(priceFrom)}</span>
                </p>
              ) : (
                <p className="rn-tour-card__price-row">
                  <span className="rn-tour-card__now rn-tour-card__now--plain">€{formatMoney(priceFrom)}</span>
                </p>
              )}
              <span className="rn-tour-card__per">{priceUnit}</span>
            </div>
          ) : (
            <span />
          )}
          <span className="rn-tour-card__cta">
            {ctaLabel}
            <span className="rn-tour-card__arrow" aria-hidden>
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  )
}

export default TourCard
