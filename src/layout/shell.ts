/**
 * Global page-shell contract.
 * One geometry owns promo + header clearance for every public route.
 * Never patch individual pages with ad-hoc padding-top.
 *
 * overlay — cinematic routes; header floats over imagery; hero pads itself
 * product — experience / booking pages; content starts below chrome + breath
 * standard — editorial / form / legal / utility; content starts below chrome
 */
export type ShellMode = 'overlay' | 'product' | 'standard'

/** Only intentional cinematic / category heroes may overlay photography. */
const OVERLAY_EXACT = new Set([
  '/',
  '/northern-lights-tours',
  '/daytime-experiences',
  '/renting-equipment',
  '/transportation',
  '/blog',
  '/travel-trade',
])

const PRODUCT_EXACT = new Set([
  '/northern-lights-tour',
  '/family-friendly-northern-lights',
  '/ice-fishing',
  '/ranua-zoo',
  '/korouoma-canyon',
  '/snowshoe-rental',
  '/snowmobile-safari',
  '/monster-truck-northern-lights',
  '/customized-tour',
  '/transportation-rovaniemi-levi',
  '/transportation-customized',
])

export function resolveShellMode(pathname: string): ShellMode {
  if (OVERLAY_EXACT.has(pathname)) return 'overlay'
  if (PRODUCT_EXACT.has(pathname)) return 'product'
  if (pathname.startsWith('/blog/')) return 'standard'
  return 'standard'
}

/** @deprecated use resolveShellMode === 'overlay' */
export function isHeroShell(pathname: string): boolean {
  return resolveShellMode(pathname) === 'overlay'
}

/** Alias kept for Header / CSS mental model */
export function isOverlayShell(pathname: string): boolean {
  return resolveShellMode(pathname) === 'overlay'
}
