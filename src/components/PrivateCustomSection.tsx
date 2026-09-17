import { Link } from 'react-router-dom'

const PrivateCustomSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/slideshow1.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-midnight/75" />
      </div>
      <div className="rn-container relative py-20 sm:py-24">
        <div className="max-w-xl text-snow">
          <p className="rn-eyebrow text-aurora-soft">Private &amp; custom</p>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">
            Plan a Lapland itinerary around your dates, group, and pace.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-snow/75">
            Couples, families, and private groups use Royal Nordic for tailored evenings and
            multi-experience days — quoted personally, not pulled from a fixed catalogue.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/customized-tour" className="rn-btn-primary">
              Request a custom tour
            </Link>
            <Link to="/travel-trade" className="rn-btn-secondary">
              Travel trade partners
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PrivateCustomSection
