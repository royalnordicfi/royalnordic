type Props = {
  items: string[]
  className?: string
}

/** Minimal numbered highlights — no icon grid. */
export default function ExperienceHighlights({ items, className = '' }: Props) {
  return (
    <ol className={`rn-highlights space-y-4 ${className}`}>
      {items.map((item, i) => (
        <li key={item} className="flex gap-4">
          <span className="font-clean text-[11px] font-semibold tracking-[0.14em] text-aurora-soft">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="text-[15px] leading-snug text-text-muted sm:text-base">{item}</span>
        </li>
      ))}
    </ol>
  )
}
