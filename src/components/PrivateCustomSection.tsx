import { Link } from 'react-router-dom'

const PrivateCustomSection = () => {
  return (
    <section
      className="rn-private relative overflow-hidden bg-[#050a08] pb-10 pt-14 sm:pb-12 sm:pt-16 lg:pb-16 lg:pt-0"
      aria-label="Private and custom tours"
    >
      <div className="grid lg:grid-cols-12 lg:items-stretch">
        <div className="rn-reveal-img relative lg:col-span-7">
          <div className="rn-private-media relative h-[240px] overflow-hidden sm:h-[380px] lg:h-[520px]">
            <img
              src="/nordicci7.jpg"
              alt="A couple walks a snowy Lapland road beneath a swirling green aurora"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050a08] via-black/25 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/10 lg:to-[#050a08]/70"
              aria-hidden
            />
            <span className="rn-float-badge absolute left-4 top-4 sm:left-6 sm:top-6">
              Private &amp; custom
            </span>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="pointer-events-none absolute inset-0 -z-10 rn-ambient-subtle opacity-60 lg:-left-16" aria-hidden />
          <div className="rn-reveal rn-private-panel relative mx-3.5 -mt-10 rounded-rn-lg border border-white/[0.08] bg-elevated/95 p-5 shadow-rn backdrop-blur-sm sm:mx-6 sm:-mt-16 sm:p-8 lg:mx-0 lg:-ml-20 lg:mt-0 lg:flex lg:min-h-[520px] lg:flex-col lg:justify-center lg:self-stretch lg:rounded-l-rn-lg lg:rounded-r-none lg:border-l-0 lg:bg-elevated lg:p-12 lg:pl-20 lg:backdrop-blur-none">
            <p className="rn-eyebrow">Private &amp; custom</p>
            <h2 className="rn-h2-tight mt-2.5 text-white">
              Plan a Lapland itinerary around your dates, group, and pace
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-text-muted">
              Couples, families, and private groups use Royal Nordic for tailored evenings and
              multi-experience days — quoted personally, not pulled from a fixed catalogue.
            </p>
            <div className="mt-7 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:items-center sm:gap-3">
              <Link to="/customized-tour" className="rn-btn-primary w-full justify-center sm:w-auto">
                Plan your private experience
              </Link>
              <Link to="/travel-trade" className="rn-btn-secondary w-full justify-center sm:w-auto">
                Travel trade partners
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="rn-private-bottom-fade pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32" aria-hidden />
    </section>
  )
}

export default PrivateCustomSection
