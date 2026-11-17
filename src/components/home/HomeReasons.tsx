import {
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_MAX_PER_VEHICLE,
} from '../../seo/guaranteedNorthernLightsTour'

const REASONS = [
  {
    title: 'Northern Lights guarantee',
    text: GUARANTEED_NL_GUARANTEE_SHORT,
  },
  {
    title: 'Small groups',
    text: `Our Small Group Northern Lights Tour caps at ${GUARANTEED_NL_MAX_PER_VEHICLE} guests per vehicle.`,
  },
  {
    title: 'Professional photography',
    text: 'On the Small Group tour, your guide photographs you with the aurora.',
  },
  {
    title: 'Book direct',
    text: 'Secure online checkout, hotel pickup coordination, and WhatsApp help from Rovaniemi.',
  },
]

export default function HomeReasons() {
  return (
    <section className="rn-home-section rn-home-section--sage" aria-labelledby="rn-home-why-heading">
      <div className="rn-container">
        <header className="rn-home-section__head rn-reveal max-w-2xl">
          <p className="rn-home-eyebrow">Why Royal Nordic</p>
          <h2 id="rn-home-why-heading" className="rn-home-h2">
            Clear reasons travellers book with us
          </h2>
        </header>
        <ul className="rn-home-reasons rn-stagger mt-10 sm:mt-12">
          {REASONS.map((item) => (
            <li key={item.title} className="rn-home-reason rn-reveal">
              <h3 className="rn-home-reason__title">{item.title}</h3>
              <p className="rn-home-reason__text">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
