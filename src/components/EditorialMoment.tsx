const EditorialMoment = () => {
  return (
    <section className="relative overflow-hidden bg-black" aria-label="Finnish Lapland at night">
      <div className="rn-reveal-img relative h-[62vh] min-h-[420px] w-full sm:h-[74vh] lg:h-[86vh]">
        <img
          src="/nordicci6.jpg"
          alt="Vivid aurora curtains over a snow-covered Lapland forest, with a single trail leading into the trees"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/15 to-transparent"
          aria-hidden
        />
        <div className="rn-container absolute inset-x-0 bottom-0 pb-10 sm:pb-14 lg:pb-16">
          <p className="rn-eyebrow text-white/80">Finnish Lapland</p>
          <p className="rn-display mt-3 max-w-xl text-[1.7rem] leading-[1.18] text-white sm:text-[2.1rem] lg:text-[2.5rem]">
            Some nights, the sky does the talking.
          </p>
        </div>
      </div>
    </section>
  )
}

export default EditorialMoment
