import {
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_STORAGE_KEY,
  REFERRAL_STORAGE_TS_KEY,
} from '../config/rewardsBooking'
import { normalizeReferralCode } from './codes'

/**
 * Consent-compliant first-party referral persistence.
 * Stores only the normalized code (no PII). Used for booking attribution UX.
 * Does not set third-party cookies or share with advertisers.
 */

export function captureReferralFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  const raw = params.get('ref') || params.get('referral') || ''
  const code = normalizeReferralCode(raw)
  if (!code || code.length < 4) return null
  persistReferralCode(code)
  return code
}

export function persistReferralCode(code: string): void {
  const normalized = normalizeReferralCode(code)
  if (!normalized) return
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, normalized)
    localStorage.setItem(REFERRAL_STORAGE_TS_KEY, String(Date.now()))
  } catch {
    try {
      sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalized)
    } catch {
      /* ignore */
    }
  }
}

export function readPersistedReferralCode(
  now: Date = new Date(),
  maxAgeDays: number = REFERRAL_ATTRIBUTION_DAYS,
): string | null {
  try {
    const code = localStorage.getItem(REFERRAL_STORAGE_KEY) || sessionStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!code) return null
    const tsRaw = localStorage.getItem(REFERRAL_STORAGE_TS_KEY)
    if (tsRaw) {
      const ts = Number(tsRaw)
      if (Number.isFinite(ts)) {
        const ageMs = now.getTime() - ts
        if (ageMs > maxAgeDays * 24 * 60 * 60 * 1000) {
          clearPersistedReferralCode()
          return null
        }
      }
    }
    const normalized = normalizeReferralCode(code)
    return normalized || null
  } catch {
    return null
  }
}

export function clearPersistedReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
    localStorage.removeItem(REFERRAL_STORAGE_TS_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
