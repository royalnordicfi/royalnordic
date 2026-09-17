import { Link } from 'react-router-dom'

const Hero = () => {
  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden bg-midnight pb-16 pt-28 sm:items-center sm:pb-24 sm:pt-32">
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/nortti1.jpg"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ zIndex: 1 }}
      >
        <source src="/northernlightsvideo_final.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 z-[2] bg-gradient-to-t from-midnight via-midnight/55 to-midnight/30"
        aria-hidden
      />
      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-midnight/50 via-transparent to-transparent" aria-hidden />

      <div className="rn-container relative z-10 w-full">
        <div className="max-w-2xl">
          <p className="rn-eyebrow text-aurora-soft">Rovaniemi · Finnish Lapland</p>
          <h1 className="mt-4 font-display text-[2.35rem] font-semibold leading-[1.05] text-snow sm:text-5xl lg:text-6xl">
            Experience Lapland
            <span className="mt-1 block text-snow/90">beyond the ordinary.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-snow/80 sm:text-lg">
            Small-group Northern Lights hunts, day adventures, and private itineraries —
            booked direct from a local Rovaniemi operator.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link to="/northern-lights-tour" className="rn-btn-primary px-8">
              Book Guaranteed Northern Lights
            </Link>
            <a href="#experiences" className="rn-btn-secondary px-8">
              Explore experiences
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
