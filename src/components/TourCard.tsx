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
      className={`group flex h-full flex-col overflow-hidden rounded-rn bg-surface transition hover:bg-surface-2 ${
        featured ? 'sm:col-span-2' : ''
      } ${className}`}
    >
      <div className={`relative overflow-hidden bg-black ${featured ? 'aspect-[21/9] sm:aspect-[2.2/1]' : 'aspect-[16/11]'}`}>
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const el = e.currentTarget
            if (el.dataset.fallback) return
            el.dataset.fallback = '1'
            el.src = '/nortti1.jpg'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        {badge && (
          <span className="absolute left-3 top-3 rounded bg-black/65 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-aurora-soft backdrop-blur-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-4 py-3.5 sm:px-4 sm:py-4">
        <p className="text-xs text-text-dim">{location}</p>
        <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug text-white sm:text-xl">
          {title}
        </h3>
        {meta && <p className="mt-1.5 text-sm text-text-muted">{meta}</p>}
        <div className="mt-auto flex items-baseline justify-between gap-3 pt-3">
          {typeof priceFrom === 'number' ? (
            <p className="text-sm text-text-muted">
              From <span className="font-semibold text-white">€{priceFrom}</span>
            </p>
          ) : (
            <span />
          )}
          <span className="text-sm font-medium text-aurora-soft group-hover:underline">{ctaLabel}</span>
        </div>
      </div>
    </Link>
  )
}

export default TourCard
