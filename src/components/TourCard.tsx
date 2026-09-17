import { Link } from 'react-router-dom'

export type TourCardProps = {
  to: string
  image: string
  imageAlt: string
  title: string
  location?: string
  duration?: string
  groupSize?: string
  pickup?: boolean
  badge?: string
  priceFrom?: number
  ctaLabel?: string
  className?: string
  featured?: boolean
}

/**
 * Dark commerce card — photography first, compact meta, clear price.
 */
const TourCard = ({
  to,
  image,
  imageAlt,
  title,
  location = 'Rovaniemi',
  duration,
  groupSize,
  pickup,
  badge,
  priceFrom,
  ctaLabel = 'View details',
  className = '',
  featured = false,
}: TourCardProps) => {
  const meta = [duration, groupSize, pickup ? 'Hotel pickup' : null].filter(Boolean).join(' · ')

  return (
    <Link
      to={to}
      className={`group flex h-full flex-col overflow-hidden rounded-rn border border-white/10 bg-surface transition hover:border-aurora/40 hover:bg-surface-2 ${
        featured ? 'sm:col-span-2 lg:col-span-2' : ''
      } ${className}`}
    >
      <div className={`relative overflow-hidden bg-black ${featured ? 'aspect-[21/9] sm:aspect-[2.4/1]' : 'aspect-[4/3]'}`}>
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget
            if (el.dataset.fallback) return
            el.dataset.fallback = '1'
            el.src = '/nortti1.jpg'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        {badge && <span className="rn-badge-aurora absolute left-3 top-3">{badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium text-text-dim">{location}</p>
        <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-white sm:text-2xl">
          {title}
        </h3>
        {meta && <p className="mt-2 text-sm text-text-muted">{meta}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          {typeof priceFrom === 'number' ? (
            <p className="text-sm text-text-muted">
              From <span className="text-lg font-semibold text-white">€{priceFrom}</span>
            </p>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-aurora-soft group-hover:underline">{ctaLabel}</span>
        </div>
      </div>
    </Link>
  )
}

export default TourCard
