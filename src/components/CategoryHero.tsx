type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  compact?: boolean
}

const CategoryHero = ({ title, subtitle, image, compact = false }: CategoryHeroProps) => {
  return (
    <section
      className={`relative flex items-end overflow-hidden bg-[#030706] ${
        compact ? 'min-h-[34vh] sm:min-h-[38vh]' : 'min-h-[42vh] sm:min-h-[48vh]'
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
      <div className="rn-container relative z-10 w-full pb-9 pt-[calc(var(--rn-chrome-h)+1.25rem)] sm:pb-11 sm:pt-[calc(var(--rn-chrome-h)+1.75rem)]">
        <p className="rn-eyebrow">Royal Nordic</p>
        <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/78 sm:text-base">{subtitle}</p>
      </div>
    </section>
  )
}

export default CategoryHero
