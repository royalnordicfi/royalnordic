/**
 * Global page-shell contract.
 * Every public route resolves to one of these modes so header geometry
 * is structural — never patched per-page with ad-hoc padding.
 *
 * hero     — cinematic full-bleed hero; header overlays; hero pads itself
 * product  — experience / booking pages; content starts below chrome
 * standard — editorial / form / legal; content starts below chrome
 */
export type ShellMode = 'hero' | 'product' | 'standard'

const HERO_EXACT = new Set([
  '/',
  '/northern-lights-tours',
  '/daytime-experiences',
  '/renting-equipment',
  '/transportation',
  '/blog',
  '/travel-trade',
  '/privacy-policy',
  '/terms-conditions',
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
  if (HERO_EXACT.has(pathname)) return 'hero'
  if (PRODUCT_EXACT.has(pathname)) return 'product'
  if (pathname.startsWith('/blog/')) return 'standard'
  return 'standard'
}

export function isHeroShell(pathname: string): boolean {
  return resolveShellMode(pathname) === 'hero'
}
