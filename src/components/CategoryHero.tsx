import type { ReactNode } from 'react'

type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  compact?: boolean
  /** Omit for a cleaner hero; pass e.g. "Royal Nordic" when it adds context */
  eyebrow?: string | null
  /** Optional lead row (e.g. article back link) stacked above the title */
  lead?: ReactNode
}

const CategoryHero = ({
  title,
  subtitle,
  image,
  compact = false,
  eyebrow = null,
  lead = null,
}: CategoryHeroProps) => {
  return (
    <section
      className={`rn-category-hero relative flex items-end overflow-hidden bg-[var(--rn-midnight)] ${
        compact ? 'rn-category-hero--compact' : ''
      }`}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
        onError={(e) => {
          e.currentTarget.src = '/nortti1.jpg'
        }}
      />
      <div className="rn-category-hero__veil" aria-hidden />
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-28 sm:h-36" aria-hidden />
      <div
        className={`rn-container relative z-10 w-full pt-[calc(var(--rn-chrome-h)+1.35rem)] sm:pt-[calc(var(--rn-chrome-h)+1.5rem)] ${
          compact ? 'pb-7 sm:pb-8' : 'pb-8 sm:pb-10'
        }`}
      >
        {lead ? <div className="mb-3.5 sm:mb-4">{lead}</div> : null}
        {eyebrow ? <p className="rn-eyebrow">{eyebrow}</p> : null}
        <h1
          className={`rn-category-hero__title ${eyebrow || lead ? 'mt-2' : 'mt-0'} ${
            compact ? 'rn-category-hero__title--compact' : ''
          }`}
        >
          {title}
        </h1>
        <p className="rn-category-hero__lede">{subtitle}</p>
      </div>
    </section>
  )
}

export default CategoryHero
