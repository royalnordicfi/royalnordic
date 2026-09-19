import { Link } from 'react-router-dom'

const FeaturedExperience = () => {
  return (
    <section
      className="rn-section relative overflow-hidden border-y border-white/[0.06]"
      aria-label="Guaranteed Northern Lights Tour"
    >
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle" aria-hidden />
      <div className="rn-container relative">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
          <div className="rn-reveal w-full lg:w-[44%] lg:shrink-0">
            <div className="rn-signature-card group">
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
          </div>

          <div className="rn-reveal min-w-0 flex-1">
            <p className="rn-eyebrow">From €149 · Rovaniemi</p>
            <h2 className="rn-h2 mt-2.5 text-white">
              Guaranteed Northern Lights Tour
            </h2>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-text-muted sm:text-base">
              Our flagship aurora hunt. Small groups, guided by locals who chase clear sky across
              Lapland — and if the lights don't show, you're welcome back on us.
            </p>
            <p className="mt-5 text-sm text-text-muted">
              Small groups of 8 or fewer · Hotel pickup in Rovaniemi · Photography included
            </p>
            <div className="mt-7">
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
