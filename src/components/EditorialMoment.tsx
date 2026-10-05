/**
 * “Why travel with us” — human/local positioning between explore and private.
 */
const EditorialMoment = () => {
  return (
    <section className="relative overflow-hidden bg-black" aria-label="Why travel with Royal Nordic">
      <div
        className="rn-section-bridge rn-section-bridge--from-black absolute inset-x-0 top-0 z-[2] !m-0 h-20 sm:h-36"
        aria-hidden
      />
      <div className="rn-reveal-img relative h-[44vh] min-h-[300px] w-full sm:h-[58vh] sm:min-h-[380px] lg:h-[62vh]">
        <img
          src="/nordicci6.jpg"
          alt="Aurora over a snow-covered Lapland forest"
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="rn-editorial-veil" aria-hidden />
        <div className="rn-container absolute inset-x-0 bottom-0 z-[2] pb-10 sm:pb-14 lg:pb-16">
          <p className="rn-eyebrow text-white/80">Why travel with us</p>
          <p className="rn-display mt-2.5 max-w-xl text-[1.4rem] leading-[1.2] text-white sm:mt-3 sm:text-[1.9rem] lg:text-[2.25rem]">
            Private experiences from Rovaniemi, planned around your group, schedule and the
            conditions that day.
          </p>
        </div>
      </div>
    </section>
  )
}

export default EditorialMoment
