import { Link } from 'react-router-dom'

export type BreadcrumbItem = { label: string; to?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export default function ExperienceBreadcrumb({ items, className = '' }: Props) {
  return (
    <nav className={`text-sm text-text-muted ${className}`} aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="text-white/25">/</span>}
            {item.to ? (
              <Link to={item.to} className="transition hover:text-white">
                {item.label}
              </Link>
            ) : (
              <span className="text-white/85">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
