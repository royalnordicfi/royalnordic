import { supabase } from '../../lib/supabase'
import { PARTNER_BUSINESS_TYPES } from '../partnerAccess'

export type PartnerCompany = {
  id: string
  name: string
  business_id: string | null
  vat_id: string | null
  country: string
  business_type: string
  website: string | null
  description: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  postal_code: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  created_at?: string
  updated_at?: string
}

export type PartnerCompanyPayload = {
  ok: boolean
  error?: string
  access?: string
  member_role?: string | null
  member_status?: string | null
  member_id?: string | null
  company?: PartnerCompany | null
}

export type PartnerContactUpdate = {
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  postal_code?: string | null
  vat_id?: string | null
  website?: string | null
}

export function businessTypeLabel(value: string | null | undefined): string {
  const found = PARTNER_BUSINESS_TYPES.find((t) => t.value === value)
  return found?.label || value || '—'
}

export async function fetchMyPartnerCompany(): Promise<PartnerCompanyPayload> {
  const { data, error } = await supabase.rpc('get_my_partner_company')
  if (error) return { ok: false, error: error.message }
  return (data || { ok: false, error: 'empty' }) as PartnerCompanyPayload
}

export async function updateMyPartnerCompanyContact(
  input: PartnerContactUpdate,
): Promise<PartnerCompanyPayload> {
  const { data, error } = await supabase.rpc('update_my_partner_company_contact', {
    p_contact_name: input.contact_name ?? null,
    p_contact_email: input.contact_email ?? null,
    p_contact_phone: input.contact_phone ?? null,
    p_address_line1: input.address_line1 ?? null,
    p_address_line2: input.address_line2 ?? null,
    p_city: input.city ?? null,
    p_postal_code: input.postal_code ?? null,
    p_vat_id: input.vat_id ?? null,
    p_website: input.website ?? null,
  })
  if (error) return { ok: false, error: error.message }
  return (data || { ok: false, error: 'empty' }) as PartnerCompanyPayload
}

export const CONTACT_ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Sign in to update company details.',
  not_partner: 'Partner access is required.',
  company_not_found: 'Company profile was not found.',
  email_invalid: 'Enter a valid contact email.',
  website_invalid: 'Website must start with http:// or https://.',
}
