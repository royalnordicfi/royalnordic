import { Link } from 'react-router-dom'

/** Compact homepage transfers strip — commercial category entry. */
const HomeTransfersTeaser = () => {
  return (
    <section
      className="relative border-t border-white/[0.06] bg-midnight py-14 sm:py-16 lg:py-20"
      aria-label="Transfers across Lapland"
    >
      <div className="rn-container">
        <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="rn-reveal lg:col-span-7">
            <p className="rn-eyebrow">Transfers</p>
            <h2 className="rn-h2-tight mt-2.5 text-white">Private transfers across Finnish Lapland</h2>
            <p className="mt-4 max-w-rn-measure text-[15px] leading-relaxed text-text-muted">
              Door-to-door rides between Rovaniemi, Levi, Kittilä, Saariselkä and other destinations —
              timed around flights and hotel check-ins.
            </p>
          </div>
          <div className="rn-reveal flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-5 lg:justify-end">
            <Link to="/transportation" className="rn-btn-primary min-h-[48px] justify-center px-7">
              Book transfer
            </Link>
            <Link
              to="/transportation-customized"
              className="text-center text-sm font-semibold text-white/70 transition hover:text-aurora-soft"
            >
              Request a custom route →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HomeTransfersTeaser
