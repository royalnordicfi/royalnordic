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
      className={`rn-facts grid grid-cols-2 gap-x-5 gap-y-3.5 border-y border-white/[0.08] py-4 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-4 sm:py-5 ${className}`}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-text-dim sm:tracking-[0.16em]">
            {item.label}
          </dt>
          <dd className="mt-1 text-[13.5px] font-medium leading-snug tracking-tight text-white sm:mt-1.5 sm:text-[15px]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
