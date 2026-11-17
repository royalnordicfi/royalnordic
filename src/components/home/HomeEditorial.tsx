import { Link } from 'react-router-dom'

/**
 * Full-bleed photographic storytelling moment — distinct from private/custom and flagship.
 */
export default function HomeEditorial() {
  return (
    <section className="rn-home-moment" aria-labelledby="rn-home-edit-heading">
      <div className="rn-home-moment__media" aria-hidden>
        <img
          src="/nordicci6.jpg"
          alt=""
          className="rn-home-moment__img"
          loading="lazy"
        />
        <div className="rn-home-moment__veil" />
      </div>
      <div className="rn-container relative z-10 py-20 sm:py-24 lg:py-28">
        <div className="rn-home-moment__copy rn-reveal max-w-xl">
          <p className="rn-home-eyebrow rn-home-eyebrow--on-dark">Why travel with us</p>
          <h2 id="rn-home-edit-heading" className="rn-home-h2 rn-home-h2--on-dark mt-3">
            Evenings planned around the sky — and your group
          </h2>
          <p className="mt-4 text-[15.5px] leading-relaxed text-white/78 sm:text-base">
            We read live solar and weather conditions from Rovaniemi, then drive for clearer skies
            when it matters. Hotel pickup, professional photos on our Small Group tour, and direct
            support before and after you book.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/northern-lights-tour" className="rn-home-btn rn-home-btn--primary">
              See Small Group tour
            </Link>
            <Link to="/contact" className="rn-home-btn rn-home-btn--ghost">
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
