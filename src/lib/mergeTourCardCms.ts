import { displayName, getDisplayPricing, type TourCms } from './tourCms'

export type CatalogCardBase = {
  tourId: number | null
  to: string
  image: string
  imageAlt: string
  title: string
  description: string
  duration: string
  groupSize: string
  pickup: boolean
  badge?: string
  priceFrom?: number
  referencePrice?: number
  imagePosition?: string
}

/** Overlay Admin CMS fields onto a static catalog card (keeps route/layout defaults). */
export function mergeTourCardCms<T extends CatalogCardBase>(
  card: T,
  cmsById: Map<number, TourCms>,
): T {
  if (card.tourId == null) return card
  const cms = cmsById.get(card.tourId)
  if (!cms) return card
  const pricing = getDisplayPricing(cms)
  return {
    ...card,
    title: displayName(cms) || card.title,
    description: (cms.card_description || '').trim() || card.description,
    duration: (cms.duration_text || '').trim() || card.duration,
    groupSize: (cms.group_size_text || '').trim() || card.groupSize,
    badge: (cms.badge || '').trim() || card.badge,
    image: cms.hero_image_url || cms.gallery?.[0]?.url || card.image,
    priceFrom: pricing.current,
    referencePrice: pricing.saleActive ? pricing.reference ?? undefined : undefined,
  }
}

export function tourCmsMap(cards: TourCms[]): Map<number, TourCms> {
  return new Map(cards.map((c) => [c.id, c]))
}
