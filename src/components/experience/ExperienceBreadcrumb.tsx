import { Link } from 'react-router-dom'

export type BreadcrumbItem = { label: string; to?: string }

type Props = {
  items: BreadcrumbItem[]
  className?: string
  /** Lighter breadcrumbs over photography */
  tone?: 'default' | 'onMedia'
}

export default function ExperienceBreadcrumb({ items, className = '', tone = 'default' }: Props) {
  const onMedia = tone === 'onMedia'
  return (
    <nav
      className={`text-[11px] font-medium tracking-wide sm:text-xs ${
        onMedia ? 'text-white/55' : 'text-text-dim'
      } ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden className="text-white/25">/</span>}
            {item.to ? (
              <Link
                to={item.to}
                className={onMedia ? 'transition hover:text-white' : 'transition hover:text-white/80'}
              >
                {item.label}
              </Link>
            ) : (
              <span className={onMedia ? 'text-white/75' : 'text-white/55'}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
