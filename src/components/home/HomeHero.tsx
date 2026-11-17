import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_MAX_PER_VEHICLE,
} from '../../seo/guaranteedNorthernLightsTour'

const TRUST = [
  {
    title: 'Northern Lights Guarantee',
    text: GUARANTEED_NL_GUARANTEE_SHORT,
  },
  {
    title: 'Small Groups',
    text: `Max ${GUARANTEED_NL_MAX_PER_VEHICLE} guests per vehicle.`,
  },
  {
    title: 'Local Expertise',
    text: 'Based in Rovaniemi.',
  },
]

export default function HomeHero() {
  return (
    <section className="rn-ql-hero relative overflow-hidden">
      <div className="rn-ql-hero__media absolute inset-0" aria-hidden>
        <video
          className="rn-ql-hero__video absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/nortti1.jpg"
        >
          <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
        </video>
        <div className="rn-ql-hero__grade" />
        <div className="rn-ql-hero__vignette" />
      </div>

      <div className="rn-container relative z-10 flex min-h-[100svh] flex-col justify-end pb-8 pt-[calc(var(--rn-chrome-h)+2rem)] sm:pb-10 lg:pb-12">
        <div className="rn-ql-hero__copy max-w-3xl">
          <p className="rn-ql-kicker">
            <span className="rn-ql-kicker__rule" aria-hidden />
            Rovaniemi, Finnish Lapland
          </p>
          <h1 className="rn-ql-hero__title">Experience Lapland, Your Way</h1>
          <p className="rn-ql-hero__lede">
            Northern Lights, private adventures and custom journeys — planned by a local team around
            your dates and group.
          </p>
          <div className="rn-ql-hero__actions">
            <a href="#experiences" className="rn-ql-btn rn-ql-btn--light">
              Explore Experiences
              <span aria-hidden> →</span>
            </a>
            <Link to="/customized-tour" className="rn-ql-btn rn-ql-btn--ghost">
              Plan a Private Trip
            </Link>
          </div>
        </div>

        <ul className="rn-ql-trust" aria-label="Why travellers book Royal Nordic">
          {TRUST.map((item) => (
            <li key={item.title} className="rn-ql-trust__item">
              <span className="rn-ql-trust__icon" aria-hidden />
              <div>
                <p className="rn-ql-trust__title">{item.title}</p>
                <p className="rn-ql-trust__text">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
