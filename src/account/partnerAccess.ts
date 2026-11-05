import type { User } from '@supabase/supabase-js'

/**
 * Partner access is derived from server-controlled app_metadata only for privileges.
 * user_metadata.partner_application_submitted is display-only (application received)
 * and must never unlock partner pricing or dashboards that imply approval.
 */
export type PartnerAccess = 'approved' | 'pending' | 'none'

export type AccountIntent = 'rewards' | 'partners'

export function getPartnerAccess(user: User | null | undefined): PartnerAccess {
  if (!user) return 'none'
  const app = (user.app_metadata || {}) as Record<string, unknown>
  const status = String(app.partner_status || app.partnerStatus || '')
    .trim()
    .toLowerCase()
  if (status === 'approved' || status === 'active') return 'approved'
  if (status === 'pending' || status === 'submitted' || status === 'review') return 'pending'

  const um = (user.user_metadata || {}) as Record<string, unknown>
  const submitted = um.partner_application_submitted
  if (submitted === true || submitted === 'true' || submitted === 1 || submitted === '1') {
    return 'pending'
  }
  return 'none'
}

/** True only when server app_metadata grants partner approval. */
export function isApprovedPartner(user: User | null | undefined): boolean {
  return getPartnerAccess(user) === 'approved'
}

/**
 * Post-login destination. Intent comes from the entry path the user chose;
 * it never writes roles — it only chooses which screen to open.
 */
export function resolvePostLoginPath(
  user: User | null | undefined,
  intent?: AccountIntent | null,
): string {
  const partner = getPartnerAccess(user)

  if (intent === 'partners') {
    if (partner === 'approved') return '/partners/dashboard'
    if (partner === 'pending') return '/partners/status'
    return '/partners/apply'
  }

  if (intent === 'rewards') {
    return '/referralprogram/dashboard'
  }

  if (partner === 'approved') return '/partners/dashboard'
  if (partner === 'pending') return '/partners/status'
  return '/referralprogram/dashboard'
}

export function parseAccountIntent(raw: unknown): AccountIntent | null {
  const v = String(raw || '')
    .trim()
    .toLowerCase()
  if (v === 'rewards' || v === 'partners') return v
  return null
}
