/**
 * Shared public navigation destinations.
 * Header (desktop + mobile) and SiteChrome consume this — keep routes here, not duplicated in pages.
 */

export type NavChild = {
  label: string
  to: string
  hint: string
}

export type NavItem = {
  label: string
  to: string
}

/** Experiences mega-menu / mobile experience list */
export const EXPERIENCE_NAV: NavChild[] = [
  { label: 'Northern Lights', to: '/northern-lights-tours', hint: 'Aurora hunts & pro photos' },
  { label: 'Day Tours', to: '/daytime-experiences', hint: 'Arctic daytime experiences' },
  { label: 'Private & Custom', to: '/customized-tour', hint: 'Tailored Lapland itineraries' },
  { label: 'Transfers', to: '/transportation', hint: 'Saariselkä, Levi & custom routes' },
]

/** Primary desktop links after Experiences mega — avoid duplicating EXPERIENCE_NAV destinations */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Partner With Us', to: '/travel-trade' },
  { label: 'Contact', to: '/contact' },
]

/** Extra mobile entries after experiences */
export const MOBILE_EXTRA_NAV: NavChild[] = [
  { label: 'Partner With Us', to: '/travel-trade', hint: 'Travel trade & partnerships' },
  { label: 'Contact', to: '/contact', hint: 'Phone, email & enquiry form' },
]

/** Primary conversion destination for header CTA */
export const HEADER_BOOK_CTA = {
  label: 'Book a tour',
  to: '/northern-lights-tour',
} as const
