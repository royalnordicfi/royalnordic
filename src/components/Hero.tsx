import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#030706]">
      <img
        src="/lights2.jpg"
        alt="Vivid green Northern Lights arcing over a snow-covered forest near Rovaniemi"
        className="rn-hero-photo absolute inset-0 h-full w-full object-cover"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/30 to-black/10"
        aria-hidden
      />
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-36 sm:h-44" aria-hidden />

      <div className="rn-container relative z-10 flex min-h-[76svh] flex-col justify-end pb-12 pt-[calc(var(--rn-chrome-h)+1.25rem)] sm:min-h-[86svh] sm:pb-16 sm:pt-[calc(var(--rn-chrome-h)+1.75rem)]">
        <div className="rn-hero-copy max-w-[38rem]">
          <p className="rn-eyebrow">Royal Nordic · Rovaniemi, Finnish&nbsp;Lapland</p>
          <h1 className="rn-display rn-hero-title mt-4 text-white">
            Guaranteed Northern Lights
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/78 sm:text-base">
            Small-group aurora hunts from Rovaniemi. No lights? Free return trip per our Terms.
          </p>
          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Link to="/northern-lights-tour" className="rn-btn-primary px-6">
              Explore the Northern Lights
            </Link>
            <a href="#experiences" className="rn-btn-secondary px-6">
              Explore experiences
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
