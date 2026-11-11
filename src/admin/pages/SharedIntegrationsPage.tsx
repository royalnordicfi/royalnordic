import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  fetchSharedBookingsAccess,
  listSharedInboundEvents,
  listSharedIntegrations,
  listSharedProductMappings,
  listSharedSuppliersAdmin,
  listSharedTourTemplates,
  retrySharedInboundEvent,
  setSharedConnectorFlags,
  upsertSharedProductMapping,
} from '../adminApi'
import { Badge } from '../components/Badge'
import {
  Card,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  inputClass,
  selectClass,
} from '../components/ui'
import type { SharedBookingsAccess, SharedSupplierOption, SharedTourTemplate } from '../sharedBookings'
import {
  connectorStatusLabel,
  externalEndpointPaths,
  requiredSecretsFor,
  type SharedConnectorRow,
  type SharedInboundEvent,
  type SharedIntegrationProvider,
  type SharedProductMapping,
} from '../sharedIntegrations'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'
import { SHARED_BOOKINGS_ADMIN_BASE } from '../../lib/sharedBookingsPortal'

export default function SharedIntegrationsPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [connectors, setConnectors] = useState<SharedConnectorRow[]>([])
  const [mappings, setMappings] = useState<SharedProductMapping[]>([])
  const [events, setEvents] = useState<SharedInboundEvent[]>([])
  const [templates, setTemplates] = useState<SharedTourTemplate[]>([])
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [provider, setProvider] = useState<SharedIntegrationProvider>('getyourguide')
  const [productId, setProductId] = useState('')
  const [optionId, setOptionId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [defaultTime, setDefaultTime] = useState('')

  const isAdminHost = base === SHARED_BOOKINGS_ADMIN_BASE

  const reload = async () => {
    const [a, c, m, e, t, s] = await Promise.all([
      fetchSharedBookingsAccess(),
      listSharedIntegrations(),
      listSharedProductMappings(),
      listSharedInboundEvents({ limit: 40 }),
      listSharedTourTemplates(false),
      listSharedSuppliersAdmin(),
    ])
    setAccess(a)
    if (!c.ok) throw new Error(c.error || 'Could not load connectors')
    setConnectors(c.connectors)
    setNote(c.live_ingestion_note || '')
    if (m.ok) setMappings(m.mappings)
    if (e.ok) setEvents(e.events)
    if (t.ok) setTemplates(t.templates)
    if (s.ok) setSuppliers(s.suppliers.filter((x) => x.is_active))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void reload()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!isAdminHost) {
    return <Navigate to={paths.accessDenied} replace />
  }

  if (access && access.ok && access.access !== 'admin') {
    return <Navigate to={paths.root} replace />
  }

  const saveMapping = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await upsertSharedProductMapping({
        provider,
        external_product_id: productId.trim(),
        external_option_id: optionId.trim() || undefined,
        template_id: templateId || null,
        supplier_id: supplierId,
        default_departure_time: defaultTime.trim() || undefined,
      })
      if (!res.ok) {
        setError(res.error || 'Could not save mapping')
        return
      }
      setProductId('')
      setOptionId('')
      setDefaultTime('')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save mapping')
    } finally {
      setSaving(false)
    }
  }

  const markReady = async (p: SharedIntegrationProvider) => {
    setSaving(true)
    setError('')
    try {
      const res = await setSharedConnectorFlags({
        provider: p,
        config_status: 'ready',
        ingestion_enabled: false,
      })
      if (!res.ok) {
        setError(res.error || 'Could not update connector')
        return
      }
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update connector')
    } finally {
      setSaving(false)
    }
  }

  const retry = async (id: string) => {
    setSaving(true)
    setError('')
    try {
      const res = await retrySharedInboundEvent(id)
      if (!res.ok) setError(res.error || 'Retry failed')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shared Bookings integrations"
        subtitle="GetYourGuide Supplier API + Bókun webhooks. Credentials stay in Edge secrets — never shown to operators."
        actions={
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => void reload()} disabled={loading || saving}>
              Refresh
            </SecondaryButton>
            <Link
              to={paths.root}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              ← Calendar
            </Link>
          </div>
        }
      />

      {note ? <p className="text-xs text-zinc-500">{note}</p> : null}
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {connectors.map((c) => (
          <Card key={c.provider} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-zinc-900">{c.display_name}</h2>
                <p className="mt-0.5 text-xs text-zinc-500">{connectorStatusLabel(c.config_status)}</p>
              </div>
              <Badge tone={c.ingestion_enabled ? 'green' : 'gray'}>
                {c.ingestion_enabled ? 'Ingestion on' : 'Ingestion off'}
              </Badge>
            </div>
            <p className="text-xs text-zinc-600">{c.notes}</p>
            <div className="grid grid-cols-2 gap-2 text-center sm:text-left">
              <div className="rounded-lg bg-zinc-50 px-2 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Mappings</p>
                <p className="text-sm font-semibold">{c.mapping_count}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 px-2 py-2">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400">Open events</p>
                <p className="text-sm font-semibold">{c.open_event_count}</p>
              </div>
            </div>
            {c.last_success_at ? (
              <p className="text-[11px] text-zinc-500">Last success: {c.last_success_at}</p>
            ) : (
              <p className="text-[11px] text-zinc-500">No successful sync yet</p>
            )}
            {c.last_error ? (
              <p className="text-[11px] text-red-700">Last error: {c.last_error}</p>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Required Edge secrets
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-600">
                {requiredSecretsFor(c.provider).map((s) => (
                  <li key={s} className="font-mono">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Endpoints
              </p>
              <ul className="mt-1 space-y-0.5 text-[11px] text-zinc-600">
                {externalEndpointPaths(c.provider).map((p) => (
                  <li key={p} className="break-all font-mono">
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <SecondaryButton
              type="button"
              disabled={saving || c.mapping_count < 1}
              onClick={() => void markReady(c.provider)}
            >
              Mark ready (still off until Edge flag)
            </SecondaryButton>
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Map external product → tour template</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Provider">
            <select
              className={selectClass}
              value={provider}
              onChange={(e) => setProvider(e.target.value as SharedIntegrationProvider)}
            >
              <option value="getyourguide">GetYourGuide</option>
              <option value="bokun">Bókun</option>
            </select>
          </Field>
          <Field label="Supplier ownership">
            <select
              className={selectClass}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="External product ID">
            <input className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} />
          </Field>
          <Field label="External option ID (optional)">
            <input className={inputClass} value={optionId} onChange={(e) => setOptionId(e.target.value)} />
          </Field>
          <Field label="Tour template">
            <select
              className={selectClass}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default departure time">
            <input
              className={inputClass}
              placeholder="09:00"
              value={defaultTime}
              onChange={(e) => setDefaultTime(e.target.value)}
            />
          </Field>
        </div>
        <PrimaryButton
          type="button"
          disabled={saving || !productId.trim() || !supplierId}
          onClick={() => void saveMapping()}
        >
          Save mapping
        </PrimaryButton>
        {mappings.length > 0 ? (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {mappings.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{m.provider}</span> · {m.external_product_id}
                  {m.external_option_id ? ` / ${m.external_option_id}` : ''} →{' '}
                  {m.template_title || 'template'} ({m.supplier_name})
                </span>
                <Badge tone={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'active' : 'off'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No product mappings yet.</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">Recent inbound events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-zinc-500">No inbound events yet.</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev) => (
              <li
                key={ev.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-zinc-900">
                    {ev.provider} · {ev.topic}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {ev.external_booking_id || ev.event_key} · {ev.status}
                    {ev.error_code ? ` · ${ev.error_code}` : ''}
                  </p>
                  {ev.error_message ? (
                    <p className="mt-1 text-xs text-red-700">{ev.error_message}</p>
                  ) : null}
                </div>
                {['failed', 'quarantined', 'ignored', 'received', 'retrying'].includes(ev.status) ? (
                  <SecondaryButton
                    type="button"
                    disabled={saving}
                    onClick={() => void retry(ev.id)}
                  >
                    Retry
                  </SecondaryButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
