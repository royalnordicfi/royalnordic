import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-[#030706]">
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/nortti1.jpg"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#050a10] via-black/45 to-black/20"
        aria-hidden
      />
      <div className="rn-hero-chrome-veil pointer-events-none absolute inset-x-0 top-0 h-36 sm:h-44" aria-hidden />

      <div className="rn-container relative z-10 flex min-h-[72svh] flex-col justify-end pb-11 pt-[calc(var(--rn-chrome-h)+1.25rem)] sm:min-h-[80svh] sm:pb-14 sm:pt-[calc(var(--rn-chrome-h)+1.75rem)]">
        <div className="rn-hero-copy max-w-lg">
          <p className="rn-eyebrow">Royal Nordic · Rovaniemi, Finnish Lapland</p>
          <h1 className="rn-display mt-3 text-[1.95rem] text-white sm:text-[2.15rem] lg:text-[2.45rem]">
            Guaranteed Northern Lights
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/76 sm:text-base">
            Small-group aurora hunts with hotel pickup and photography. If you don’t see the lights,
            join us again — free return trip per our Terms.
          </p>
          <p className="mt-4 text-xs tracking-wide text-white/55">
            Small groups · Photography · Rovaniemi
          </p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
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
