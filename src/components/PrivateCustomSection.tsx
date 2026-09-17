import { Link } from 'react-router-dom'

const PrivateCustomSection = () => {
  return (
    <section className="rn-section bg-surface">
      <div className="rn-container">
        <div className="grid items-center gap-8 overflow-hidden rounded-rn border border-white/10 lg:grid-cols-2">
          <div className="relative min-h-[260px] lg:min-h-[340px]">
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
            <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
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
