type Props = {
  eyebrow?: string
  title: string
  children: React.ReactNode
  className?: string
  /** Subtle elevated surface vs plain editorial band */
  tone?: 'plain' | 'band'
  id?: string
}

/**
 * Editorial section block — whitespace + thin rule, not SaaS cards.
 * Omits empty children automatically when used with conditional wrappers.
 */
export default function TourSection({
  eyebrow,
  title,
  children,
  className = '',
  tone = 'plain',
  id,
}: Props) {
  return (
    <section
      id={id}
      className={`rn-tour-section rn-tour-section--${tone} rn-reveal ${className}`}
    >
      <header className="rn-tour-section__head">
        {eyebrow ? <p className="rn-tour-section__eyebrow">{eyebrow}</p> : null}
        <h2 className="rn-tour-section__title">{title}</h2>
      </header>
      <div className="rn-tour-section__body">{children}</div>
    </section>
  )
}
