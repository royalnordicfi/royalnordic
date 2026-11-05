import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchNotificationOutboxProblems,
  fetchNotificationsForPartnerRequest,
  fetchPartnerBookingRequestsAdmin,
  retryPartnerBookingNotification,
  reviewPartnerBookingRequestAdmin,
  type NotificationOutboxAdminRow,
  type NotificationOutboxHealth,
  type PartnerBookingRequestAdminRow,
} from '../adminApi'
import { Badge } from '../components/Badge'
import { Card, ErrorBanner, Field, PageHeader, textareaClass } from '../components/ui'

type Tab = 'pending' | 'confirmed' | 'declined' | 'all'

function tourTitle(r: PartnerBookingRequestAdminRow) {
  return r.tours?.public_name || r.tours?.name || `Tour #${r.tour_id}`
}

function templateLabel(key: string) {
  if (key === 'partner_booking_submitted_admin') return 'Admin alert'
  if (key === 'partner_booking_confirmed_partner') return 'Partner confirmation'
  if (key === 'partner_booking_declined_partner') return 'Partner decline'
  return key
}

export default function PartnerBookingsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [rows, setRows] = useState<PartnerBookingRequestAdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [notes, setNotes] = useState<NotificationOutboxAdminRow[]>([])
  const [health, setHealth] = useState<NotificationOutboxHealth | null>(null)

  const loadHealth = async () => {
    try {
      const h = await fetchNotificationOutboxProblems(30)
      setHealth(h)
    } catch {
      setHealth(null)
    }
  }

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const data = await fetchPartnerBookingRequestsAdmin(tab === 'all' ? undefined : tab)
      setRows(data)
      await loadHealth()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load partner bookings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) || null,
    [rows, selectedId],
  )

  useEffect(() => {
    if (!selectedId) {
      setNotes([])
      return
    }
    let cancelled = false
    void fetchNotificationsForPartnerRequest(selectedId)
      .then((list) => {
        if (!cancelled) setNotes(list)
      })
      .catch(() => {
        if (!cancelled) setNotes([])
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, rows])

  const run = async (action: 'approve' | 'decline') => {
    if (!selected) return
    const label = action === 'approve' ? 'Approve and reserve capacity' : 'Decline'
    if (!window.confirm(`${label} for ${selected.reference}?`)) return
    try {
      setBusy(true)
      setError('')
      await reviewPartnerBookingRequestAdmin({
        request_id: selected.id,
        action,
        admin_note: note || null,
      })
      await load()
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Action failed'
      setError(
        raw === 'insufficient_capacity'
          ? 'Not enough remaining capacity on that date. Request left pending — no booking created.'
          : raw === 'not_pending'
            ? 'This request is no longer pending.'
            : raw === 'tour_unavailable'
              ? 'Tour is unavailable. Request left pending.'
              : raw,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Partner bookings"
        subtitle="Review partner booking requests. Approval revalidates capacity and creates one canonical booking."
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
            { id: 'confirmed', label: 'Confirmed' },
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

      {health ? (
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">Notification delivery</p>
              <p className="mt-1 text-xs text-zinc-500">
                Autonomous cron {health.cron_configured ? 'active' : 'missing'} · Vault URL{' '}
                {health.vault_project_url_present ? 'ok' : 'missing'} · Vault key{' '}
                {health.vault_service_role_present ? 'ok' : 'missing'}
                {health.count > 0
                  ? ` · ${health.count} failed/stuck`
                  : ' · no failed or stuck notifications'}
              </p>
              {!health.cron_configured ||
              !health.vault_project_url_present ||
              !health.vault_service_role_present ? (
                <p className="mt-1 text-xs text-amber-700">
                  Scheduled delivery is incomplete until cron and Vault secrets are configured.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void loadHealth()}
              className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium"
            >
              Refresh status
            </button>
          </div>
          {health.count > 0 ? (
            <ul className="mt-3 divide-y divide-zinc-100 rounded-lg border border-zinc-100">
              {health.items.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-800">
                      {item.problem} · {templateLabel(item.template_key)} ·{' '}
                      {item.request_reference || item.partner_booking_request_id}
                    </p>
                    <p className="truncate text-zinc-500">
                      {item.company_name || '—'} → {item.recipient_email}
                      {item.last_error ? ` · ${item.last_error}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        item.problem === 'dead' || item.problem === 'failed' ? 'red' : 'yellow'
                      }
                    >
                      {item.status}
                    </Badge>
                    <button
                      type="button"
                      disabled={busy}
                      className="rounded border border-zinc-300 px-2 py-1 font-medium disabled:opacity-50"
                      onClick={() => {
                        void (async () => {
                          try {
                            setBusy(true)
                            await retryPartnerBookingNotification(item.id)
                            await loadHealth()
                            if (selectedId === item.partner_booking_request_id) {
                              setNotes(
                                await fetchNotificationsForPartnerRequest(
                                  item.partner_booking_request_id,
                                ),
                              )
                            }
                          } catch (e) {
                            setError(e instanceof Error ? e.message : 'Retry failed')
                          } finally {
                            setBusy(false)
                          }
                        })()
                      }}
                    >
                      Re-queue
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,400px)]">
        <Card padded={false}>
          {loading ? (
            <p className="p-4 text-sm text-zinc-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500">No partner booking requests.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id)
                      setNote('')
                    }}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-zinc-50 ${
                      selectedId === r.id ? 'bg-emerald-50/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-zinc-900">
                        {r.reference} · {tourTitle(r)}
                      </span>
                      <Badge
                        tone={
                          r.status === 'confirmed'
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
                      {r.partner_companies?.name || r.partner_company_id} · {r.tour_date} ·{' '}
                      {r.passenger_count} pax · €{Number(r.total_net_eur).toFixed(2)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          {!selected ? (
            <p className="text-sm text-zinc-500">Select a request.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{selected.reference}</h2>
                <p className="text-xs text-zinc-500">
                  {selected.partner_companies?.name} · {tourTitle(selected)}
                </p>
              </div>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Date / pax</dt>
                  <dd>
                    {selected.tour_date} · {selected.adults} adults
                    {selected.children ? `, ${selected.children} children` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Guest</dt>
                  <dd>
                    {selected.guest_name}
                    <br />
                    {selected.guest_email}
                    {selected.guest_phone ? (
                      <>
                        <br />
                        {selected.guest_phone}
                      </>
                    ) : null}
                  </dd>
                </div>
                {selected.pickup_location ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Pickup</dt>
                    <dd>{selected.pickup_location}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Net total</dt>
                  <dd className="font-semibold">
                    €{Number(selected.total_net_eur).toFixed(2)}{' '}
                    <span className="font-normal text-zinc-500">
                      ({Number(selected.unit_net_eur).toFixed(2)} unit)
                    </span>
                  </dd>
                </div>
                {selected.booking_id ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Booking</dt>
                    <dd>#{selected.booking_id}</dd>
                  </div>
                ) : null}
                {selected.special_requests ? (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wide text-zinc-400">Notes</dt>
                    <dd className="whitespace-pre-wrap">{selected.special_requests}</dd>
                  </div>
                ) : null}
              </dl>

              {selected.status === 'pending' ? (
                <>
                  <Field label="Admin note (optional)">
                    <textarea
                      className={textareaClass}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run('approve')}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run('decline')}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Approve locks the tour date, checks remaining capacity, creates one confirmed
                    unpaid booking at the snapshotted net total, and links it here. If capacity is
                    insufficient the request stays pending. Partner email is sent only after a
                    successful approval or decline.
                  </p>
                </>
              ) : null}

              <div className="border-t border-zinc-100 pt-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Notifications
                </p>
                {notes.length === 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">No notification rows yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {notes.map((n) => (
                      <li
                        key={n.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-2.5 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-800">
                            {templateLabel(n.template_key)} → {n.recipient_email}
                          </p>
                          <p className="text-zinc-500">
                            {n.status}
                            {n.attempt_count ? ` · attempts ${n.attempt_count}` : ''}
                            {n.last_error ? ` · ${n.last_error}` : ''}
                          </p>
                        </div>
                        {n.status === 'failed' || n.status === 'dead' || n.status === 'pending' ? (
                          <button
                            type="button"
                            disabled={busy}
                            className="rounded border border-zinc-300 px-2 py-1 font-medium disabled:opacity-50"
                            onClick={() => {
                              void (async () => {
                                try {
                                  setBusy(true)
                                  await retryPartnerBookingNotification(n.id)
                                  const list = await fetchNotificationsForPartnerRequest(selected.id)
                                  setNotes(list)
                                } catch (e) {
                                  setError(e instanceof Error ? e.message : 'Retry failed')
                                } finally {
                                  setBusy(false)
                                }
                              })()
                            }}
                          >
                            Retry
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
