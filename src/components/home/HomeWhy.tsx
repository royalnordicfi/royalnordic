import { Link } from 'react-router-dom'

export default function HomeWhy() {
  return (
    <section className="rn-ql-section" aria-labelledby="rn-ql-why-heading">
      <div className="rn-container">
        <div className="rn-ql-why">
          <div className="rn-ql-why__media rn-reveal-img">
            <img
              src="/nordicci7.jpg"
              alt="Traveller watching the Northern Lights in Finnish Lapland"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="rn-ql-why__copy rn-reveal">
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Why Royal Nordic
            </p>
            <h2 id="rn-ql-why-heading" className="rn-ql-h2 mt-3">
              Local Expertise in the Arctic
            </h2>
            <p className="rn-ql-lede mt-4">
              A team based in Rovaniemi, creating carefully planned experiences in Lapland — reading
              live sky and weather conditions, then driving for clearer views when it matters.
            </p>
            <Link to="/northern-lights-tour" className="rn-ql-btn rn-ql-btn--ghost mt-8">
              Learn more
              <span aria-hidden> →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
