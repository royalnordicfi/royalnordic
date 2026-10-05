import { useState } from 'react'

type Props = {
  summary?: string
  detail: string
}

/**
 * Compact guarantee first; full DSLR explanation on demand.
 */
export default function TourGuarantee({
  summary = 'No Aurora captured on our professional cameras? You receive a 100% refund.',
  detail,
}: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rn-tour-guarantee">
      <p className="rn-tour-guarantee__eyebrow">100% Aurora Guarantee</p>
      <p className="rn-tour-guarantee__summary">{summary}</p>
      <button
        type="button"
        className="rn-tour-guarantee__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide details' : 'How the guarantee works'}
      </button>
      {open ? <p className="rn-tour-guarantee__detail">{detail}</p> : null}
    </div>
  )
}
