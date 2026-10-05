import { supabase } from './supabase'

/** Ordered list item stored in JSONB columns */
export type CmsListItem = {
  id: string
  text: string
  sort: number
}

export type CmsGalleryItem = {
  id: string
  url: string
  alt: string
  sort: number
  is_hero?: boolean
}

export type CmsFaqItem = {
  id: string
  question: string
  answer: string
  sort: number
}

/** Full commercial tour row used by Admin + public site */
export type TourCms = {
  id: number
  name: string
  public_name: string | null
  description: string | null
  adult_price: number
  child_price: number
  max_capacity: number
  is_active: boolean
  duration_text: string | null
  inclusions: string | null
  operational_notes: string | null
  platform_availability: string | null
  commission_percent: number | null
  tagline: string | null
  card_description: string | null
  full_description: string | null
  highlights: CmsListItem[]
  included_items: CmsListItem[]
  excluded_items: CmsListItem[]
  what_to_expect: string | null
  important_info: string | null
  know_before: string | null
  what_to_bring: string | null
  pickup_info: string | null
  cancellation_info: string | null
  guarantee_info: string | null
  reference_price: number | null
  sale_enabled: boolean
  sale_label: string | null
  sale_starts_at: string | null
  sale_ends_at: string | null
  badge: string | null
  group_size_text: string | null
  meeting_point: string | null
  seo_title: string | null
  seo_description: string | null
  seo_image: string | null
  hero_image_url: string | null
  gallery: CmsGalleryItem[]
  faq: CmsFaqItem[]
  cms_updated_at: string | null
}

export type DisplayPricing = {
  /** Charged / bookable adult price */
  current: number
  child: number
  /** Show sale UI */
  saleActive: boolean
  reference: number | null
  saveAmount: number
  label: string | null
}

function asList(raw: unknown): CmsListItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const text = String(o.text ?? '').trim()
      if (!text) return null
      return {
        id: String(o.id ?? `item-${i}`),
        text,
        sort: Number(o.sort ?? i) || 0,
      }
    })
    .filter((x): x is CmsListItem => Boolean(x))
    .sort((a, b) => a.sort - b.sort)
}

function asGallery(raw: unknown): CmsGalleryItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const url = String(o.url ?? '').trim()
      if (!url) return null
      return {
        id: String(o.id ?? `g-${i}`),
        url,
        alt: String(o.alt ?? 'Tour photo'),
        sort: Number(o.sort ?? i) || 0,
        is_hero: Boolean(o.is_hero),
      }
    })
    .filter((x): x is CmsGalleryItem => Boolean(x))
    .sort((a, b) => a.sort - b.sort)
}

function asFaq(raw: unknown): CmsFaqItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null
      const o = item as Record<string, unknown>
      const question = String(o.question ?? '').trim()
      const answer = String(o.answer ?? '').trim()
      if (!question || !answer) return null
      return {
        id: String(o.id ?? `f-${i}`),
        question,
        answer,
        sort: Number(o.sort ?? i) || 0,
      }
    })
    .filter((x): x is CmsFaqItem => Boolean(x))
    .sort((a, b) => a.sort - b.sort)
}

export function normalizeTourCms(row: Record<string, unknown>): TourCms {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    public_name: (row.public_name as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    adult_price: Number(row.adult_price) || 0,
    child_price: Number(row.child_price) || 0,
    max_capacity: Number(row.max_capacity) || 8,
    is_active: row.is_active !== false,
    duration_text: (row.duration_text as string | null) ?? null,
    inclusions: (row.inclusions as string | null) ?? null,
    operational_notes: (row.operational_notes as string | null) ?? null,
    platform_availability: (row.platform_availability as string | null) ?? null,
    commission_percent:
      row.commission_percent == null || row.commission_percent === ''
        ? null
        : Number(row.commission_percent),
    tagline: (row.tagline as string | null) ?? null,
    card_description: (row.card_description as string | null) ?? null,
    full_description: (row.full_description as string | null) ?? null,
    highlights: asList(row.highlights),
    included_items: asList(row.included_items),
    excluded_items: asList(row.excluded_items),
    what_to_expect: (row.what_to_expect as string | null) ?? null,
    important_info: (row.important_info as string | null) ?? null,
    know_before: (row.know_before as string | null) ?? null,
    what_to_bring: (row.what_to_bring as string | null) ?? null,
    pickup_info: (row.pickup_info as string | null) ?? null,
    cancellation_info: (row.cancellation_info as string | null) ?? null,
    guarantee_info: (row.guarantee_info as string | null) ?? null,
    reference_price:
      row.reference_price == null || row.reference_price === ''
        ? null
        : Number(row.reference_price),
    sale_enabled: Boolean(row.sale_enabled),
    sale_label: (row.sale_label as string | null) ?? null,
    sale_starts_at: (row.sale_starts_at as string | null) ?? null,
    sale_ends_at: (row.sale_ends_at as string | null) ?? null,
    badge: (row.badge as string | null) ?? null,
    group_size_text: (row.group_size_text as string | null) ?? null,
    meeting_point: (row.meeting_point as string | null) ?? null,
    seo_title: (row.seo_title as string | null) ?? null,
    seo_description: (row.seo_description as string | null) ?? null,
    seo_image: (row.seo_image as string | null) ?? null,
    hero_image_url: (row.hero_image_url as string | null) ?? null,
    gallery: asGallery(row.gallery),
    faq: asFaq(row.faq),
    cms_updated_at: (row.cms_updated_at as string | null) ?? null,
  }
}

/** Whether sale UI should show for a tour right now */
export function isTourSaleActive(tour: Pick<TourCms, 'sale_enabled' | 'sale_starts_at' | 'sale_ends_at' | 'reference_price' | 'adult_price'>, now = new Date()): boolean {
  if (!tour.sale_enabled) return false
  const ref = tour.reference_price
  if (ref == null || !(ref > tour.adult_price)) return false
  if (tour.sale_starts_at) {
    const start = new Date(tour.sale_starts_at)
    if (!Number.isNaN(start.getTime()) && now < start) return false
  }
  if (tour.sale_ends_at) {
    const end = new Date(tour.sale_ends_at)
    if (!Number.isNaN(end.getTime()) && now > end) return false
  }
  return true
}

export function getDisplayPricing(tour: TourCms, now = new Date()): DisplayPricing {
  const saleActive = isTourSaleActive(tour, now)
  const reference = saleActive ? Number(tour.reference_price) : null
  return {
    current: Number(tour.adult_price) || 0,
    child: Number(tour.child_price) || 0,
    saleActive,
    reference,
    saveAmount: reference != null ? Math.max(0, reference - Number(tour.adult_price)) : 0,
    label: saleActive ? tour.sale_label || 'Special offer' : null,
  }
}

export function displayName(tour: Pick<TourCms, 'public_name' | 'name'>): string {
  return (tour.public_name || tour.name || 'Tour').trim()
}

export function newCmsId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function reindexSort<T extends { sort: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, sort: i }))
}

/** Escape + light formatting: paragraphs, **bold**, lines starting with - or • as lists */
export function renderSafeRichText(input: string): string {
  const escaped = String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const blocks = escaped.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return blocks
    .map((block) => {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      const isList = lines.every((l) => /^[-•*]\s+/.test(l))
      const withBold = (s: string) =>
        s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      if (isList) {
        const items = lines
          .map((l) => l.replace(/^[-•*]\s+/, ''))
          .map((l) => `<li>${withBold(l)}</li>`)
          .join('')
        return `<ul class="rn-cms-list">${items}</ul>`
      }
      return `<p>${withBold(lines.join('<br />'))}</p>`
    })
    .join('')
}

export async function fetchTourCms(tourId: number): Promise<TourCms | null> {
  const { data, error } = await supabase.from('tours').select('*').eq('id', tourId).maybeSingle()
  if (error) {
    console.error('fetchTourCms:', error)
    throw new Error('Unable to load tour details. Please try again.')
  }
  if (!data) return null
  return normalizeTourCms(data as Record<string, unknown>)
}

export async function fetchAllTourCms(): Promise<TourCms[]> {
  const { data, error } = await supabase.from('tours').select('*').order('id')
  if (error) {
    console.error('fetchAllTourCms:', error)
    throw new Error('Unable to load tours. Please try again.')
  }
  return (data || []).map((row) => normalizeTourCms(row as Record<string, unknown>))
}

/** Public catalog cards — active tours with marketing fields */
export async function fetchPublicTourCards(): Promise<TourCms[]> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .neq('is_active', false)
    .order('id')
  if (error) {
    console.error('fetchPublicTourCards:', error)
    return []
  }
  return (data || []).map((row) => normalizeTourCms(row as Record<string, unknown>))
}
