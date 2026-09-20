const EditorialMoment = () => {
  return (
    <section className="relative overflow-hidden bg-black" aria-label="Finnish Lapland at night">
      <div className="rn-reveal-img relative h-[52vh] min-h-[380px] w-full sm:h-[58vh] lg:h-[68vh]">
        <img
          src="/nordicci6.jpg"
          alt="Vivid aurora curtains over a snow-covered Lapland forest, with a single trail leading into the trees"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/70 via-black/10 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050a08] from-0% via-black/45 via-40% to-transparent"
          aria-hidden
        />
        <div className="rn-container absolute inset-x-0 top-[calc(var(--rn-chrome-h)+1.5rem)] sm:top-[calc(var(--rn-chrome-h)+2rem)]">
          <p className="rn-eyebrow text-white/80">Finnish Lapland</p>
          <p className="rn-display mt-3 max-w-xl text-[1.6rem] leading-[1.2] text-white sm:text-[1.9rem] lg:text-[2.25rem]">
            Some nights, the sky does the talking.
          </p>
        </div>
      </div>
    </section>
  )
}

export default EditorialMoment
