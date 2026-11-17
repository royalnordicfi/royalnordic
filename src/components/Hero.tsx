import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_GUARANTEE_SHORT,
  GUARANTEED_NL_MAX_PER_VEHICLE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'

const trustItems = [
  {
    title: 'Northern Lights guarantee',
    text: GUARANTEED_NL_GUARANTEE_SHORT,
  },
  {
    title: 'Small groups',
    text: `Max ${GUARANTEED_NL_MAX_PER_VEHICLE} guests per vehicle on our Small Group tour.`,
  },
  {
    title: 'Local guides',
    text: 'Hotel pickup in Rovaniemi and free professional photos with the aurora.',
  },
]

const Hero = () => {
  return (
    <section className="rn-hero rn-hero--cinema relative overflow-hidden bg-midnight">
      <div className="rn-hero-media absolute inset-0" aria-hidden>
        <video
          className="rn-hero-video absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/nortti1.jpg"
        >
          <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
        </video>
        <div className="rn-hero-grade" />
      </div>

      <div className="rn-hero-vignette pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="rn-hero-scrim pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      <div className="rn-hero-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1]" aria-hidden />
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 sm:h-40" aria-hidden />

      <div className="rn-container relative z-10 flex min-h-[88svh] flex-col justify-end pb-8 pt-[calc(var(--rn-chrome-h)+1.35rem)] sm:min-h-[92svh] sm:pb-10 sm:pt-[calc(var(--rn-chrome-h)+1.85rem)] lg:pb-12">
        <div className="rn-hero-copy max-w-rn-narrow">
          <p className="rn-eyebrow rn-hero-eyebrow">
            Royal Nordic · Rovaniemi, Finnish&nbsp;Lapland
          </p>
          <h1 className="rn-display rn-hero-title mt-3.5 text-white sm:mt-4">
            Experience Lapland,
            <br className="hidden sm:block" /> your&nbsp;way.
          </h1>
          <p className="rn-hero-lede mt-4 max-w-rn-measure text-[15.5px] leading-relaxed text-white/80 sm:mt-5 sm:text-[17px] sm:leading-[1.62]">
            Northern Lights, private experiences, custom journeys and transfers across Finnish
            Lapland — planned by a local team around your dates and group.
          </p>
          <div className="rn-hero-cta mt-8 flex flex-wrap items-center gap-3 sm:mt-9 sm:gap-4">
            <Link to="/northern-lights-tours" className="rn-btn-primary min-h-[50px] px-8 sm:px-9">
              Explore the Northern Lights
            </Link>
            <Link to="/northern-lights-tour" className="rn-hero-ghost">
              Book Small Group tour
            </Link>
          </div>
          <p className="rn-hero-offer mt-5 text-sm text-white/65 sm:mt-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">
              Flagship offer
            </span>
            <span className="mt-1.5 block sm:mt-0 sm:ml-3 sm:inline">
              <span className="line-through decoration-[color-mix(in_srgb,var(--rn-sale)_80%,transparent)] text-white/40">
                €{GUARANTEED_NL_REFERENCE_ADULT_PRICE}
              </span>{' '}
              <span className="font-display text-xl font-semibold text-[var(--rn-sale)]">
                €{GUARANTEED_NL_CATALOG_ADULT_PRICE}
              </span>
              <span className="ml-1">/ adult · Small Group Northern Lights</span>
            </span>
          </p>
        </div>

        <ul
          className="rn-hero-trust rn-reveal mt-10 grid gap-0 sm:mt-12 sm:grid-cols-3"
          aria-label="Why travellers book Royal Nordic"
        >
          {trustItems.map((item) => (
            <li key={item.title} className="rn-hero-trust__item">
              <p className="rn-hero-trust__title">{item.title}</p>
              <p className="rn-hero-trust__text">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Hero
