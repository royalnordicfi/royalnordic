import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export type AccordionItem = {
  title: string
  content: React.ReactNode
}

type Props = {
  items: AccordionItem[]
  className?: string
}

export default function ExperienceAccordion({ items, className = '' }: Props) {
  const baseId = useId()
  const [open, setOpen] = useState<number | null>(0)

  return (
    <div className={`divide-y divide-white/[0.08] border-y border-white/[0.08] ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${baseId}-panel-${i}`
        const buttonId = `${baseId}-btn-${i}`
        return (
          <div key={item.title}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:text-aurora-soft"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span className="font-display text-lg font-semibold text-white sm:text-xl">{item.title}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-aurora-soft transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div className="pb-5 text-sm leading-relaxed text-text-muted sm:text-[15px]">{item.content}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
