import { Link } from 'react-router-dom'

/** Dedicated transfers band — restored from HomeTransfersTeaser into 2.0. */
export default function HomeTransfers() {
  return (
    <section className="rn-home-transfers" aria-labelledby="rn-home-transfers-heading">
      <div className="rn-home-transfers__grid">
        <div className="rn-home-transfers__media rn-reveal-img">
          <img
            src="/royal-trans-1.jpg"
            alt="Royal Nordic private transfer vehicle in Finnish Lapland"
            className="rn-home-transfers__img"
            loading="lazy"
            decoding="async"
          />
          <div className="rn-home-transfers__shade" aria-hidden />
        </div>
        <div className="rn-home-transfers__copy rn-reveal">
          <p className="rn-home-eyebrow rn-home-eyebrow--on-dark">Transfers</p>
          <h2 id="rn-home-transfers-heading" className="rn-home-h2 rn-home-h2--on-dark mt-3">
            Private transfers across Finnish Lapland
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/75">
            Door-to-door rides between Rovaniemi, Levi, Kittilä, Saariselkä and other destinations —
            timed around flights and hotel check-ins.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/transportation" className="rn-home-btn rn-home-btn--primary">
              Book transfer
            </Link>
            <Link to="/transportation-customized" className="rn-home-btn rn-home-btn--ghost">
              Request a custom route
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
