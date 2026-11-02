import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type Props = {
  value: string
  label?: string
  className?: string
}

export default function CopyButton({ value, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', '')
      ta.style.position = 'absolute'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rn-btn-secondary inline-flex items-center gap-2 text-sm ${className}`}
      aria-live="polite"
    >
      {copied ? <Check className="h-4 w-4 text-aurora-soft" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  )
}
