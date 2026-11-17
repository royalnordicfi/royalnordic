import { Link } from 'react-router-dom'

export type CategoryPageEndLink = {
  to: string
  label: string
  primary?: boolean
}

type CategoryPageEndProps = {
  lede?: string
  title?: string
  links: CategoryPageEndLink[]
  className?: string
}

const CategoryPageEnd = ({
  lede = 'Planning your Lapland stay?',
  title,
  links,
  className = '',
}: CategoryPageEndProps) => {
  const primary = links.find((link) => link.primary) ?? links[0]
  const secondary = links.filter((link) => link !== primary)

  return (
    <section className={`rn-section-tight border-t border-white/[0.06] bg-midnight ${className}`}>
      <div className="rn-container">
        <div className="rn-page-end">
          {title ? <h2 className="rn-h2-tight text-white">{title}</h2> : null}
          <p className={`text-[15px] leading-relaxed text-text-muted ${title ? 'mt-2.5' : ''}`}>{lede}</p>
          <div className="mt-5 flex flex-col gap-3.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
            {primary ? (
              <Link to={primary.to} className="rn-btn-primary min-h-[48px] justify-center px-7">
                {primary.label}
              </Link>
            ) : null}
            {secondary.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {secondary.map((link) => (
                  <Link key={link.to} to={link.to} className="rn-page-end__link">
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryPageEnd
