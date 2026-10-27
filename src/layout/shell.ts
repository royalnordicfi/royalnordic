/**
 * Global page-shell contract.
 * One geometry owns promo + header clearance for every public route.
 * Never patch individual pages with ad-hoc padding-top.
 *
 * overlay — cinematic routes; header floats over imagery; hero pads itself
 * product — experience / booking pages; content starts below chrome + breath
 * standard — editorial / form / legal / utility; content starts below chrome
 */
export type ShellMode = 'overlay' | 'product' | 'standard' | 'checkout'

/** Only intentional cinematic / category heroes may overlay photography. */
const OVERLAY_EXACT = new Set([
  '/',
  '/northern-lights-tours',
  '/daytime-experiences',
  '/renting-equipment',
  '/transportation',
  '/travel-trade',
  '/reindeer-rides',
])

const PRODUCT_EXACT = new Set([
  '/northern-lights-tour',
  '/family-friendly-northern-lights',
  '/northern-lights-standard-group',
  '/northern-lights-private-tour',
  '/ice-fishing',
  '/ranua-zoo',
  '/korouoma-canyon',
  '/snowshoe-rental',
  '/snowmobile-safari',
  '/monster-truck-northern-lights',
  '/customized-tour',
  '/transportation-rovaniemi-levi',
  '/transportation-rovaniemi-saariselka',
  '/transportation-customized',
])

/** Logo-only chrome — no promo bar, main nav, or floating widgets. */
export function isMinimalChromePath(pathname: string): boolean {
  return (
    pathname === '/checkout' ||
    pathname.startsWith('/payment-') ||
    pathname.startsWith('/crypto-payment')
  )
}

export function resolveShellMode(pathname: string): ShellMode {
  if (pathname === '/checkout') return 'checkout'
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
