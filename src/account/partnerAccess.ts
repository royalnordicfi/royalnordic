import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

/**
 * Partner access privileges require server DB membership (and app_metadata as a cache).
 * Client selection never grants approval. user_metadata alone is not enough for approved.
 */
export type PartnerAccess = 'approved' | 'pending' | 'declined' | 'none'

export type AccountIntent = 'rewards' | 'partners'

export type PartnerAccessResult = {
  access: PartnerAccess
  company_id?: string | null
  company_name?: string | null
  application_id?: string | null
  member_role?: string | null
  submitted_at?: string | null
}

/** JWT/app_metadata hint only — prefer fetchPartnerAccess for gates. */
export function getPartnerAccessFromUser(user: User | null | undefined): PartnerAccess {
  if (!user) return 'none'
  const app = (user.app_metadata || {}) as Record<string, unknown>
  const status = String(app.partner_status || app.partnerStatus || '')
    .trim()
    .toLowerCase()
  if (status === 'approved' || status === 'active') return 'approved'
  if (status === 'declined') return 'declined'
  if (status === 'pending' || status === 'submitted' || status === 'review') return 'pending'
  return 'none'
}

/** @deprecated use getPartnerAccessFromUser or fetchPartnerAccess */
export function getPartnerAccess(user: User | null | undefined): PartnerAccess {
  return getPartnerAccessFromUser(user)
}

export function isApprovedPartner(user: User | null | undefined): boolean {
  return getPartnerAccessFromUser(user) === 'approved'
}

/** DB source of truth via SECURITY DEFINER RPC. */
export async function fetchPartnerAccess(): Promise<PartnerAccessResult> {
  const { data, error } = await supabase.rpc('get_my_partner_access')
  if (error) {
    return { access: 'none' }
  }
  const access = String(data?.access || 'none') as PartnerAccess
  return {
    access: ['approved', 'pending', 'declined', 'none'].includes(access) ? access : 'none',
    company_id: data?.company_id ?? null,
    company_name: data?.company_name ?? null,
    application_id: data?.application_id ?? null,
    member_role: data?.member_role ?? null,
    submitted_at: data?.submitted_at ?? null,
  }
}

export function resolvePostLoginPath(
  user: User | null | undefined,
  intent?: AccountIntent | null,
  dbAccess?: PartnerAccess | null,
): string {
  const partner = dbAccess || getPartnerAccessFromUser(user)

  if (intent === 'partners') {
    if (partner === 'approved') return '/partners/dashboard'
    if (partner === 'pending') return '/partners/status'
    if (partner === 'declined') return '/partners/apply'
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

export const PARTNER_BUSINESS_TYPES = [
  { value: 'dmc', label: 'DMC' },
  { value: 'travel_agency', label: 'Travel agency' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'other', label: 'Other' },
] as const
