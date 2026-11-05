import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchPartnerApplications,
  reviewPartnerApplication,
  type PartnerApplicationRow,
} from '../adminApi'
import { Badge } from '../components/Badge'
import { Card, ErrorBanner, Field, PageHeader, textareaClass } from '../components/ui'

type Tab = 'pending' | 'approved' | 'declined' | 'all'

const TYPE_LABEL: Record<string, string> = {
  dmc: 'DMC',
  travel_agency: 'Travel agency',
  hotel: 'Hotel',
  concierge: 'Concierge',
  other: 'Other',
}

export default function PartnersPage() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('pending')
  const [rows, setRows] = useState<PartnerApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('id'))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const data = await fetchPartnerApplications(tab === 'all' ? undefined : tab)
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  useEffect(() => {
    const id = params.get('id')
    if (id) setSelectedId(id)
  }, [params])

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId],
  )

  const openDetail = (id: string) => {
    setSelectedId(id)
    setNote('')
    setParams({ id })
  }

  const runAction = async (action: 'approve' | 'decline' | 'revoke') => {
    if (!selected) return
    const label =
      action === 'approve' ? 'Approve' : action === 'decline' ? 'Decline' : 'Revoke access'
    if (!window.confirm(`${label} ${selected.company_name}?`)) return
    try {
      setBusy(true)
      setError('')
      await reviewPartnerApplication({
        application_id: selected.id,
        action,
        admin_note: note || null,
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Partners"
        subtitle="Review travel-trade applications. Approval sets server partner_status only."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium"
          >
            Refresh
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'declined', label: 'Declined' },
            { id: 'all', label: 'All' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTab(f.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              tab === f.id ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white text-zinc-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
        <Card padded={false}>
          {loading ? (
            <p className="p-4 text-sm text-zinc-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No applications in this view.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(r.id)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-zinc-50 ${
                      selectedId === r.id ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-zinc-900">
                        {r.company_name}
                      </span>
                      <Badge
                        tone={
                          r.status === 'approved'
                            ? 'green'
                            : r.status === 'pending'
                              ? 'yellow'
                              : 'gray'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {r.contact_name} · {r.business_email} · {r.country}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-zinc-500">Select an application.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{selected.company_name}</h2>
                <p className="text-xs text-zinc-500">
                  {TYPE_LABEL[selected.business_type] || selected.business_type} · {selected.country}
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Business ID</dt>
                  <dd className="text-zinc-800">{selected.business_id}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Contact</dt>
                  <dd className="text-zinc-800">
                    {selected.contact_name}
                    <br />
                    {selected.business_email}
                    {selected.phone ? (
                      <>
                        <br />
                        {selected.phone}
                      </>
                    ) : null}
                  </dd>
                </div>
                {selected.website ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Website</dt>
                    <dd className="break-all text-zinc-800">{selected.website}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Description</dt>
                  <dd className="whitespace-pre-wrap text-zinc-800">{selected.description}</dd>
                </div>
                {selected.admin_note ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Admin note</dt>
                    <dd className="text-zinc-800">{selected.admin_note}</dd>
                  </div>
                ) : null}
              </dl>

              <Field label="Internal note (optional)">
                <textarea
                  className={textareaClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Visible to admins only"
                />
              </Field>

              <div className="flex flex-wrap gap-2 pt-1">
                {selected.status === 'pending' ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runAction('approve')}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void runAction('decline')}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </>
                ) : null}
                {selected.status === 'approved' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void runAction('revoke')}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 disabled:opacity-50"
                  >
                    Revoke access
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] leading-snug text-zinc-400">
                Approve links/creates the auth user, sets app_metadata.partner_status=approved, and
                emails a magic link (no password). Revoke clears membership and signs the user out
                globally.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
