import { Link } from 'react-router-dom'

/**
 * Private & custom itinerary band — restored from PrivateCustomSection into 2.0.
 * Distinct composition from the ivory editorial storytelling section.
 */
export default function HomePrivate() {
  return (
    <section className="rn-home-private" aria-labelledby="rn-home-private-heading">
      <div className="rn-home-private__grid">
        <div className="rn-home-private__media rn-reveal-img">
          <img
            src="/nordicci7.jpg"
            alt="A couple walks a snowy Lapland road beneath a swirling green aurora"
            className="rn-home-private__img"
            loading="lazy"
            decoding="async"
          />
          <div className="rn-home-private__shade" aria-hidden />
        </div>
        <div className="rn-home-private__panel rn-reveal">
          <p className="rn-home-eyebrow rn-home-eyebrow--on-dark">Private & custom</p>
          <h2 id="rn-home-private-heading" className="rn-home-h2 rn-home-h2--on-dark mt-3">
            Plan a Lapland itinerary around your dates, group, and pace
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/75">
            Couples, families, and private groups use Royal Nordic for tailored evenings and
            multi-experience days — quoted personally, not pulled from a fixed catalogue.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link to="/customized-tour" className="rn-home-btn rn-home-btn--primary">
              Plan your private experience
            </Link>
            <Link to="/travel-trade" className="rn-home-btn rn-home-btn--ghost">
              Travel trade partners
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
