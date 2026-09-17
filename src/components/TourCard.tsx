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
  featured?: boolean
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
  featured = false,
}: TourCardProps) => {
  const meta = [duration, groupSize, pickup ? 'Hotel pickup' : null].filter(Boolean).join(' · ')

  return (
    <Link
      to={to}
      className={`group rn-reveal flex h-full flex-col overflow-hidden rounded-rn border border-white/[0.07] bg-surface/80 transition duration-500 hover:border-aurora/25 hover:bg-surface-2 ${
        featured ? 'sm:col-span-2' : ''
      } ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-black ${
          featured ? 'aspect-[16/9]' : 'aspect-[16/10]'
        }`}
      >
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget
            if (el.dataset.fallback) return
            el.dataset.fallback = '1'
            el.src = '/nortti1.jpg'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {badge && (
          <span className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-aurora-soft">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-4 sm:py-4">
        <p className="text-[11px] uppercase tracking-[0.14em] text-text-dim">{location}</p>
        <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-white sm:text-xl">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{description}</p>
        )}
        {meta && !description && <p className="mt-1.5 text-sm text-text-muted">{meta}</p>}
        {meta && description && <p className="mt-1.5 text-xs text-text-dim">{meta}</p>}
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          {typeof priceFrom === 'number' ? (
            <p className="text-sm text-text-muted">
              From <span className="font-semibold text-white">€{priceFrom}</span>
            </p>
          ) : (
            <span />
          )}
          <span className="text-sm font-medium text-aurora-soft transition group-hover:translate-x-0.5">
            {ctaLabel} →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default TourCard
