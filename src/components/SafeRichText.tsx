import { renderSafeRichText } from '../lib/tourCms'

/** Renders admin-authored text with paragraphs, **bold**, and - lists only. */
export default function SafeRichText({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  if (!text?.trim()) return null
  return (
    <div
      className={`rn-cms-prose ${className}`}
      dangerouslySetInnerHTML={{ __html: renderSafeRichText(text) }}
    />
  )
}
