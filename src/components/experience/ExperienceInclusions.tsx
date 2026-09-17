type Props = {
  included: string[]
  notIncluded?: string[]
  className?: string
}

export default function ExperienceInclusions({ included, notIncluded = [], className = '' }: Props) {
  return (
    <div className={`grid gap-8 sm:grid-cols-2 ${className}`}>
      <div>
        <h3 className="font-display text-xl font-semibold text-white">Included</h3>
        <ul className="mt-4 space-y-2.5">
          {included.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-text-muted sm:text-[15px]">
              <span className="mt-0.5 shrink-0 text-aurora" aria-hidden>
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      {notIncluded.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold text-white">Not included</h3>
          <ul className="mt-4 space-y-2.5">
            {notIncluded.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-text-muted sm:text-[15px]">
                <span className="mt-0.5 shrink-0 text-white/35" aria-hidden>
                  —
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
