import { supabase } from './supabase'

/**
 * Flip these to re-enable partner / seasonal products without deleting pages.
 */
export const SHOW_MONSTER_TRUCK_NORTHERN_LIGHTS = false

/** Calendar / DB tour id → public marketing page */
export const TOUR_PUBLIC_PAGES: Record<
  number,
  { path: string; fallbackPath: string; label: string }
> = {
  1: {
    path: '/northern-lights-tour',
    fallbackPath: '/northern-lights-tours',
    label: 'Guaranteed Northern Lights Tour',
  },
  2: {
    path: '/snowshoe-rental',
    fallbackPath: '/renting-equipment',
    label: 'Snowshoe Adventure',
  },
  4: {
    path: '/ice-fishing',
    fallbackPath: '/daytime-experiences',
    label: 'Ice Fishing Experience',
  },
  5: {
    path: '/ranua-zoo',
    fallbackPath: '/daytime-experiences',
    label: 'Nordic Animals of Ranua Zoo',
  },
  6: {
    path: '/korouoma-canyon',
    fallbackPath: '/daytime-experiences',
    label: 'Korouoma Canyon Winter Adventure',
  },
  8: {
    path: '/family-friendly-northern-lights',
    fallbackPath: '/northern-lights-tours',
    label: 'Family-Friendly Northern Lights Tour',
  },
}

export function tourIdForPublicPath(pathname: string): number | null {
  const entry = Object.entries(TOUR_PUBLIC_PAGES).find(([, v]) => v.path === pathname)
  return entry ? Number(entry[0]) : null
}

/** Active bookable tours visible on the public site (is_active !== false). */
export async function fetchActiveTourIds(): Promise<Set<number>> {
  const { data, error } = await supabase.from('tours').select('id, is_active')
  if (error) {
    console.error('fetchActiveTourIds:', error)
    // Fail open for transient errors so the site does not blank all products
    return new Set(Object.keys(TOUR_PUBLIC_PAGES).map(Number))
  }
  return new Set(
    (data || [])
      .filter((t: { is_active?: boolean | null }) => t.is_active !== false)
      .map((t: { id: number }) => t.id),
  )
}

export async function isTourPubliclyActive(tourId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from('tours')
    .select('is_active')
    .eq('id', tourId)
    .maybeSingle()
  if (error || !data) return false
  return data.is_active !== false
}
