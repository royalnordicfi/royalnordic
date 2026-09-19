import { Link } from 'react-router-dom'

const FeaturedExperience = () => {
  return (
    <section
      className="relative overflow-hidden border-b border-white/[0.06] bg-midnight py-12 sm:py-16 lg:py-20"
      aria-label="Guaranteed Northern Lights Tour"
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
      <div className="rn-container relative">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16 xl:gap-20">
          <div className="rn-reveal relative w-full shrink-0 lg:w-[41%]">
            <div className="rn-signature-glow" aria-hidden />
            <div className="rn-signature-card group relative">
              <div className="rn-signature-card__media rn-signature-card__media--tall">
                <img
                  src="/nordicci1.jpg"
                  alt="A guest points up at a vivid green aurora over Finnish Lapland"
                  className="rn-signature-card__img"
                  loading="lazy"
                />
                <div className="rn-tour-card__shade" aria-hidden />
                <span className="rn-signature-card__label">Signature · Guaranteed</span>
              </div>
            </div>
            <div className="rn-price-chip">
              <span className="rn-price-chip__label">From</span>
              <span className="rn-price-chip__value">€149</span>
            </div>
          </div>

          <div className="rn-reveal min-w-0 flex-1">
            <p className="rn-eyebrow">Rovaniemi · Flagship experience</p>
            <h2 className="rn-h2 mt-2 text-white">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-3.5 max-w-lg text-[14.5px] leading-relaxed text-text-muted sm:text-[15px]">
              Our flagship aurora hunt. Small groups, guided by locals who chase clear sky across
              Lapland — and if the lights don't show, you're welcome back on us.
            </p>
            <p className="mt-4 text-[13px] text-text-dim">
              Small groups of 8 or fewer · Hotel pickup in Rovaniemi · Photography included
            </p>
            <div className="mt-6">
              <Link to="/northern-lights-tour" className="rn-btn-primary px-7">
                Check availability
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default FeaturedExperience
