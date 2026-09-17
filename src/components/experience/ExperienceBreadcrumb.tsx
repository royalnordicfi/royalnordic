import { Link } from 'react-router-dom'

export type BreadcrumbItem = { label: string; to?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
}

export default function ExperienceBreadcrumb({ items, className = '' }: Props) {
  return (
    <nav
      className={`text-[11px] font-medium tracking-wide text-text-dim sm:text-xs ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-white/20">/</span>}
            {item.to ? (
              <Link to={item.to} className="transition hover:text-white/80">
                {item.label}
              </Link>
            ) : (
              <span className="text-white/55">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
