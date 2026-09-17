import { Link } from 'react-router-dom'

export type CategoryPageEndLink = {
  to: string
  label: string
  primary?: boolean
}

type CategoryPageEndProps = {
  lede?: string
  links: CategoryPageEndLink[]
  className?: string
}

const CategoryPageEnd = ({
  lede = 'Planning your Lapland stay?',
  links,
  className = '',
}: CategoryPageEndProps) => {
  return (
    <section className={`rn-section-tight border-t border-white/[0.06] bg-midnight ${className}`}>
      <div className="rn-container">
        <div className="rn-page-end">
          <p className="text-sm text-text-muted">{lede}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={link.primary ? 'rn-btn-primary' : 'rn-btn-secondary'}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryPageEnd
