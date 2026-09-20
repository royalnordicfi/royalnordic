import { Link } from 'react-router-dom'

const PrivateCustomSection = () => {
  return (
    <section
      className="relative overflow-hidden border-t border-white/[0.06] bg-surface py-14 sm:py-16 lg:py-0"
      aria-label="Private and custom tours"
    >
      <div className="grid lg:grid-cols-12 lg:items-stretch">
        <div className="rn-reveal-img relative lg:col-span-7">
          <div className="relative h-[280px] overflow-hidden sm:h-[360px] lg:h-[480px]">
            <img
              src="/nordicci7.jpg"
              alt="A couple walks a snowy Lapland road beneath a swirling green aurora"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/25" />
            <span className="rn-float-badge absolute left-4 top-4 sm:left-6 sm:top-6">Private &amp; custom</span>
          </div>
        </div>

        <div className="relative lg:col-span-5">
          <div className="pointer-events-none absolute inset-0 -z-10 rn-ambient-subtle opacity-60 lg:-left-16" aria-hidden />
          <div className="rn-reveal rn-private-panel relative mx-4 -mt-10 rounded-rn-lg border border-white/[0.08] bg-elevated p-6 shadow-rn sm:mx-6 sm:-mt-14 sm:p-8 lg:mx-0 lg:-ml-16 lg:mt-0 lg:flex lg:min-h-[480px] lg:flex-col lg:justify-center lg:self-stretch lg:rounded-l-rn-lg lg:rounded-r-none lg:border-l-0 lg:p-12 lg:pl-20">
            <h2 className="rn-h2-tight text-white">
              Plan a Lapland itinerary around your dates, group, and pace
            </h2>
            <p className="mt-4 text-text-muted">
              Couples, families, and private groups use Royal Nordic for tailored evenings and
              multi-experience days — quoted personally, not pulled from a fixed catalogue.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/customized-tour" className="rn-btn-primary">
                Request a custom tour
              </Link>
              <Link to="/travel-trade" className="rn-btn-secondary">
                Travel trade partners
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PrivateCustomSection
