import { Link } from 'react-router-dom'

const PrivateCustomSection = () => {
  return (
    <section className="rn-section relative border-t border-white/[0.06] bg-surface">
      <div className="pointer-events-none absolute inset-0 rn-ambient-subtle opacity-50" aria-hidden />
      <div className="rn-container relative">
        <div className="grid items-stretch gap-0 overflow-hidden rounded-rn border border-white/[0.08] lg:grid-cols-2">
          <div className="relative min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
            <img
              src="/nortti5.jpg"
              alt="Private Lapland experience under the aurora"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="rn-eyebrow">Private & custom</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-[1.75rem]">
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
