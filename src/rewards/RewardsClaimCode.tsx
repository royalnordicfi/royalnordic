import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import RewardsProtected from './RewardsProtected'
import { useRewardsAuth } from './RewardsAuthContext'
import { checkCodeAvailable, claimReferralCode, fetchActiveCode } from './api'
import {
  claimErrorMessage,
  codeValidationMessage,
  normalizeReferralCode,
  validateReferralCodeInput,
} from './codes'
import { FieldLabel, FormError, FormSuccess } from './components/AuthFormShell'

function ClaimCodeInner() {
  const { user } = useRewardsAuth()
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle')
  const [availabilityHint, setAvailabilityHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [hasCode, setHasCode] = useState(false)

  useEffect(() => {
    let alive = true
    if (!user) return
    fetchActiveCode(user.id)
      .then((code) => {
        if (!alive) return
        if (code) {
          setHasCode(true)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoadingExisting(false)
      })
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    const validation = validateReferralCodeInput(input)
    if (!validation.valid) {
      setAvailability('idle')
      setAvailabilityHint(input.trim() ? codeValidationMessage(validation) : null)
      return
    }

    setAvailability('checking')
    setAvailabilityHint('Checking availability…')
    const handle = window.setTimeout(() => {
      checkCodeAvailable(validation.normalized)
        .then((res) => {
          if (res.available) {
            setAvailability('available')
            setAvailabilityHint(`${res.normalized} is available`)
          } else {
            setAvailability('unavailable')
            setAvailabilityHint(claimErrorMessage(res.error || 'taken'))
          }
        })
        .catch(() => {
          setAvailability('idle')
          setAvailabilityHint('Could not check availability right now.')
        })
    }, 350)

    return () => window.clearTimeout(handle)
  }, [input])

  if (loadingExisting) {
    return (
      <div className="rn-container py-12 sm:py-16" aria-busy="true">
        <div className="mx-auto max-w-md space-y-4">
          <div className="rn-rewards-skel h-8 w-56" />
          <div className="rn-rewards-skel h-12 w-full" />
          <div className="rn-rewards-skel h-12 w-full" />
        </div>
      </div>
    )
  }

  if (hasCode) {
    return <Navigate to="/referralprogram/dashboard" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validation = validateReferralCodeInput(input)
    if (!validation.valid) {
      setError(codeValidationMessage(validation))
      return
    }

    setSubmitting(true)
    try {
      const result = await claimReferralCode(validation.normalized)
      if (!result.ok) {
        setError(claimErrorMessage(result.error))
        if (result.error === 'already_has_code') {
          navigate('/referralprogram/dashboard', { replace: true })
        }
        return
      }
      setSuccess(`${result.code} is yours.`)
      window.setTimeout(() => navigate('/referralprogram/dashboard', { replace: true }), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim code')
    } finally {
      setSubmitting(false)
    }
  }

  const preview = normalizeReferralCode(input)

  return (
    <div className="rn-container py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <p className="rn-eyebrow text-aurora-soft">Your code</p>
        <h1 className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2rem]">
          Choose a referral code
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Pick something memorable — letters and numbers only. One active code per account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <FormError message={error} />
          <FormSuccess message={success} />
          <div>
            <FieldLabel htmlFor="claim-code">Referral code</FieldLabel>
            <input
              id="claim-code"
              className="rn-form-input font-mono uppercase tracking-wider"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ALEX10"
              autoComplete="off"
              spellCheck={false}
              maxLength={24}
              aria-describedby="claim-hint"
              aria-invalid={availability === 'unavailable' ? true : undefined}
            />
            <p
              id="claim-hint"
              className={`mt-2 text-xs ${
                availability === 'available'
                  ? 'text-aurora-soft'
                  : availability === 'unavailable'
                    ? 'text-red-300'
                    : 'text-[var(--rn-text-dim)]'
              }`}
            >
              {availabilityHint ||
                (preview ? `Will be saved as ${preview}` : 'Examples: ALEX10, LAPLANDMIKE, AURORA2026')}
            </p>
          </div>
          <button
            type="submit"
            className="rn-btn-primary w-full"
            disabled={submitting || availability === 'unavailable' || availability === 'checking'}
          >
            {submitting ? 'Claiming…' : 'Claim code'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function RewardsClaimCode() {
  return (
    <RewardsProtected>
      <ClaimCodeInner />
    </RewardsProtected>
  )
}
