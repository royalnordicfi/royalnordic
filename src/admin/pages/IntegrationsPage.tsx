import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  disconnectGoogleCalendar,
  enqueueUpcomingCalendarSync,
  exchangeGoogleCalendarCode,
  fetchGoogleCalendarStatus,
  getGoogleCalendarAuthUrl,
  googleCalendarDryRun,
  listGoogleCalendars,
  setGoogleCalendarFlags,
  type GoogleCalendarDryRunRow,
  type GoogleCalendarStatus,
} from '../adminApi'
import { ErrorBanner, Field, PrimaryButton, SecondaryButton, inputClass } from '../components/ui'

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
    status: 'connected',
    note: 'Sent automatically after Stripe payment; resend available on booking detail.',
  },
  {
    name: 'GetYourGuide',
    status: 'missing',
    note: 'Configure under Shared Bookings → Integrations when using the bus product.',
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
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null)
  const [dryRun, setDryRun] = useState<GoogleCalendarDryRunRow[] | null>(null)
  const [calendars, setCalendars] = useState<Array<{ id: string; summary?: string; primary?: boolean }>>([])
  const [reminderEmail, setReminderEmail] = useState('')
  const [calendarId, setCalendarId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [migrationMissing, setMigrationMissing] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const s = await fetchGoogleCalendarStatus()
      if (!s) {
        setMigrationMissing(true)
        setStatus(null)
      } else {
        setMigrationMissing(false)
        setStatus(s)
        setReminderEmail(s.admin_reminder_email || 'contact@royalnordic.fi')
        setCalendarId(s.calendar_id || '')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Google Calendar status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const code = params.get('code')
    const google = params.get('google')
    if (!code || google !== 'callback') return
    let cancelled = false
    ;(async () => {
      setBusy(true)
      setError('')
      try {
        await exchangeGoogleCalendarCode(code)
        if (!cancelled) {
          setNote('Google account connected. Sync and reminders stay OFF until you enable them below.')
          setParams({}, { replace: true })
          await reload()
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'OAuth exchange failed')
      } finally {
        if (!cancelled) setBusy(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params, reload, setParams])

  const connect = async () => {
    setBusy(true)
    setError('')
    try {
      const { url } = await getGoogleCalendarAuthUrl()
      window.location.href = url
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start Google OAuth')
      setBusy(false)
    }
  }

  const disconnect = async () => {
    if (!confirm('Disconnect Google Calendar? Sync flags will be turned off.')) return
    setBusy(true)
    setError('')
    try {
      await disconnectGoogleCalendar()
      setNote('Disconnected.')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disconnect failed')
    } finally {
      setBusy(false)
    }
  }

  const saveFlags = async (patch: {
    calendar_sync_enabled?: boolean
    reminders_enabled?: boolean
  }) => {
    setBusy(true)
    setError('')
    try {
      const next = await setGoogleCalendarFlags({
        ...patch,
        admin_reminder_email: reminderEmail,
        calendar_id: calendarId || null,
      })
      setStatus(next)
      setNote(
        'Saved. Production workers also require GOOGLE_CALENDAR_SYNC_ENABLED / GOOGLE_CALENDAR_REMINDERS_ENABLED=true in Supabase secrets.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const runDryRun = async () => {
    setBusy(true)
    setError('')
    try {
      const rowsDry = await googleCalendarDryRun(150)
      setDryRun(rowsDry)
      setNote(`Dry-run: ${rowsDry.filter((r) => r.can_sync).length} ready · ${rowsDry.filter((r) => !r.can_sync).length} need departure time or date.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dry-run failed')
    } finally {
      setBusy(false)
    }
  }

  const enqueueBackfill = async () => {
    if (
      !confirm(
        'Enqueue calendar sync for upcoming confirmed bookings that have a real departure time? Events are only created when sync is enabled in DB + env.',
      )
    ) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const n = await enqueueUpcomingCalendarSync(200)
      setNote(`Enqueued ${n} booking(s) into calendar_sync_outbox.`)
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enqueue failed')
    } finally {
      setBusy(false)
    }
  }

  const loadCalendars = async () => {
    setBusy(true)
    setError('')
    try {
      const list = await listGoogleCalendars()
      setCalendars(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not list calendars')
    } finally {
      setBusy(false)
    }
  }

  const gcalStatus: (typeof rows)[number]['status'] = migrationMissing
    ? 'missing'
    : !status?.connected
      ? 'missing'
      : status.calendar_sync_enabled || status.reminders_enabled
        ? 'connected'
        : 'partial'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-0.5 text-sm text-zinc-500">Honest status — nothing claimed unless real.</p>
      </div>

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {note ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{note}</p> : null}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-100 px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-900">Google Calendar</div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                One ops calendar event per confirmed booking. Admin reminders at 24h / 10h / 6h via Resend.
                Sync and reminder sending stay disabled until you enable both the toggles below and the
                matching Supabase edge secrets.
              </p>
            </div>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone[gcalStatus]}`}>
              {migrationMissing ? 'Migration pending' : label[gcalStatus]}
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : migrationMissing ? (
            <p className="text-sm text-zinc-600">
              Apply migration <code className="text-xs">20261123180000_google_calendar_sync.sql</code> then
              refresh.
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  <div>
                    Account:{' '}
                    <span className="font-medium text-zinc-900">
                      {status?.connected_email || 'Not connected'}
                    </span>
                  </div>
                  <div className="mt-1">
                    Calendar ID:{' '}
                    <span className="font-medium text-zinc-900">{status?.calendar_id || '—'}</span>
                  </div>
                  <div className="mt-1">
                    Outbox: {status?.sync_pending ?? 0} pending · {status?.sync_dead ?? 0} dead ·{' '}
                    {status?.reminders_pending ?? 0} reminders queued
                  </div>
                  {status?.last_error ? (
                    <div className="mt-1 text-red-700">Last error: {status.last_error}</div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!status?.connected ? (
                    <PrimaryButton type="button" disabled={busy} onClick={() => void connect()}>
                      Connect Google
                    </PrimaryButton>
                  ) : (
                    <>
                      <SecondaryButton type="button" disabled={busy} onClick={() => void disconnect()}>
                        Disconnect
                      </SecondaryButton>
                      <SecondaryButton type="button" disabled={busy} onClick={() => void loadCalendars()}>
                        List calendars
                      </SecondaryButton>
                    </>
                  )}
                </div>
              </div>

              {calendars.length > 0 ? (
                <Field label="Choose calendar">
                  <select
                    className={inputClass}
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                  >
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary || c.id}
                        {c.primary ? ' (primary)' : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label="Calendar ID">
                  <input
                    className={inputClass}
                    value={calendarId}
                    onChange={(e) => setCalendarId(e.target.value)}
                    placeholder="primary or calendar ID from Google"
                  />
                </Field>
              )}

              <Field label="Admin reminder email">
                <input
                  className={inputClass}
                  value={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.value)}
                  placeholder="contact@royalnordic.fi"
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={Boolean(status?.calendar_sync_enabled)}
                    disabled={busy || !status?.connected}
                    onChange={(e) => void saveFlags({ calendar_sync_enabled: e.target.checked })}
                  />
                  Enable calendar sync (DB)
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={Boolean(status?.reminders_enabled)}
                    disabled={busy || !status?.connected}
                    onChange={(e) => void saveFlags({ reminders_enabled: e.target.checked })}
                  />
                  Enable admin reminders (DB)
                </label>
                <SecondaryButton
                  type="button"
                  disabled={busy}
                  onClick={() => void saveFlags({})}
                >
                  Save email / calendar ID
                </SecondaryButton>
              </div>

              <div className="flex flex-wrap gap-2">
                <SecondaryButton type="button" disabled={busy} onClick={() => void runDryRun()}>
                  Dry-run upcoming bookings
                </SecondaryButton>
                <SecondaryButton type="button" disabled={busy} onClick={() => void enqueueBackfill()}>
                  Enqueue sync (no Google call until workers enabled)
                </SecondaryButton>
              </div>

              {dryRun ? (
                <div className="max-h-64 overflow-auto rounded-lg border border-zinc-100">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-500">
                      <tr>
                        <th className="px-2 py-1.5 font-medium">Ref</th>
                        <th className="px-2 py-1.5 font-medium">Date</th>
                        <th className="px-2 py-1.5 font-medium">Time</th>
                        <th className="px-2 py-1.5 font-medium">Ready</th>
                        <th className="px-2 py-1.5 font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dryRun.map((r) => (
                        <tr key={r.booking_id} className="border-t border-zinc-50">
                          <td className="px-2 py-1.5">
                            <Link className="text-emerald-800 hover:underline" to={`/bookings/${r.booking_id}`}>
                              {r.booking_ref || `RN-${r.booking_id}`}
                            </Link>
                          </td>
                          <td className="px-2 py-1.5">{r.tour_date}</td>
                          <td className="px-2 py-1.5">{r.tour_time || '—'}</td>
                          <td className="px-2 py-1.5">{r.can_sync ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-1.5 text-zinc-500">{r.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {rows.map((r) => (
          <li key={r.name} className="px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-zinc-900">{r.name}</div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{r.note}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${tone[r.status]}`}>
                {label[r.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
        <div className="text-sm font-medium text-zinc-900">CSV import</div>
        <p className="mt-1 text-xs text-zinc-500">
          Import marketplace bookings with source tags. Prefer manual booking for single entries.
        </p>
        <Link to="/import" className="mt-2 inline-flex text-sm font-medium text-emerald-800 hover:underline">
          Open CSV import →
        </Link>
      </div>
    </div>
  )
}
