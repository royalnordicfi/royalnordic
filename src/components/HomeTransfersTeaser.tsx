import { Link } from 'react-router-dom'

/** Homepage transfers — photo left, copy + CTAs right. */
const HomeTransfersTeaser = () => {
  return (
    <section
      className="relative overflow-hidden border-t border-white/[0.06] bg-midnight"
      aria-label="Transfers across Lapland"
    >
      <div className="grid lg:grid-cols-12 lg:items-stretch">
        <div className="rn-reveal-img relative lg:col-span-6 xl:col-span-7">
          <div className="relative h-[220px] overflow-hidden sm:h-[320px] lg:h-full lg:min-h-[420px]">
            <img
              src="/royal-trans-1.jpg"
              alt="Royal Nordic private transfer vehicle in Finnish Lapland"
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-midnight via-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-midnight/80"
              aria-hidden
            />
          </div>
        </div>

        <div className="relative flex items-center lg:col-span-6 xl:col-span-5">
          <div className="rn-reveal relative w-full px-4 py-10 sm:px-6 sm:py-12 lg:py-16 lg:pl-10 lg:pr-8 xl:pl-14">
            <p className="rn-eyebrow">Transfers</p>
            <h2 className="rn-h2-tight mt-2.5 text-white">
              Private transfers across Finnish Lapland
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-muted">
              Door-to-door rides between Rovaniemi, Levi, Kittilä, Saariselkä and other destinations —
              timed around flights and hotel check-ins.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/transportation" className="rn-btn-primary min-h-[48px] w-full justify-center px-7 sm:w-auto">
                Book transfer
              </Link>
              <Link
                to="/transportation-customized"
                className="text-center text-sm font-semibold text-white/70 transition hover:text-aurora-soft sm:text-left"
              >
                Request a custom route →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeTransfersTeaser
