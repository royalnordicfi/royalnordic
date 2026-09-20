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
  connected: 'Connected',
  partial: 'Partial',
  manual: 'Manual',
  placeholder: 'Placeholder',
  broken: 'Broken',
  missing: 'Not connected',
}

const tone: Record<(typeof rows)[number]['status'], string> = {
  connected: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
  partial: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200',
  manual: 'bg-sky-50 text-sky-800 ring-1 ring-sky-200',
  placeholder: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200',
  broken: 'bg-red-50 text-red-800 ring-1 ring-red-200',
  missing: 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200',
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Honest status — nothing claimed unless real.</p>
      </div>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {rows.map((r) => (
          <li key={r.name} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-900">{r.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{r.note}</p>
              </div>
              <span
                className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone[r.status]}`}
              >
                {label[r.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
