import { Link } from 'react-router-dom'
import {
  GUARANTEED_NL_CATALOG_ADULT_PRICE,
  GUARANTEED_NL_REFERENCE_ADULT_PRICE,
} from '../seo/guaranteedNorthernLightsTour'

const Hero = () => {
  return (
    <section className="rn-hero relative overflow-hidden bg-[#030706]">
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
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 z-[1] h-36 sm:h-48" aria-hidden />

      <div className="rn-container relative z-10 flex min-h-[74svh] flex-col justify-end pb-16 pt-[calc(var(--rn-chrome-h)+1.25rem)] sm:min-h-[90svh] sm:pb-28 sm:pt-[calc(var(--rn-chrome-h)+2.25rem)] lg:pb-36">
        <div className="rn-hero-copy max-w-rn-narrow">
          <p className="rn-eyebrow rn-hero-eyebrow">
            Royal Nordic · Rovaniemi, Finnish&nbsp;Lapland
          </p>
          <h1 className="rn-display rn-hero-title mt-4 text-white sm:mt-5">
            Experience Lapland,
            <br className="hidden sm:block" /> your&nbsp;way.
          </h1>
          <p className="rn-hero-lede mt-4 max-w-rn-measure text-[15px] leading-relaxed text-white/78 sm:mt-6 sm:text-[17px] sm:leading-[1.65]">
            Northern Lights, private experiences, custom journeys and transfers across Finnish
            Lapland — planned by a local team around your dates and group.
          </p>
          <div className="rn-hero-cta mt-8 flex flex-wrap items-center gap-2.5 sm:mt-10 sm:gap-4">
            <Link to={{ pathname: '/', hash: 'experiences' }} className="rn-btn-primary min-h-[48px] px-7 sm:px-8">
              Explore experiences
            </Link>
            <Link to="/northern-lights-tour" className="rn-hero-ghost">
              Book Northern Lights
            </Link>
          </div>
          <p className="mt-5 flex flex-col gap-1 text-sm text-white/65 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
              Flagship offer
            </span>
            <span>
              <span className="line-through decoration-sale/80 text-white/40">
                €{GUARANTEED_NL_REFERENCE_ADULT_PRICE}
              </span>{' '}
              <span className="font-display text-xl font-semibold text-white">
                €{GUARANTEED_NL_CATALOG_ADULT_PRICE}
              </span>
              <span className="ml-1">/ adult · Guaranteed Northern Lights</span>
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Hero
