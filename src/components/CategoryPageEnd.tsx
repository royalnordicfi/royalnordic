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

const ActionLink = ({
  to,
  label,
  primary,
}: {
  to: string
  label: string
  primary?: boolean
}) => {
  const className = primary
    ? 'rn-btn-primary min-h-[48px] justify-center px-7'
    : 'rn-page-end__link'

  if (to.startsWith('#')) {
    return (
      <a href={to} className={className}>
        {label}
      </a>
    )
  }

  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  )
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
          <p className={`rn-section-lede ${title ? '' : 'mt-0'}`.trim()}>{lede}</p>
          <div className="mt-5 flex flex-col gap-3.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-3">
            {primary ? <ActionLink to={primary.to} label={primary.label} primary /> : null}
            {secondary.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {secondary.map((link) => (
                  <ActionLink key={`${link.to}-${link.label}`} to={link.to} label={link.label} />
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
