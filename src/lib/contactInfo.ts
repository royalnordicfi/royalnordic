/** Verified Royal Nordic public contact details — single source of truth. */
export const CONTACT = {
  email: 'contact@royalnordic.fi',
  phoneDisplay: '+358 45 78345138',
  phoneHref: 'tel:+3584578345138',
  emailHref: 'mailto:contact@royalnordic.fi',
  location: 'Rovaniemi, Finnish Lapland',
  whatsappUrl: 'https://wa.me/message/32DREESZC5QUB1',
} as const

export const CONTACT_TOPICS = [
  { value: 'general', label: 'General question' },
  { value: 'booking', label: 'Existing booking' },
  { value: 'private', label: 'Private / custom tour' },
  { value: 'partner', label: 'Travel trade / partnership' },
] as const

export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value']

export function contactTopicLabel(value: string): string {
  return CONTACT_TOPICS.find((t) => t.value === value)?.label ?? value
}
