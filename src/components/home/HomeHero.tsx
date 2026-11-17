import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../../seo/guaranteedNorthernLightsTour'
import HomeDiscover from './HomeDiscover'

export default function HomeHero() {
  return (
    <section className="rn-home-hero relative overflow-hidden">
      <div className="rn-home-hero__media absolute inset-0" aria-hidden>
        <video
          className="rn-home-hero__video absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/nortti1.jpg"
        >
          <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
        </video>
        <div className="rn-home-hero__grade" />
        <div className="rn-home-hero__vignette" />
        <div className="rn-home-hero__scrim" />
      </div>
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 sm:h-40" aria-hidden />

      <div className="rn-container relative z-10 flex min-h-[100svh] flex-col justify-end pb-8 pt-[calc(var(--rn-chrome-h)+1.5rem)] sm:pb-10 sm:pt-[calc(var(--rn-chrome-h)+2rem)] lg:pb-12">
        <div className="rn-home-hero__copy max-w-3xl">
          <p className="rn-home-hero__eyebrow">Royal Nordic · Rovaniemi, Finnish Lapland</p>
          <h1 className="rn-home-hero__title">
            Experience Lapland,
            <br className="hidden sm:block" /> your way.
          </h1>
          <p className="rn-home-hero__lede">
            Northern Lights evenings, daytime adventures, private itineraries and transfers —
            planned by a local team around your dates and group.
          </p>
          <div className="rn-home-hero__actions">
            <Link to="/northern-lights-tour" className="rn-home-btn rn-home-btn--primary">
              Book Northern Lights
            </Link>
            <a href="#experiences" className="rn-home-btn rn-home-btn--ghost">
              Explore experiences
            </a>
          </div>
          <p className="rn-home-hero__offer">
            <span>Flagship from</span>{' '}
            <span className="rn-home-hero__was">€{GUARANTEED_NL_REFERENCE_ADULT_PRICE}</span>{' '}
            <span className="rn-home-hero__now">€{GUARANTEED_NL_CATALOG_ADULT_PRICE}</span>
            <span> / adult · Small Group tour</span>
          </p>
          <ul className="rn-home-hero__trust" aria-label="Why travellers book with us">
            <li>Aurora guarantee on Small Group tour</li>
            <li>Max 8 guests per vehicle</li>
            <li>Local guides from Rovaniemi</li>
          </ul>
        </div>

        <div className="rn-home-hero__discover mt-8 sm:mt-10 lg:mt-12">
          <HomeDiscover />
        </div>
      </div>
    </section>
  )
}
