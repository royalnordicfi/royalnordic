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
      className={`relative flex items-end overflow-hidden bg-[#030706] ${
        compact ? 'min-h-[26vh] sm:min-h-[30vh]' : 'min-h-[34vh] sm:min-h-[40vh]'
      }`}
    >
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
        onError={(e) => {
          e.currentTarget.src = '/nortti1.jpg'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-black/55 to-black/30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--rn-midnight)] to-transparent sm:h-20"
        aria-hidden
      />
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-32 sm:h-40" aria-hidden />
      <div
        className={`rn-container relative z-10 w-full pt-[calc(var(--rn-chrome-h)+1.5rem)] sm:pt-[calc(var(--rn-chrome-h)+1.65rem)] ${
          compact ? 'pb-8 sm:pb-9' : 'pb-9 sm:pb-11'
        }`}
      >
        {lead ? <div className="mb-4 sm:mb-5">{lead}</div> : null}
        {eyebrow ? <p className="rn-eyebrow">{eyebrow}</p> : null}
        <h1
          className={`${eyebrow || lead ? 'mt-2' : 'mt-0'} max-w-3xl font-display font-semibold text-white ${
            compact
              ? 'text-[1.65rem] leading-[1.13] sm:text-[2.15rem] lg:text-[2.55rem]'
              : 'text-[1.85rem] leading-[1.1] sm:text-[2.65rem] lg:text-[3.25rem]'
          }`}
        >
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-white/74 sm:mt-3.5 sm:text-[15px]">
          {subtitle}
        </p>
      </div>
    </section>
  )
}

export default CategoryHero
