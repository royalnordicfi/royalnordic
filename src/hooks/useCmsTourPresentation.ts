import { useEffect, useMemo } from 'react'
import { useTourCms } from './useTourCms'
import {
  displayName,
  getDisplayPricing,
  type DisplayPricing,
  type TourCms,
} from '../lib/tourCms'

export type TourPageFallback = {
  title: string
  lede: string
  eyebrow?: string
  adultPrice: number
  childPrice: number
  maxCapacity: number
  duration?: string
  groupSize?: string
  pickupFact?: string
  benefits?: string[]
  included?: string[]
  excluded?: string[]
  gallery?: { src: string; alt: string }[]
  faqs?: { question: string; answer: string }[]
  description?: string
  whatToBring?: string
  knowBefore?: string
  guaranteeFact?: string
}

/**
 * Merge Admin CMS tour row with page fallbacks.
 * Empty CMS fields keep the page’s designed defaults so undeployed CMS content never blanks the site.
 * Pass a module-level `fallback` constant (stable reference).
 */
export function useCmsTourPresentation(tourId: number, fallback: TourPageFallback) {
  const { tour, loading, error } = useTourCms(tourId)

  const presentation = useMemo(() => {
    const pricing: DisplayPricing = tour
      ? getDisplayPricing(tour)
      : {
          current: fallback.adultPrice,
          child: fallback.childPrice,
          saleActive: false,
          reference: null,
          saveAmount: 0,
          label: null,
        }

    const title = tour ? displayName(tour) : fallback.title
    const lede = (tour?.tagline || '').trim() || fallback.lede
    const benefits =
      tour && tour.highlights.length > 0
        ? tour.highlights.map((h) => h.text)
        : fallback.benefits || []
    const included =
      tour && tour.included_items.length > 0
        ? tour.included_items.map((i) => i.text)
        : fallback.included || []
    const excluded =
      tour && tour.excluded_items.length > 0
        ? tour.excluded_items.map((i) => i.text)
        : fallback.excluded || []
    const gallery =
      tour && tour.gallery.length > 0
        ? tour.gallery.map((g) => ({ src: g.url, alt: g.alt }))
        : fallback.gallery || []
    const faqs =
      tour && tour.faq.length > 0
        ? tour.faq.map((f) => ({ question: f.question, answer: f.answer }))
        : fallback.faqs || []

    return {
      tour: tour as TourCms | null,
      title,
      lede,
      cardDescription: (tour?.card_description || '').trim(),
      fullDescription: (tour?.full_description || '').trim() || fallback.description || '',
      benefits,
      included,
      excluded,
      gallery,
      faqs,
      pricing,
      adultPrice: tour?.adult_price ?? fallback.adultPrice,
      childPrice: tour?.child_price ?? fallback.childPrice,
      maxCapacity: tour?.max_capacity ?? fallback.maxCapacity,
      duration: (tour?.duration_text || '').trim() || fallback.duration || '',
      groupSize: (tour?.group_size_text || '').trim() || fallback.groupSize || '',
      pickupFact: (tour?.meeting_point || '').trim() || fallback.pickupFact || 'Rovaniemi',
      pickupInfo: (tour?.pickup_info || '').trim(),
      whatToBring: (tour?.what_to_bring || '').trim() || fallback.whatToBring || '',
      knowBefore: (tour?.know_before || '').trim() || fallback.knowBefore || '',
      importantInfo: (tour?.important_info || '').trim(),
      cancellationInfo: (tour?.cancellation_info || '').trim(),
      guaranteeInfo: (tour?.guarantee_info || '').trim(),
      whatToExpect: (tour?.what_to_expect || '').trim(),
      badge: (tour?.badge || '').trim(),
      heroImage: tour?.hero_image_url || tour?.gallery?.[0]?.url || gallery[0]?.src || '',
      bookingTourName: tour?.name || fallback.title,
    }
  }, [tour, fallback])

  useEffect(() => {
    if (!tour?.seo_title && !tour?.seo_description) return
    if (tour.seo_title) document.title = tour.seo_title
    const desc = document.querySelector('meta[name="description"]')
    if (desc && tour.seo_description) desc.setAttribute('content', tour.seo_description)
  }, [tour])

  return { ...presentation, loading, error }
}
