import { Link } from 'react-router-dom'

export default function HomePrivate() {
  return (
    <section className="rn-ql-section rn-ql-section--inset" aria-labelledby="rn-ql-private-heading">
      <div className="rn-container">
        <div className="rn-ql-split">
          <div className="rn-ql-split__copy rn-reveal">
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Private & custom
            </p>
            <h2 id="rn-ql-private-heading" className="rn-ql-h2 mt-3">
              Plan a Lapland itinerary around your dates and pace
            </h2>
            <p className="rn-ql-lede mt-4">
              Couples, families, and private groups use Royal Nordic for tailored evenings and
              multi-experience days — quoted personally, not pulled from a fixed catalogue.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/customized-tour" className="rn-ql-btn rn-ql-btn--light">
                Plan your private experience
              </Link>
              <Link to="/travel-trade" className="rn-ql-btn rn-ql-btn--ghost">
                Travel trade partners
              </Link>
            </div>
          </div>
          <div className="rn-ql-split__media rn-reveal-img">
            <img
              src="/nortti5.jpg"
              alt="Quiet Lapland evening suited to a private itinerary"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
