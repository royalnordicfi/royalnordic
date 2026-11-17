import type { ReactNode } from 'react'

type CategorySectionHeaderProps = {
  eyebrow?: string
  title: string
  titleId?: string
  lede?: ReactNode
  className?: string
}

/**
 * Shared catalogue / mid-page section chrome.
 * Keeps eyebrow → heading → lede rhythm consistent without locking page templates.
 */
const CategorySectionHeader = ({
  eyebrow,
  title,
  titleId,
  lede,
  className = '',
}: CategorySectionHeaderProps) => {
  return (
    <header className={`max-w-rn-measure ${className}`.trim()}>
      {eyebrow ? <p className="rn-eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId} className={`rn-h2-tight text-white ${eyebrow ? 'mt-2' : ''}`.trim()}>
        {title}
      </h2>
      {lede ? <div className="rn-section-lede">{lede}</div> : null}
    </header>
  )
}

export default CategorySectionHeader
