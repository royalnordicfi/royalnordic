type Props = {
  items: string[]
  className?: string
}

/** Concise numbered highlights — premium rhythm, no icon clutter. */
export default function ExperienceHighlights({ items, className = '' }: Props) {
  return (
    <ol className={`rn-highlights ${className}`}>
      {items.map((item, i) => (
        <li key={item} className="rn-highlights__item">
          <span className="rn-highlights__num" aria-hidden>
            {String(i + 1).padStart(2, '0')}
          </span>
          <span className="rn-highlights__text">{item}</span>
        </li>
      ))}
    </ol>
  )
}
