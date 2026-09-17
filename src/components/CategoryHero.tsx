type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  compact?: boolean
}

/**
 * Shared dark photographic category/product intro — no gradient text, no dead space.
 */
const CategoryHero = ({ title, subtitle, image, compact = false }: CategoryHeroProps) => {
  return (
    <section
      className={`relative flex items-end overflow-hidden bg-black ${
        compact ? 'min-h-[38vh] sm:min-h-[42vh]' : 'min-h-[48vh] sm:min-h-[52vh]'
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
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-black/55 to-black/35" aria-hidden />
      <div className="rn-container relative z-10 w-full pb-10 pt-28 sm:pb-12 sm:pt-32">
        <h1 className="max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-white/80 sm:text-lg">{subtitle}</p>
      </div>
    </section>
  )
}

export default CategoryHero
