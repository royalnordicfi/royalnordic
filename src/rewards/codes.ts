/** Client-side mirrors of server validation for instant UX. Server is authoritative. */

const RESERVED_EXACT = new Set([
  'ADMIN',
  'ADMINS',
  'ROYAL',
  'ROYALNORDIC',
  'NORDIC',
  'RN',
  'STAFF',
  'SUPPORT',
  'HELP',
  'ROOT',
  'SYSTEM',
  'NULL',
  'UNDEFINED',
  'TEST',
  'TESTING',
  'DEMO',
  'FREE',
  'DISCOUNT',
  'OFFICIAL',
  'PARTNER',
  'AGENCY',
  'TRAVELTRADE',
  'FUCK',
  'SHIT',
  'CUNT',
  'NIGGER',
  'NIGGA',
  'FAGGOT',
  'HITLER',
  'NAZI',
  'PORN',
  'SEX',
  'XXX',
  'SLUT',
  'WHORE',
  'BITCH',
  'ASSHOLE',
  'DICK',
  'PISS',
  'COCK',
  'CUM',
  'RAPE',
  'KILL',
  'SUICIDE',
])

export function normalizeReferralCode(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export function isReservedReferralCode(normalized: string): boolean {
  if (!normalized || normalized.length < 4) return true
  if (RESERVED_EXACT.has(normalized)) return true
  if (normalized.startsWith('RN') || normalized.startsWith('ADMIN') || normalized.startsWith('ROYAL')) {
    return true
  }
  return false
}

export type CodeValidation =
  | { valid: true; normalized: string }
  | { valid: false; normalized: string; reason: 'empty' | 'too_short' | 'too_long' | 'reserved' | 'invalid_chars' }

export function validateReferralCodeInput(raw: string): CodeValidation {
  const stripped = raw.replace(/[^A-Za-z0-9]/g, '')
  const normalized = stripped.toUpperCase()

  if (!raw.trim()) {
    return { valid: false, normalized, reason: 'empty' }
  }
  if (stripped.length !== raw.replace(/\s/g, '').length && /[^A-Za-z0-9\s-]/.test(raw)) {
    // allow spaces/hyphens in input; other symbols invalid
  }
  if (/[^A-Za-z0-9\s-]/.test(raw)) {
    return { valid: false, normalized, reason: 'invalid_chars' }
  }
  if (normalized.length < 4) {
    return { valid: false, normalized, reason: 'too_short' }
  }
  if (normalized.length > 20) {
    return { valid: false, normalized, reason: 'too_long' }
  }
  if (isReservedReferralCode(normalized)) {
    return { valid: false, normalized, reason: 'reserved' }
  }
  return { valid: true, normalized }
}

export function codeValidationMessage(result: CodeValidation): string | null {
  if (result.valid) return null
  switch (result.reason) {
    case 'empty':
      return 'Enter a code to continue.'
    case 'too_short':
      return 'Use at least 4 letters or numbers.'
    case 'too_long':
      return 'Keep it to 20 characters or fewer.'
    case 'reserved':
      return 'That code is reserved. Try another.'
    case 'invalid_chars':
      return 'Letters and numbers only.'
    default:
      return 'Invalid code.'
  }
}

export function referralLinkForCode(code: string, origin = typeof window !== 'undefined' ? window.location.origin : 'https://royalnordic.fi'): string {
  const normalized = normalizeReferralCode(code)
  return `${origin}/?ref=${encodeURIComponent(normalized)}`
}

export function claimErrorMessage(error: string): string {
  switch (error) {
    case 'not_authenticated':
      return 'Please sign in again.'
    case 'already_has_code':
      return 'You already have an active referral code.'
    case 'invalid_format':
      return 'Use 4–20 letters or numbers.'
    case 'reserved':
      return 'That code is reserved. Try another.'
    case 'taken':
      return 'That code is already taken.'
    default:
      return 'Could not claim this code. Try again.'
  }
}
