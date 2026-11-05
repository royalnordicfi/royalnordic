import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchPartnerApplications,
  fetchPartnerCompanyAdmin,
  reviewPartnerApplication,
  type PartnerApplicationRow,
  type PartnerCompanyAdminRow,
  type PartnerMemberAdminRow,
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
  const [company, setCompany] = useState<PartnerCompanyAdminRow | null>(null)
  const [members, setMembers] = useState<PartnerMemberAdminRow[]>([])
  const [companyLoading, setCompanyLoading] = useState(false)

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

  useEffect(() => {
    if (!selected?.partner_company_id) {
      setCompany(null)
      setMembers([])
      return
    }
    let cancelled = false
    setCompanyLoading(true)
    void fetchPartnerCompanyAdmin(selected.partner_company_id)
      .then((res) => {
        if (cancelled) return
        setCompany(res.company)
        setMembers(res.members)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load company')
      })
      .finally(() => {
        if (!cancelled) setCompanyLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.id, selected?.partner_company_id])

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
        subtitle="Review travel-trade applications and inspect company membership. Approval sets server partner_status only."
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
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
            <div className="space-y-4">
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

              {selected.partner_company_id ? (
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Company profile
                  </p>
                  {companyLoading ? (
                    <p className="mt-2 text-xs text-zinc-500">Loading company…</p>
                  ) : company ? (
                    <dl className="mt-2 space-y-1.5 text-xs text-zinc-700">
                      <div>
                        <span className="text-zinc-400">VAT:</span> {company.vat_id || '—'}
                      </div>
                      <div>
                        <span className="text-zinc-400">Address:</span>{' '}
                        {[company.address_line1, company.address_line2, company.postal_code, company.city]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </div>
                      <div>
                        <span className="text-zinc-400">Profile contact:</span>{' '}
                        {company.contact_name || '—'} · {company.contact_email || '—'}
                        {company.contact_phone ? ` · ${company.contact_phone}` : ''}
                      </div>
                      <div>
                        <span className="text-zinc-400">Updated:</span>{' '}
                        {new Date(company.updated_at).toLocaleString()}
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">Company row not found.</p>
                  )}

                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                    Membership
                  </p>
                  {members.length === 0 ? (
                    <p className="mt-1 text-xs text-zinc-500">No members linked.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2 text-xs text-zinc-700"
                        >
                          <span className="truncate font-mono text-[11px]">{m.user_id}</span>
                          <span className="shrink-0">
                            {m.member_role} · {m.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

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
                globally. No partner pricing in this view.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
