import { supabase } from '../../lib/supabase'

export type PartnerTourCard = {
  tour_id: number
  title: string
  duration_text: string | null
  short_description: string | null
  hero_image_url: string | null
  seo_image: string | null
  gallery: Array<{ url?: string; alt?: string }> | null
  is_active: boolean
  availability_status: 'available' | 'unavailable' | string
  has_partner_price: boolean
  partner_net_eur: number | null
}

export type PartnerTourDetail = {
  id: number
  title: string
  duration_text: string | null
  tagline: string | null
  card_description: string | null
  full_description: string | null
  description: string | null
  highlights: Array<{ id?: string; text: string; sort?: number }>
  included_items: Array<{ id?: string; text: string; sort?: number }>
  excluded_items: Array<{ id?: string; text: string; sort?: number }>
  what_to_expect: string | null
  important_info: string | null
  pickup_info: string | null
  meeting_point: string | null
  group_size_text: string | null
  hero_image_url: string | null
  seo_image: string | null
  gallery: Array<{ url?: string; alt?: string; is_hero?: boolean }>
  is_active: boolean
  availability_status: string
}

export type PartnerTourPricing = {
  has_partner_price: boolean
  label: string
  partner_net_eur: number | null
  currency?: string
}

export function partnerTourImage(tour: {
  hero_image_url?: string | null
  seo_image?: string | null
  gallery?: Array<{ url?: string }> | null
}): string | null {
  if (tour.hero_image_url) return tour.hero_image_url
  if (tour.seo_image) return tour.seo_image
  const g = tour.gallery
  if (Array.isArray(g)) {
    const hit = g.find((x) => x?.url)
    if (hit?.url) return hit.url
  }
  return null
}

export function formatPartnerNet(eur: number | null | undefined): string {
  if (eur == null || Number.isNaN(Number(eur))) return ''
  return new Intl.NumberFormat('en-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(eur))
}

export async function fetchPartnerTourCatalog(): Promise<{
  ok: boolean
  error?: string
  tours: PartnerTourCard[]
}> {
  const { data, error } = await supabase.rpc('list_partner_tours')
  if (error) return { ok: false, error: error.message, tours: [] }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'failed'), tours: [] }
  return { ok: true, tours: (data.tours || []) as PartnerTourCard[] }
}

export async function fetchPartnerTourDetail(tourId: number): Promise<{
  ok: boolean
  error?: string
  tour?: PartnerTourDetail
  pricing?: PartnerTourPricing
  booking?: { enabled: boolean; message: string }
}> {
  const { data, error } = await supabase.rpc('get_partner_tour_detail', {
    p_tour_id: tourId,
  })
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: String(data?.error || 'failed') }
  return {
    ok: true,
    tour: data.tour as PartnerTourDetail,
    pricing: data.pricing as PartnerTourPricing,
    booking: data.booking as { enabled: boolean; message: string },
  }
}
