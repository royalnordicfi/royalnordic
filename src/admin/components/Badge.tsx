import React from 'react'

const tones: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  yellow: 'bg-amber-100 text-amber-900',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-800',
}

export function Badge({
  children,
  tone = 'gray',
}: {
  children: React.ReactNode
  tone?: keyof typeof tones
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function statusTone(status: string): keyof typeof tones {
  if (status === 'confirmed' || status === 'completed' || status === 'paid') return 'green'
  if (status === 'pending' || status === 'partial' || status === 'pending_crypto' || status === 'pending_crypto_payment')
    return 'yellow'
  if (status === 'cancelled' || status === 'refunded' || status === 'unpaid') return 'red'
  return 'gray'
}
