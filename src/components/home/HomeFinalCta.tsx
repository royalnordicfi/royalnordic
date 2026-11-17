import { Link } from 'react-router-dom'

export default function HomeFinalCta() {
  return (
    <section className="rn-ql-section rn-ql-section--final" aria-labelledby="rn-ql-final-heading">
      <div className="rn-container">
        <div className="rn-ql-final rn-reveal">
          <div className="rn-ql-final__media" aria-hidden>
            <img src="/nortti3.jpg" alt="" />
            <div className="rn-ql-final__veil" />
          </div>
          <div className="rn-ql-final__copy">
            <h2 id="rn-ql-final-heading" className="rn-ql-h2 rn-ql-h2--center">
              Ready to Experience Lapland?
            </h2>
            <p className="rn-ql-final__lede">
              Book your tour today and see the Northern Lights with us.
            </p>
            <Link to="/northern-lights-tour" className="rn-ql-btn rn-ql-btn--light mt-8">
              Book a tour
              <span aria-hidden> →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
