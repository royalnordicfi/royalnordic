const EditorialMoment = () => {
  return (
    <section className="relative overflow-hidden bg-black" aria-label="Finnish Lapland at night">
      <div className="rn-section-bridge rn-section-bridge--from-black absolute inset-x-0 top-0 z-[2] !m-0 h-20 sm:h-36" aria-hidden />
      <div className="rn-reveal-img relative h-[44vh] min-h-[300px] w-full sm:h-[58vh] sm:min-h-[380px] lg:h-[68vh]">
        <img
          src="/nordicci6.jpg"
          alt="Vivid aurora curtains over a snow-covered Lapland forest, with a single trail leading into the trees"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="rn-editorial-veil" aria-hidden />
        <div className="rn-container absolute inset-x-0 top-[calc(var(--rn-chrome-h)+1rem)] z-[2] sm:top-[calc(var(--rn-chrome-h)+2rem)]">
          <p className="rn-eyebrow text-white/80">Finnish Lapland</p>
          <p className="rn-display mt-2.5 max-w-xl text-[1.4rem] leading-[1.2] text-white sm:mt-3 sm:text-[1.9rem] lg:text-[2.25rem]">
            Some nights, the sky does the talking.
          </p>
        </div>
      </div>
    </section>
  )
}

export default EditorialMoment
