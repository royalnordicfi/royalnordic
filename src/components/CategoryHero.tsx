type CategoryHeroProps = {
  title: string
  subtitle: string
  image: string
  compact?: boolean
}

const CategoryHero = ({ title, subtitle, image, compact = false }: CategoryHeroProps) => {
  return (
    <section
      className={`relative flex items-end overflow-hidden bg-black ${
        compact ? 'min-h-[32vh] sm:min-h-[36vh]' : 'min-h-[40vh] sm:min-h-[44vh]'
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
      <div className="absolute inset-0 bg-gradient-to-t from-midnight via-black/50 to-black/30" aria-hidden />
      <div className="rn-container relative z-10 w-full pb-8 pt-24 sm:pb-10 sm:pt-28">
        <h1 className="max-w-3xl font-display text-3xl font-semibold text-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-white/80 sm:text-base">{subtitle}</p>
      </div>
    </section>
  )
}

export default CategoryHero
