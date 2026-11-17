/**
 * “Why travel with us” — human/local positioning between explore and private.
 */
const EditorialMoment = () => {
  return (
    <section className="relative overflow-hidden bg-midnight" aria-label="Why travel with Royal Nordic">
      <div
        className="rn-section-bridge rn-section-bridge--from-black absolute inset-x-0 top-0 z-[2] !m-0 h-14 sm:h-24"
        aria-hidden
      />
      <div className="rn-reveal-img relative h-[36vh] min-h-[260px] w-full sm:h-[44vh] sm:min-h-[320px] lg:h-[48vh]">
        <img
          src="/nordicci6.jpg"
          alt="Aurora over a snow-covered Lapland forest"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="rn-editorial-veil" aria-hidden />
        <div className="rn-container absolute inset-x-0 bottom-0 z-[2] pb-8 sm:pb-10 lg:pb-12">
          <p className="rn-eyebrow text-white/80">Why travel with us</p>
          <p className="rn-display mt-2 max-w-xl text-[1.35rem] leading-[1.22] text-white sm:mt-2.5 sm:text-[1.75rem] lg:text-[2.05rem]">
            Private experiences from Rovaniemi, planned around your group, schedule and the
            conditions that day.
          </p>
        </div>
      </div>
    </section>
  )
}

export default EditorialMoment
