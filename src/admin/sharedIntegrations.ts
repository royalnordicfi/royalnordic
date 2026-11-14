/** Pure Shared Bookings external integration helpers (no network). */

export type SharedIntegrationProvider = 'getyourguide' | 'bokun'

export type SharedConnectorStatus =
  | 'credentials_required'
  | 'credentials_present'
  | 'mappings_required'
  | 'ready'
  | 'error'

export type SharedConnectorRow = {
  provider: SharedIntegrationProvider
  display_name: string
  ingestion_enabled: boolean
  config_status: SharedConnectorStatus
  last_success_at: string | null
  last_error_at: string | null
  last_error: string | null
  notes: string | null
  mapping_count: number
  open_event_count: number
}

export type SharedProductMapping = {
  id: string
  provider: SharedIntegrationProvider
  external_product_id: string
  external_option_id: string | null
  template_id: string | null
  template_title?: string | null
  supplier_id: string
  supplier_code: string
  supplier_name: string
  default_departure_time: string | null
  adult_categories: string[]
  child_categories: string[]
  is_active: boolean
}

export type SharedInboundEvent = {
  id: string
  provider: SharedIntegrationProvider
  event_key: string
  topic: string
  external_booking_id: string | null
  status: string
  error_code: string | null
  error_message: string | null
  departure_id: string | null
  booking_id: string | null
  attempt_count: number
  processed_at: string | null
  created_at: string
  updated_at: string
}

export type GygAvailabilityOutboxProblem = {
  id: string
  product_id: string
  departure_id: string | null
  departure_date: string | null
  vacancies: number
  reason: string
  status: string
  attempt_count: number
  max_attempts: number
  next_attempt_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
}

/** Edge /status snapshot (booleans only — never includes secret values). */
export type GygExternalStatusSnapshot = {
  credentialsConfigured: boolean
  notifyCredentialsConfigured: boolean
  ingestionEnvEnabled: boolean
  notifyEnvEnabled: boolean
  availabilityLive: boolean
  reservationsLive: boolean
  bookingLifecycleReady: boolean
  availabilityNotifyReady: boolean
  availabilityNotifyLive: boolean
  live: boolean
}

export type GygSecretChecklistItem = {
  name: string
  purpose: 'inbound_basic_auth' | 'outbound_notify' | 'feature_flag'
  configured: boolean | 'unknown'
  requiredForLive: boolean
}

/** Independent flag health for admin ops (ingestion ≠ outbound notify). */
export function gygOpsHealthSummary(input: {
  ingestionEnvEnabled: boolean
  notifyEnvEnabled: boolean
  mappingCount: number
  openInboundEvents: number
  outboxProblems: number
  credentialsConfigured?: boolean
  notifyCredentialsConfigured?: boolean
  templateCount?: number
}): {
  ingestion: 'off' | 'ready_off' | 'on'
  notify: 'off' | 'ready_off' | 'on'
  blockers: string[]
} {
  const blockers: string[] = []
  if (input.credentialsConfigured === false) {
    blockers.push('GYG inbound Basic Auth secrets missing (SHARED_BOOKINGS_GYG_BASIC_USER/PASSWORD)')
  }
  if ((input.templateCount ?? 1) < 1) {
    blockers.push('No Shared Bookings tour templates — create templates before mappings')
  }
  if (input.mappingCount < 1) blockers.push('No active GYG product mappings')
  if (input.notifyCredentialsConfigured === false) {
    blockers.push('GYG outbound notify secrets missing (SHARED_BOOKINGS_GYG_NOTIFY_USER/PASSWORD)')
  }
  if (input.outboxProblems > 0) blockers.push(`${input.outboxProblems} availability notify outbox problem(s)`)
  if (input.openInboundEvents > 0) blockers.push(`${input.openInboundEvents} open inbound event(s)`)

  const inboundReady =
    input.mappingCount > 0 && input.credentialsConfigured !== false && (input.templateCount ?? 1) > 0
  const notifyReady =
    input.mappingCount > 0 && input.notifyCredentialsConfigured !== false && (input.templateCount ?? 1) > 0

  return {
    ingestion: input.ingestionEnvEnabled ? 'on' : inboundReady ? 'ready_off' : 'off',
    notify: input.notifyEnvEnabled ? 'on' : notifyReady ? 'ready_off' : 'off',
    blockers,
  }
}

/** Actionable setup errors for the Integrations page (no secret values). */
export function gygSetupErrors(input: {
  edgeReachable: boolean
  credentialsConfigured: boolean
  notifyCredentialsConfigured: boolean
  ingestionEnvEnabled: boolean
  notifyEnvEnabled: boolean
  templateCount: number
  mappingCount: number
  outboxProblems: number
}): string[] {
  const errors: string[] = []
  if (!input.edgeReachable) {
    errors.push('shared-bookings-external /status is unreachable — check Edge deploy')
  }
  if (!input.credentialsConfigured) {
    errors.push(
      'Set SHARED_BOOKINGS_GYG_BASIC_USER and SHARED_BOOKINGS_GYG_BASIC_PASSWORD (credentials you give GYG to call your supplier API)',
    )
  }
  if (!input.notifyCredentialsConfigured) {
    errors.push(
      'Set SHARED_BOOKINGS_GYG_NOTIFY_USER and SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD (from GYG Integrator Portal → Set Up Your Testing Configuration)',
    )
  }
  if (input.templateCount < 1) {
    errors.push('Create at least one Shared Bookings tour template before saving product mappings')
  }
  if (input.mappingCount < 1) {
    errors.push('Map each GYG productId to a template + supplier (verify ownership in Integrator Portal first)')
  }
  if (input.ingestionEnvEnabled) {
    errors.push('SHARED_BOOKINGS_GYG_INGESTION_ENABLED is ON — turn OFF until live activation is approved')
  }
  if (input.notifyEnvEnabled) {
    errors.push('SHARED_BOOKINGS_GYG_NOTIFY_ENABLED is ON — turn OFF until live activation is approved')
  }
  if (input.outboxProblems > 0) {
    errors.push(`${input.outboxProblems} GYG availability outbox row(s) need retry or investigation`)
  }
  return errors
}

export function gygSecretChecklist(status: Partial<GygExternalStatusSnapshot> | null): GygSecretChecklistItem[] {
  const known = Boolean(status)
  return [
    {
      name: 'SHARED_BOOKINGS_GYG_BASIC_USER',
      purpose: 'inbound_basic_auth',
      configured: known ? status!.credentialsConfigured === true : 'unknown',
      requiredForLive: true,
    },
    {
      name: 'SHARED_BOOKINGS_GYG_BASIC_PASSWORD',
      purpose: 'inbound_basic_auth',
      configured: known ? status!.credentialsConfigured === true : 'unknown',
      requiredForLive: true,
    },
    {
      name: 'SHARED_BOOKINGS_GYG_INGESTION_ENABLED',
      purpose: 'feature_flag',
      // Flag is "configured" when present in Edge; value shown separately in readiness badges.
      configured: known ? true : 'unknown',
      requiredForLive: true,
    },
    {
      name: 'SHARED_BOOKINGS_GYG_NOTIFY_USER',
      purpose: 'outbound_notify',
      configured: known ? status!.notifyCredentialsConfigured === true : 'unknown',
      requiredForLive: true,
    },
    {
      name: 'SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD',
      purpose: 'outbound_notify',
      configured: known ? status!.notifyCredentialsConfigured === true : 'unknown',
      requiredForLive: true,
    },
    {
      name: 'SHARED_BOOKINGS_GYG_NOTIFY_ENABLED',
      purpose: 'feature_flag',
      configured: known ? true : 'unknown',
      requiredForLive: true,
    },
  ]
}

/** GO only when config is complete and live flags remain intentionally OFF. */
export function assessGygActivationReadiness(input: {
  edgeDeployed: boolean
  uiDeployed: boolean
  certificationOk: boolean
  credentialsConfigured: boolean
  notifyCredentialsConfigured: boolean
  templateCount: number
  mappingCount: number
  ingestionEnvEnabled: boolean
  notifyEnvEnabled: boolean
  notifyCronConfigured: boolean
  outboxProblems: number
}): { verdict: 'GO' | 'NO-GO'; blockers: string[]; notes: string[] } {
  const blockers: string[] = []
  const notes: string[] = []

  if (!input.edgeDeployed) blockers.push('Edge Functions not deployed')
  if (!input.uiDeployed) blockers.push('Admin/operator UI not deployed')
  if (!input.certificationOk) blockers.push('Lifecycle certification failed')
  if (!input.credentialsConfigured) blockers.push('Inbound GYG Basic Auth credentials missing')
  if (!input.notifyCredentialsConfigured) blockers.push('Outbound GYG notify credentials missing')
  if (input.templateCount < 1) blockers.push('No tour templates')
  if (input.mappingCount < 1) blockers.push('No active product mappings')
  if (!input.notifyCronConfigured) blockers.push('Notify outbox cron not registered')
  if (input.outboxProblems > 0) blockers.push('Unresolved notify outbox problems')
  if (input.ingestionEnvEnabled) blockers.push('Ingestion flag is ON (must stay OFF until explicit live approval)')
  if (input.notifyEnvEnabled) blockers.push('Notify flag is ON (must stay OFF until explicit live approval)')

  if (blockers.length === 0) {
    notes.push('Configuration complete with live flags OFF — awaiting separate live activation approval')
  } else {
    notes.push('Do not enable SHARED_BOOKINGS_GYG_INGESTION_ENABLED or SHARED_BOOKINGS_GYG_NOTIFY_ENABLED yet')
  }

  return { verdict: blockers.length === 0 ? 'GO' : 'NO-GO', blockers, notes }
}

/**
 * GYG mapping slots for Standard Bus only.
 * Product/option IDs are intentionally empty until verified in Integrator Portal — never invent them.
 */
export function proposedGygMappingCandidates(): Array<{
  externalProductId: string
  suggestedTitle: string
  source: string
  verified: false
  notes: string
}> {
  return [
    {
      externalProductId: '',
      suggestedTitle: 'Standard Group Northern Lights',
      source: 'Shared Bookings 1.6H — Standard Bus only',
      verified: false,
      notes:
        'Await verified GetYourGuide productId + optionId for Royal Nordic Standard Group Northern Lights (20:00 / 50). Do not map Guaranteed, Korouoma, or any other product. Save inactive until verified.',
    },
  ]
}

export const GYG_ADULT_CATEGORIES = ['ADULT', 'SENIOR', 'YOUTH', 'STUDENT'] as const
export const GYG_CHILD_CATEGORIES = ['CHILD', 'INFANT'] as const

export function countGygSeatCategories(
  items: Array<{ category?: string; count?: number }>,
  adultCategories: readonly string[] = GYG_ADULT_CATEGORIES,
  childCategories: readonly string[] = GYG_CHILD_CATEGORIES,
): { adults: number; children: number; total: number } {
  let adults = 0
  let children = 0
  for (const item of items) {
    const cat = String(item.category || '').toUpperCase()
    const count = Math.max(0, Number(item.count) || 0)
    if (childCategories.map((c) => c.toUpperCase()).includes(cat)) children += count
    else adults += count
  }
  return { adults, children, total: adults + children }
}

export function parseGygDateTime(dateTime: string): { date?: string; time?: string } {
  const m = dateTime.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (!m) return {}
  return { date: m[1], time: m[2] === '00:00' ? undefined : m[2] }
}

/** Build Bókun webhook HMAC base string per official docs. */
export function bokunHmacBaseString(
  headers: Record<string, string>,
): string {
  const pairs = Object.entries(headers)
    .map(([k, v]) => [k.toLowerCase(), v] as const)
    .filter(([k]) => k.startsWith('x-bokun-') && k !== 'x-bokun-hmac')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
  return pairs.join('&')
}

export function connectorStatusLabel(status: SharedConnectorStatus): string {
  switch (status) {
    case 'credentials_required':
      return 'Credentials required'
    case 'credentials_present':
      return 'Credentials present'
    case 'mappings_required':
      return 'Product mappings required'
    case 'ready':
      return 'Ready'
    case 'error':
      return 'Error'
    default:
      return status
  }
}

export function requiredSecretsFor(provider: SharedIntegrationProvider): string[] {
  if (provider === 'getyourguide') {
    return [
      'SHARED_BOOKINGS_GYG_BASIC_USER',
      'SHARED_BOOKINGS_GYG_BASIC_PASSWORD',
      'SHARED_BOOKINGS_GYG_INGESTION_ENABLED',
      // Outbound notify uses separate GYG-provided credentials (1.6D); keep OFF until approved.
      'SHARED_BOOKINGS_GYG_NOTIFY_USER',
      'SHARED_BOOKINGS_GYG_NOTIFY_PASSWORD',
      'SHARED_BOOKINGS_GYG_NOTIFY_ENABLED',
    ]
  }
  return [
    'SHARED_BOOKINGS_BOKUN_WEBHOOK_SECRET',
    'SHARED_BOOKINGS_BOKUN_INGESTION_ENABLED',
  ]
}

export function externalEndpointPaths(provider: SharedIntegrationProvider): string[] {
  if (provider === 'getyourguide') {
    return [
      // Public Integrator Portal gateway (royalnordic.fi → Edge).
      'https://royalnordic.fi/api/gyg/1/get-availabilities',
      'https://royalnordic.fi/api/gyg/1/reserve',
      'https://royalnordic.fi/api/gyg/1/cancel-reservation',
      'https://royalnordic.fi/api/gyg/1/book',
      'https://royalnordic.fi/api/gyg/1/cancel-booking',
      // Upstream Edge (internal).
      '/functions/v1/shared-bookings-external/gyg/1/get-availabilities',
    ]
  }
  return ['/functions/v1/shared-bookings-external/bokun/webhook']
}
