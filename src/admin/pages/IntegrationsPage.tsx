import React from 'react'

const rows: Array<{
  name: string
  status: 'connected' | 'partial' | 'manual' | 'placeholder' | 'broken' | 'missing'
  note: string
}> = [
  {
    name: 'Direct website bookings',
    status: 'connected',
    note: 'Stripe checkout + Supabase bookings table — live.',
  },
  {
    name: 'Stripe payments',
    status: 'connected',
    note: 'Card payments create confirmed bookings with payment intent id.',
  },
  {
    name: 'Crypto payments',
    status: 'partial',
    note: 'pending_crypto_payment status exists; ops tracking via payment_status.',
  },
  {
    name: 'Confirmation email',
    status: 'partial',
    note: 'Existing email resend path in legacy panel; Admin OS V1 does not auto-send.',
  },
  {
    name: 'OMEGA read API',
    status: 'broken',
    note: 'Handler exists but live /api/omega returns SPA HTML; edge function not deployed. Fix routing + secrets required.',
  },
  {
    name: 'GetYourGuide',
    status: 'missing',
    note: 'No API sync. Enter manually or CSV import with source=getyourguide.',
  },
  {
    name: 'Airbnb',
    status: 'missing',
    note: 'No API sync. Manual / CSV with source=airbnb.',
  },
  {
    name: 'Viator',
    status: 'missing',
    note: 'No API sync. Manual / CSV with source=viator.',
  },
  {
    name: 'External calendar (Google/etc.)',
    status: 'missing',
    note: 'Internal ops calendar only in V1.',
  },
  {
    name: 'CSV import',
    status: 'manual',
    note: 'Preview + validate + confirm import in Admin → Import.',
  },
]

const label: Record<(typeof rows)[number]['status'], string> = {
  connected: 'Connected and real',
  partial: 'Partially connected',
  manual: 'Manual import',
  placeholder: 'Placeholder',
  broken: 'Broken',
  missing: 'Not implemented',
}

const tone: Record<(typeof rows)[number]['status'], string> = {
  connected: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-amber-100 text-amber-900',
  manual: 'bg-blue-100 text-blue-800',
  placeholder: 'bg-gray-100 text-gray-700',
  broken: 'bg-red-100 text-red-800',
  missing: 'bg-gray-100 text-gray-600',
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Integrations</h1>
        <p className="text-sm text-gray-600">Honest status — nothing claimed unless real.</p>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="bg-white border rounded-lg p-3">
            <div className="flex justify-between gap-2 items-start">
              <div className="font-semibold text-sm">{r.name}</div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tone[r.status]}`}>
                {label[r.status]}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">{r.note}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
