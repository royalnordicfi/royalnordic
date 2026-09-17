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
  ctaLabel?: string
  className?: string
  /** @deprecated Uniform cards only — ignored for sizing */
  featured?: boolean
  imagePosition?: string
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
  ctaLabel = 'Explore',
  className = '',
  imagePosition = 'center',
}: TourCardProps) => {
  const meta = [duration, groupSize, pickup ? 'Hotel pickup' : null].filter(Boolean).join(' · ')

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
      </div>
      <div className="rn-tour-card__body">
        <p className="rn-tour-card__eyebrow">{location}</p>
        <h3 className="rn-tour-card__title">{title}</h3>
        {description && <p className="rn-tour-card__desc">{description}</p>}
        {meta && <p className="rn-tour-card__meta">{meta}</p>}
        <div className="rn-tour-card__foot">
          {typeof priceFrom === 'number' ? (
            <p className="rn-tour-card__price">
              From <span>€{priceFrom}</span>
            </p>
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
