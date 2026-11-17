import { Link } from 'react-router-dom'

export default function HomeTransfers() {
  return (
    <section className="rn-ql-section" aria-labelledby="rn-ql-transfers-heading">
      <div className="rn-container">
        <div className="rn-ql-split rn-ql-split--reverse">
          <div className="rn-ql-split__media rn-reveal-img">
            <img
              src="/royal-trans-1.jpg"
              alt="Royal Nordic private transfer vehicle in Finnish Lapland"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="rn-ql-split__copy rn-reveal">
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Transfers
            </p>
            <h2 id="rn-ql-transfers-heading" className="rn-ql-h2 mt-3">
              Private transfers across Finnish Lapland
            </h2>
            <p className="rn-ql-lede mt-4">
              Door-to-door rides between Rovaniemi, Levi, Kittilä, Saariselkä and other destinations —
              timed around flights and hotel check-ins.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/transportation" className="rn-ql-btn rn-ql-btn--light">
                Book transfer
              </Link>
              <Link to="/transportation-customized" className="rn-ql-btn rn-ql-btn--ghost">
                Request a custom route
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
