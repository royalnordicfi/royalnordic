import type { ReactNode } from 'react'

type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  /** Default true — category pages use the compact, controlled hero height. */
  compact?: boolean
  /** Omit for a cleaner hero; pass e.g. "Royal Nordic · Aurora" when it adds context */
  eyebrow?: string | null
  /** Optional lead row (e.g. article back link) stacked above the title */
  lead?: ReactNode
  /** Optional CTA row below the supporting text */
  actions?: ReactNode
}

const CategoryHero = ({
  title,
  subtitle,
  image,
  compact = true,
  eyebrow = null,
  lead = null,
  actions = null,
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
        className={`rn-container rn-hero-pad relative z-10 w-full ${
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
        {actions ? <div className="mt-5 flex flex-wrap gap-3 sm:mt-6">{actions}</div> : null}
      </div>
    </section>
  )
}

export default CategoryHero
