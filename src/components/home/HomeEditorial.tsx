import { Link } from 'react-router-dom'

export default function HomeEditorial() {
  return (
    <section className="rn-home-section rn-home-section--ivory" aria-labelledby="rn-home-edit-heading">
      <div className="rn-container">
        <div className="rn-home-editorial grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="rn-reveal rn-reveal-img lg:col-span-7">
            <figure className="rn-home-editorial__frame">
              <img
                src="/nordicci6.jpg"
                alt="Aurora over a snow-covered Lapland forest"
                className="rn-home-editorial__img"
                loading="lazy"
              />
            </figure>
          </div>
          <div className="rn-reveal max-w-lg lg:col-span-5">
            <p className="rn-home-eyebrow">Local planning</p>
            <h2 id="rn-home-edit-heading" className="rn-home-h2 mt-3">
              Evenings planned around the sky — and your group
            </h2>
            <p className="rn-home-lede mt-4">
              We read live solar and weather conditions from Rovaniemi, then drive for clearer skies
              when it matters. Hotel pickup, professional photos on our Small Group tour, and direct
              support before and after you book.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/customized-tour" className="rn-home-btn rn-home-btn--forest">
                Plan a private trip
              </Link>
              <Link to="/travel-trade" className="rn-home-btn rn-home-btn--text">
                Travel trade partners
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
