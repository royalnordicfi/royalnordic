import React from 'react'
import { Link } from 'react-router-dom'

export type RelatedTourLink = {
  to: string
  label: string
  description: string
}

type RelatedToursProps = {
  title?: string
  links: RelatedTourLink[]
}

/**
 * Internal linking block for related experiences — keeps navigation natural for visitors and crawlers.
 */
const RelatedTours: React.FC<RelatedToursProps> = ({
  title = 'Related experiences',
  links,
}) => {
  if (!links.length) return null

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 border border-white/10">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-luxury font-bold text-white mb-3 sm:mb-4">{title}</h2>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="block rounded-lg border border-white/10 bg-black/20 px-3 py-3 hover:border-emerald-500/40 transition-colors"
            >
              <span className="text-emerald-400 font-semibold text-sm sm:text-base">{link.label}</span>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 font-clean">{link.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RelatedTours
