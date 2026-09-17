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
}

/**
 * Shared commerce card — image sells; meta + price in ~3 seconds.
 * Rating omitted until a governed aggregate source exists.
 */
const TourCard = ({
  to,
  image,
  imageAlt,
  title,
  location = 'Rovaniemi, Lapland',
  duration,
  groupSize,
  pickup,
  badge,
  priceFrom,
  ctaLabel = 'View details',
  className = '',
}: TourCardProps) => {
  const meta = [duration, groupSize, pickup ? 'Hotel pickup' : null].filter(Boolean).join(' · ')

  return (
    <Link
      to={to}
      className={`group flex h-full flex-col overflow-hidden rounded-rn-lg bg-white shadow-rn-soft ring-1 ring-black/5 transition hover:shadow-rn ${className}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-midnight-soft">
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
        {badge && (
          <span className="rn-badge-on-dark absolute left-3 top-3 bg-midnight/75 backdrop-blur-sm">
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-muted">{location}</p>
        <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {title}
        </h3>
        {meta && <p className="mt-2 text-sm text-ink-muted">{meta}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {typeof priceFrom === 'number' ? (
            <p className="text-sm text-ink">
              <span className="text-ink-muted">From </span>
              <span className="text-lg font-semibold">€{priceFrom}</span>
            </p>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-aurora-deep group-hover:underline">
            {ctaLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default TourCard
