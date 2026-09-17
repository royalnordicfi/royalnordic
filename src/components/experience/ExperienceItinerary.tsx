export type ItineraryStep = {
  title: string
  text: string
  time?: string
}

type Props = {
  steps: ItineraryStep[]
  className?: string
}

export default function ExperienceItinerary({ steps, className = '' }: Props) {
  return (
    <ol className={`rn-itinerary space-y-0 ${className}`}>
      {steps.map((step, i) => (
        <li key={step.title} className="rn-reveal relative flex gap-5 pb-8 last:pb-0">
          <div className="flex w-10 shrink-0 flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-aurora/35 bg-aurora/10 font-clean text-xs font-semibold tracking-wide text-aurora-soft">
              {String(i + 1).padStart(2, '0')}
            </span>
            {i < steps.length - 1 && (
              <span className="mt-2 w-px flex-1 bg-gradient-to-b from-aurora/40 to-white/10" aria-hidden />
            )}
          </div>
          <div className="min-w-0 pb-1 pt-1.5">
            {step.time && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-aurora-soft">
                {step.time}
              </p>
            )}
            <h3 className="mt-1 font-display text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted sm:text-[15px]">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
