type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  compact?: boolean
  /** Omit for a cleaner hero; pass e.g. "Royal Nordic" when it adds context */
  eyebrow?: string | null
}

const CategoryHero = ({ title, subtitle, image, compact = false, eyebrow = null }: CategoryHeroProps) => {
  return (
    <section
      className={`relative flex items-end overflow-hidden bg-[#030706] ${
        compact ? 'min-h-[28vh] sm:min-h-[32vh]' : 'min-h-[36vh] sm:min-h-[40vh]'
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
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-32 sm:h-40" aria-hidden />
      <div
        className={`rn-container relative z-10 w-full pt-[calc(var(--rn-chrome-h)+1rem)] sm:pt-[calc(var(--rn-chrome-h)+1.35rem)] ${
          compact ? 'pb-7 sm:pb-8' : 'pb-8 sm:pb-10'
        }`}
      >
        {eyebrow ? <p className="rn-eyebrow">{eyebrow}</p> : null}
        <h1
          className={`${eyebrow ? 'mt-2' : 'mt-0'} max-w-3xl font-display font-semibold text-white ${
            compact
              ? 'text-[1.65rem] sm:text-2xl lg:text-[2.05rem]'
              : 'text-[1.85rem] sm:text-3xl lg:text-[2.35rem]'
          }`}
        >
          {title}
        </h1>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/74 sm:text-[15px]">{subtitle}</p>
      </div>
    </section>
  )
}

export default CategoryHero
