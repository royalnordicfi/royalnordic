export type FactItem = {
  label: string
  value: string
}

type Props = {
  items: FactItem[]
  className?: string
}

/** Thin luxury fact rail — not SaaS metadata cards. */
export default function ExperienceFacts({ items, className = '' }: Props) {
  return (
    <dl
      className={`rn-facts grid grid-cols-2 gap-x-6 gap-y-4 border-y border-white/[0.08] py-5 sm:grid-cols-4 ${className}`}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-dim">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium text-white sm:text-[15px]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
