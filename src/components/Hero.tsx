import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="relative flex min-h-[78svh] items-end overflow-hidden bg-black pb-12 pt-24 sm:min-h-[85svh] sm:items-center sm:pb-16 sm:pt-28">
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
        className="absolute inset-0 bg-gradient-to-t from-midnight via-black/45 to-black/20"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" aria-hidden />

      <div className="rn-container relative z-10 w-full">
        <div className="max-w-xl">
          <p className="rn-eyebrow">Rovaniemi · Finnish Lapland</p>
          <h1 className="mt-3 font-display text-[2rem] font-semibold leading-[1.1] text-white sm:text-4xl lg:text-[2.75rem]">
            Guaranteed Northern Lights from Rovaniemi
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/80 sm:text-base">
            Small-group aurora hunts with hotel pickup. If you don’t see the lights, you can join us
            again — free return trip per our Terms.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Link to="/northern-lights-tour" className="rn-btn-primary px-6">
              Book Guaranteed Northern Lights
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
