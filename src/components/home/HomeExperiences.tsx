import { Link } from 'react-router-dom'

const CARDS = [
  {
    to: '/northern-lights-tours',
    image: '/nortti1.jpg',
    alt: 'Guests watching the Northern Lights in Finnish Lapland',
    tag: 'Flagship',
    title: 'Northern Lights',
    text: 'Small-group and private aurora evenings from Rovaniemi.',
  },
  {
    to: '/daytime-experiences',
    image: '/korouoma1.jpg',
    alt: 'Snowy canyon landscape on a Lapland day tour',
    tag: 'Daytime',
    title: 'Day adventures',
    text: 'Ice fishing, wildlife, snowshoeing and Arctic landscapes.',
  },
  {
    to: '/customized-tour',
    image: '/nortti5.jpg',
    alt: 'Quiet winter evening suited to a private Lapland itinerary',
    tag: 'Private',
    title: 'Private & custom',
    text: 'Tailored evenings and multi-experience days for your group.',
  },
  {
    to: '/transportation',
    image: '/slideshow2.jpg',
    alt: 'Winter road travel across Finnish Lapland',
    tag: 'Transfers',
    title: 'Transfers',
    text: 'Private rides between Rovaniemi, Levi, Saariselkä and more.',
  },
]

export default function HomeExperiences() {
  return (
    <section className="rn-home-section rn-home-section--ivory" aria-labelledby="rn-home-exp-heading">
      <div className="rn-container">
        <header className="rn-home-section__head rn-reveal">
          <p className="rn-home-eyebrow">Experiences</p>
          <h2 id="rn-home-exp-heading" className="rn-home-h2">
            Choose how you explore Lapland
          </h2>
          <p className="rn-home-lede">
            Four clear paths — each with photography-led pages and direct booking where available.
          </p>
        </header>

        <ul className="rn-home-exp-grid rn-stagger mt-10 sm:mt-12">
          {CARDS.map((card) => (
            <li key={card.to}>
              <Link to={card.to} className="rn-home-exp-card rn-reveal group">
                <div className="rn-home-exp-card__media">
                  <img
                    src={card.image}
                    alt={card.alt}
                    className="rn-home-exp-card__img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="rn-home-exp-card__shade" aria-hidden />
                  <span className="rn-home-exp-card__tag">{card.tag}</span>
                </div>
                <div className="rn-home-exp-card__body">
                  <h3 className="rn-home-exp-card__title">{card.title}</h3>
                  <p className="rn-home-exp-card__text">{card.text}</p>
                  <span className="rn-home-exp-card__cta">
                    Explore
                    <span aria-hidden> →</span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
