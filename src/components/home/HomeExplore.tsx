import { Link } from 'react-router-dom'

const PATHS = [
  {
    to: '/northern-lights-tours',
    image: '/nordicci1.jpg',
    title: 'Northern Lights',
    text: 'Small-group and private aurora evenings from Rovaniemi.',
    lead: true,
  },
  {
    to: '/daytime-experiences',
    image: '/korouoma1.jpg',
    title: 'Day adventures',
    text: 'Ice fishing, wildlife, canyons and Arctic landscapes.',
  },
  {
    to: '/customized-tour',
    image: '/nortti5.jpg',
    title: 'Private & custom',
    text: 'Itineraries planned around your dates and group.',
  },
  {
    to: '/transportation',
    image: '/royal-trans-1.jpg',
    title: 'Transfers',
    text: 'Private rides across Finnish Lapland.',
  },
] as const

export default function HomeExplore() {
  const lead = PATHS.find((p) => 'lead' in p && p.lead)!
  const rest = PATHS.filter((p) => p !== lead)

  return (
    <section
      id="experiences"
      className="rn-ql-section scroll-mt-28"
      aria-labelledby="rn-ql-explore-heading"
    >
      <div className="rn-container">
        <header className="rn-ql-section__head rn-reveal">
          <div>
            <p className="rn-ql-kicker rn-ql-kicker--section">
              <span className="rn-ql-kicker__rule" aria-hidden />
              Experiences
            </p>
            <h2 id="rn-ql-explore-heading" className="rn-ql-h2 mt-3">
              Explore Lapland with us
            </h2>
            <p className="rn-ql-lede mt-3">
              Photography-led evenings, daytime wilderness, private itineraries, and transfers —
              each with clear booking where available.
            </p>
          </div>
        </header>

        <div className="rn-ql-explore mt-10 sm:mt-12">
          <Link to={lead.to} className="rn-ql-explore__lead rn-reveal group">
            <img src={lead.image} alt="" className="rn-ql-explore__img" loading="lazy" />
            <div className="rn-ql-explore__shade" aria-hidden />
            <div className="rn-ql-explore__copy">
              <p className="rn-ql-kicker rn-ql-kicker--on-media">
                <span className="rn-ql-kicker__rule" aria-hidden />
                Flagship
              </p>
              <h3 className="rn-ql-explore__title">{lead.title}</h3>
              <p className="rn-ql-explore__text">{lead.text}</p>
            </div>
          </Link>
          <ul className="rn-ql-explore__side">
            {rest.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="rn-ql-explore__row rn-reveal group">
                  <div className="rn-ql-explore__thumb">
                    <img src={item.image} alt="" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="rn-ql-explore__row-title">{item.title}</h3>
                    <p className="rn-ql-explore__row-text">{item.text}</p>
                  </div>
                  <span className="rn-ql-feat-card__arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
