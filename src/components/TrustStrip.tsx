/**
 * Homepage trust strip — kept as a thin continuity band after the cinematic hero.
 * Primary trust copy now lives in the hero for a single first-viewport composition.
 */
const TrustStrip = () => {
  return (
    <div className="relative z-10 -mt-1 border-b border-white/[0.05] bg-midnight/80" aria-hidden>
      <div className="rn-container py-3 sm:py-3.5">
        <p className="text-center text-[11px] tracking-[0.08em] text-white/35 sm:text-[12px]">
          Small-group Lapland experiences from Rovaniemi — aurora hunts, day tours, and private
          itineraries.
        </p>
      </div>
    </div>
  )
}

export default TrustStrip
