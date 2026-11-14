import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  fetchSharedBookingsAccess,
  fetchSharedExternalStatus,
  listGygAvailabilityOutboxProblems,
  listSharedInboundEvents,
  listSharedIntegrations,
  listSharedProductMappings,
  listSharedSuppliersAdmin,
  listSharedTourTemplates,
  retryGygAvailabilityOutbox,
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
  assessGygActivationReadiness,
  connectorStatusLabel,
  externalEndpointPaths,
  gygOpsHealthSummary,
  gygSecretChecklist,
  gygSetupErrors,
  proposedGygMappingCandidates,
  requiredSecretsFor,
  type GygAvailabilityOutboxProblem,
  type GygExternalStatusSnapshot,
  type SharedConnectorRow,
  type SharedInboundEvent,
  type SharedIntegrationProvider,
  type SharedProductMapping,
} from '../sharedIntegrations'
import { sharedBookingsPaths, useSharedBookingsBase } from '../sharedBookingsPaths'
import { SHARED_BOOKINGS_ADMIN_BASE } from '../../lib/sharedBookingsPortal'
import { runSharedBookingsCertification } from '../sharedBookingsCertification'
import {
  SHARED_BUS_CAPACITY,
  SHARED_BUS_DEPARTURE_TIME,
  SHARED_BUS_GYG_SUPPLIER_CODE,
  SHARED_BUS_TEMPLATE_CODE,
  SHARED_BUS_TEMPLATE_TITLE,
  isSharedBusTourTitle,
} from '../sharedBus'
import { gygIntegratorPortalConfig } from '../gygGateway'

export default function SharedIntegrationsPage() {
  const base = useSharedBookingsBase()
  const paths = sharedBookingsPaths(base)
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [connectors, setConnectors] = useState<SharedConnectorRow[]>([])
  const [mappings, setMappings] = useState<SharedProductMapping[]>([])
  const [events, setEvents] = useState<SharedInboundEvent[]>([])
  const [outboxProblems, setOutboxProblems] = useState<GygAvailabilityOutboxProblem[]>([])
  const [outboxUnavailable, setOutboxUnavailable] = useState(false)
  const [templates, setTemplates] = useState<SharedTourTemplate[]>([])
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [edgeStatus, setEdgeStatus] = useState<GygExternalStatusSnapshot | null>(null)
  const [edgeOk, setEdgeOk] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [certOk, setCertOk] = useState<boolean | null>(null)

  const [provider, setProvider] = useState<SharedIntegrationProvider>('getyourguide')
  const [productId, setProductId] = useState('')
  const [optionId, setOptionId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [defaultTime, setDefaultTime] = useState(SHARED_BUS_DEPARTURE_TIME)

  const isAdminHost = base === SHARED_BOOKINGS_ADMIN_BASE
  const candidates = proposedGygMappingCandidates()
  const standardTemplates = templates.filter(
    (t) => t.code === SHARED_BUS_TEMPLATE_CODE || isSharedBusTourTitle(t.title),
  )
  const mappingTemplates = provider === 'getyourguide' ? standardTemplates : templates

  const reload = async () => {
    const [a, c, m, e, t, s, o, st] = await Promise.all([
      fetchSharedBookingsAccess(),
      listSharedIntegrations(),
      listSharedProductMappings(),
      listSharedInboundEvents({ limit: 40 }),
      listSharedTourTemplates(false),
      listSharedSuppliersAdmin(),
      listGygAvailabilityOutboxProblems(40),
      fetchSharedExternalStatus(),
    ])
    setAccess(a)
    if (!c.ok) throw new Error(c.error || 'Could not load connectors')
    setConnectors(c.connectors)
    setNote(c.live_ingestion_note || '')
    if (m.ok) setMappings(m.mappings)
    if (e.ok) setEvents(e.events)
    const nextTemplates = t.ok ? t.templates : []
    if (t.ok) setTemplates(nextTemplates)
    const nextSuppliers = s.ok ? s.suppliers.filter((x) => x.is_active) : []
    if (s.ok) setSuppliers(nextSuppliers)
    if (o.ok) {
      setOutboxProblems(o.items)
      setOutboxUnavailable(Boolean(o.unavailable))
    }
    setEdgeOk(Boolean(st.ok && st.gyg))
    setEdgeStatus(st.gyg)
    setCertOk(runSharedBookingsCertification().ok)

    const busTpl =
      nextTemplates.find((x) => x.code === SHARED_BUS_TEMPLATE_CODE) ||
      nextTemplates.find((x) => isSharedBusTourTitle(x.title))
    if (busTpl) setTemplateId(busTpl.id)
    const rn = nextSuppliers.find((x) => x.code === SHARED_BUS_GYG_SUPPLIER_CODE)
    if (rn) setSupplierId(rn.id)
    setDefaultTime(SHARED_BUS_DEPARTURE_TIME)
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
      if (!templateId) {
        setError('Select a tour template before saving a mapping')
        return
      }
      if (provider === 'getyourguide') {
        const busTpl = standardTemplates.find((t) => t.id === templateId)
        if (!busTpl) {
          setError('GetYourGuide mappings are limited to Standard Group Northern Lights')
          return
        }
        if (defaultTime.trim() !== SHARED_BUS_DEPARTURE_TIME) {
          setError(`Standard Bus departure time must be ${SHARED_BUS_DEPARTURE_TIME}`)
          return
        }
      }
      const res = await upsertSharedProductMapping({
        provider,
        external_product_id: productId.trim(),
        external_option_id: optionId.trim() || undefined,
        template_id: templateId || null,
        supplier_id: supplierId,
        default_departure_time:
          provider === 'getyourguide' ? SHARED_BUS_DEPARTURE_TIME : defaultTime.trim() || undefined,
        is_active: false,
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

  const retryOutbox = async (id: string) => {
    setSaving(true)
    setError('')
    try {
      const res = await retryGygAvailabilityOutbox(id)
      if (!res.ok) setError(res.error || 'Outbox retry failed')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Outbox retry failed')
    } finally {
      setSaving(false)
    }
  }

  const gygConnector = connectors.find((c) => c.provider === 'getyourguide')
  const gygMappingCount =
    gygConnector?.mapping_count ?? mappings.filter((m) => m.provider === 'getyourguide' && m.is_active).length
  const health = gygOpsHealthSummary({
    ingestionEnvEnabled: edgeStatus?.ingestionEnvEnabled ?? false,
    notifyEnvEnabled: edgeStatus?.notifyEnvEnabled ?? false,
    mappingCount: gygMappingCount,
    openInboundEvents: gygConnector?.open_event_count ?? 0,
    outboxProblems: outboxProblems.length,
    credentialsConfigured: edgeStatus?.credentialsConfigured,
    notifyCredentialsConfigured: edgeStatus?.notifyCredentialsConfigured,
    templateCount: templates.length,
  })
  const setupErrors = gygSetupErrors({
    edgeReachable: edgeOk,
    credentialsConfigured: edgeStatus?.credentialsConfigured ?? false,
    notifyCredentialsConfigured: edgeStatus?.notifyCredentialsConfigured ?? false,
    ingestionEnvEnabled: edgeStatus?.ingestionEnvEnabled ?? false,
    notifyEnvEnabled: edgeStatus?.notifyEnvEnabled ?? false,
    templateCount: templates.length,
    mappingCount: gygMappingCount,
    outboxProblems: outboxProblems.length,
  })
  const readiness = assessGygActivationReadiness({
    edgeDeployed: edgeOk,
    uiDeployed: true,
    certificationOk: certOk === true,
    credentialsConfigured: edgeStatus?.credentialsConfigured ?? false,
    notifyCredentialsConfigured: edgeStatus?.notifyCredentialsConfigured ?? false,
    templateCount: templates.length,
    mappingCount: gygMappingCount,
    ingestionEnvEnabled: edgeStatus?.ingestionEnvEnabled ?? false,
    notifyEnvEnabled: edgeStatus?.notifyEnvEnabled ?? false,
    notifyCronConfigured: !outboxUnavailable,
    outboxProblems: outboxProblems.length,
  })
  const secrets = gygSecretChecklist(edgeStatus)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shared Bookings integrations"
        subtitle={`Standard Group Northern Lights shared bus only (${SHARED_BUS_DEPARTURE_TIME} / ${SHARED_BUS_CAPACITY}). GYG maps to Royal Nordic product IDs only — never Guaranteed/Korouoma/other. Credentials stay in Edge secrets.`}
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

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Production readiness</h2>
          <Badge tone={readiness.verdict === 'GO' ? 'green' : 'red'}>{readiness.verdict}</Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone={edgeOk ? 'green' : 'red'}>Edge: {edgeOk ? 'reachable' : 'down'}</Badge>
          <Badge tone={edgeStatus?.credentialsConfigured ? 'green' : 'yellow'}>
            Inbound auth: {edgeStatus?.credentialsConfigured ? 'configured' : 'missing'}
          </Badge>
          <Badge tone={edgeStatus?.notifyCredentialsConfigured ? 'green' : 'yellow'}>
            Notify auth: {edgeStatus?.notifyCredentialsConfigured ? 'configured' : 'missing'}
          </Badge>
          <Badge tone={edgeStatus?.live ? 'red' : 'gray'}>
            Live traffic: {edgeStatus?.live ? 'ON' : 'OFF'}
          </Badge>
          <Badge tone={edgeStatus?.ingestionEnvEnabled ? 'red' : 'gray'}>
            Ingestion: {health.ingestion}
          </Badge>
          <Badge tone={edgeStatus?.notifyEnvEnabled || edgeStatus?.availabilityNotifyLive ? 'red' : 'gray'}>
            Notify: {health.notify}
          </Badge>
          <Badge tone={certOk ? 'green' : 'red'}>Lifecycle cert: {certOk ? 'PASS' : 'FAIL'}</Badge>
          <Badge tone={templates.length ? 'green' : 'yellow'}>Templates: {templates.length}</Badge>
          <Badge tone={gygMappingCount > 0 ? 'green' : 'yellow'}>Active GYG mappings: {gygMappingCount}</Badge>
          <Badge tone={outboxProblems.length ? 'red' : 'green'}>
            Outbox: {outboxUnavailable ? 'schema pending' : `${outboxProblems.length} problem(s)`}
          </Badge>
        </div>
        {setupErrors.length > 0 ? (
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-800">
            {setupErrors.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-500">
            Setup complete with live flags OFF. Await separate approval before enabling GYG traffic.
          </p>
        )}
        {readiness.notes.map((n) => (
          <p key={n} className="text-xs text-zinc-500">
            {n}
          </p>
        ))}
      </Card>

      <Card className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900">GYG connection status</h2>
        {(() => {
          const portal = gygIntegratorPortalConfig()
          return (
            <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
              <p className="font-semibold text-zinc-900">Integrator Portal (enter after verification)</p>
              <p className="mt-1 font-mono">
                Host {portal.host} · Port {portal.port} · Path {portal.path}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                Public gateway proxies to Shared Bookings Edge. Example:{' '}
                <span className="font-mono">https://royalnordic.fi/api/gyg/1/get-availabilities</span>
              </p>
            </div>
          )
        })()}
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-zinc-700">
          <p>
            Availability API:{' '}
            <span className="font-medium">{edgeStatus?.availabilityLive ? 'ready' : '—'}</span>
          </p>
          <p>
            Reservations:{' '}
            <span className="font-medium">{edgeStatus?.reservationsLive ? 'ready' : '—'}</span>
          </p>
          <p>
            Book / cancel:{' '}
            <span className="font-medium">{edgeStatus?.bookingLifecycleReady ? 'ready' : '—'}</span>
          </p>
          <p>
            Notify worker:{' '}
            <span className="font-medium">
              {edgeStatus?.availabilityNotifyReady ? 'ready' : '—'}
              {edgeStatus?.availabilityNotifyLive ? ' (LIVE)' : ' (gated OFF)'}
            </span>
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Edge secrets (presence only)
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-zinc-600">
            {secrets.map((s) => (
              <li key={s.name} className="flex flex-wrap items-center gap-2 font-mono">
                <span>{s.name}</span>
                <Badge
                  tone={
                    s.configured === true
                      ? s.purpose === 'feature_flag'
                        ? 'gray'
                        : 'green'
                      : s.configured === false
                        ? 'yellow'
                        : 'gray'
                  }
                >
                  {s.purpose === 'feature_flag' && s.name.includes('INGESTION')
                    ? edgeStatus?.ingestionEnvEnabled
                      ? 'ON'
                      : 'OFF'
                    : s.purpose === 'feature_flag' && s.name.includes('NOTIFY_ENABLED')
                      ? edgeStatus?.notifyEnvEnabled
                        ? 'ON'
                        : 'OFF'
                      : s.configured === true
                        ? 'present'
                        : s.configured === false
                          ? 'missing'
                          : 'unknown'}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-zinc-500">
            Obtain inbound Basic Auth values you register with GYG; obtain notify credentials from Integrator
            Portal → Set Up Your Testing Configuration. Set via{' '}
            <span className="font-mono">supabase secrets set</span> — never paste into this UI.
          </p>
        </div>
      </Card>

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
              disabled={saving || c.mapping_count < 1 || !edgeStatus?.credentialsConfigured}
              onClick={() => void markReady(c.provider)}
            >
              Mark ready (still off until Edge flag)
            </SecondaryButton>
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">
          Map GYG product → {SHARED_BUS_TEMPLATE_TITLE}
        </h2>
        {standardTemplates.length === 0 ? (
          <p className="text-sm text-amber-800">
            Standard Bus template missing. Apply migration{' '}
            <span className="font-mono">shared_bookings_standard_bus_only</span> (or create template{' '}
            <span className="font-mono">{SHARED_BUS_TEMPLATE_CODE}</span>) before saving mappings.
          </p>
        ) : null}
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
              disabled={provider === 'getyourguide'}
            >
              <option value="">Select supplier</option>
              {suppliers
                .filter((s) => provider !== 'getyourguide' || s.code === SHARED_BUS_GYG_SUPPLIER_CODE)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="External product ID (verified only)">
            <input
              className={inputClass}
              value={productId}
              placeholder="Paste verified GYG productId"
              onChange={(e) => setProductId(e.target.value)}
            />
          </Field>
          <Field label="External option ID (verified only)">
            <input
              className={inputClass}
              value={optionId}
              placeholder="Optional verified optionId"
              onChange={(e) => setOptionId(e.target.value)}
            />
          </Field>
          <Field label="Tour template">
            <select
              className={selectClass}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={provider === 'getyourguide'}
            >
              <option value="">Select template</option>
              {mappingTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default departure time">
            <input
              className={inputClass}
              value={defaultTime}
              readOnly={provider === 'getyourguide'}
              onChange={(e) => setDefaultTime(e.target.value)}
            />
          </Field>
        </div>
        <PrimaryButton
          type="button"
          disabled={saving || !productId.trim() || !supplierId || !templateId}
          onClick={() => void saveMapping()}
        >
          Save mapping as inactive draft
        </PrimaryButton>
        <p className="text-[11px] text-zinc-500">
          GYG drafts stay inactive. Do not invent product/option IDs. Guaranteed NL and other tours stay out of
          scope.
        </p>
        {mappings.length > 0 ? (
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {mappings.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{m.provider}</span> · {m.external_product_id}
                  {m.external_option_id ? ` / ${m.external_option_id}` : ''} →{' '}
                  {m.template_title || 'template'} ({m.supplier_name})
                </span>
                <Badge tone={m.is_active ? 'green' : 'gray'}>{m.is_active ? 'active' : 'inactive'}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No product mappings yet.</p>
        )}
        <div className="rounded-lg border border-dashed border-zinc-300 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Awaiting verified GYG IDs (not activated)
          </p>
          <ul className="mt-1 space-y-1 text-xs text-zinc-600">
            {candidates.map((c) => (
              <li key={c.suggestedTitle}>
                {c.suggestedTitle} · {c.source}. {c.notes}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900">GYG availability notify outbox</h2>
        {outboxUnavailable ? (
          <p className="text-sm text-amber-800">Outbox schema not available on this database.</p>
        ) : outboxProblems.length === 0 ? (
          <p className="text-sm text-zinc-500">No failed or stuck availability notifications.</p>
        ) : (
          <ul className="space-y-2">
            {outboxProblems.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-zinc-900">
                    {row.product_id} · {row.departure_date || '—'} · vac {row.vacancies}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {row.status} · attempts {row.attempt_count}/{row.max_attempts} · {row.reason}
                  </p>
                  {row.last_error ? (
                    <p className="mt-1 text-xs text-red-700">{row.last_error}</p>
                  ) : null}
                </div>
                {['failed', 'dead', 'pending', 'processing'].includes(row.status) ? (
                  <SecondaryButton
                    type="button"
                    disabled={saving}
                    onClick={() => void retryOutbox(row.id)}
                  >
                    Retry
                  </SecondaryButton>
                ) : null}
              </li>
            ))}
          </ul>
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
