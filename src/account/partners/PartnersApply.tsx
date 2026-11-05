import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError, FormSuccess } from '../../rewards/components/AuthFormShell'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { supabase } from '../../lib/supabase'
import {
  PARTNER_BUSINESS_TYPES,
  fetchPartnerAccess,
  type PartnerAccess,
} from '../partnerAccess'

const ERROR_COPY: Record<string, string> = {
  company_name_required: 'Enter your company name.',
  business_id_required: 'Enter a business ID / registration number.',
  country_required: 'Enter the country.',
  business_type_invalid: 'Select a valid business type.',
  contact_name_required: 'Enter a contact name.',
  email_invalid: 'Enter a valid business email.',
  description_required: 'Add a short business description (at least a sentence).',
  website_invalid: 'Website must start with http:// or https://.',
  duplicate_pending: 'A pending application already exists for this email.',
  already_partner: 'This account is already an approved partner.',
}

export default function PartnersApply() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const navigate = useNavigate()
  const [access, setAccess] = useState<PartnerAccess | null>(null)

  const [company, setCompany] = useState('')
  const [businessId, setBusinessId] = useState('')
  const [country, setCountry] = useState('')
  const [businessType, setBusinessType] = useState('travel_agency')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isSignedIn) {
      setAccess('none')
      return
    }
    void fetchPartnerAccess().then((r) => setAccess(r.access))
  }, [loading, isSignedIn, user?.id])

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user, email])

  if (!loading && access === 'approved') {
    return <Navigate to="/partners/dashboard" replace />
  }
  if (!loading && access === 'pending') {
    return <Navigate to="/partners/status" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-partner-application`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            company_name: company,
            business_id: businessId,
            country,
            business_type: businessType,
            contact_name: contactName,
            business_email: email,
            phone,
            website: website || null,
            description,
            // Intentionally omit status / partner_status — server rejects client roles.
          }),
        },
      )
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.error) {
        const code = String(body.error || 'submit_failed')
        throw new Error(ERROR_COPY[code] || code)
      }

      if (isSignedIn) {
        setSuccess('Application received. Tracking status…')
        navigate('/partners/status', { replace: true })
        return
      }

      setSuccess(
        'Application received. Sign in with this business email to track status — submitting never approves partnership.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send application.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rn-container py-12 sm:py-16">
      <AuthFormShell
        eyebrow="Royal Nordic Partners"
        title="Partner application"
        subtitle="Apply for travel-trade partnership. Applications are reviewed by Royal Nordic — this form cannot grant partner pricing or roles."
        backTo={{ href: '/account', label: '← Back to account' }}
        footer={
          <>
            Already applied?{' '}
            <Link
              to="/account/signin?intent=partners"
              className="text-aurora-soft underline-offset-2 hover:underline"
            >
              Sign in for status
            </Link>
            {' · '}
            <Link to="/travel-trade" className="text-aurora-soft underline-offset-2 hover:underline">
              Travel trade overview
            </Link>
          </>
        }
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={error} />
          <FormSuccess message={success} />
          <div>
            <FieldLabel htmlFor="partner-company">Company name</FieldLabel>
            <input
              id="partner-company"
              required
              className="rn-form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-business-id">Business ID / registration</FieldLabel>
            <input
              id="partner-business-id"
              required
              className="rn-form-input"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="partner-country">Country</FieldLabel>
              <input
                id="partner-country"
                required
                className="rn-form-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
              />
            </div>
            <div>
              <FieldLabel htmlFor="partner-type">Business type</FieldLabel>
              <select
                id="partner-type"
                required
                className="rn-form-input"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              >
                {PARTNER_BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="partner-name">Contact name</FieldLabel>
            <input
              id="partner-name"
              required
              className="rn-form-input"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-email">Business email</FieldLabel>
            <input
              id="partner-email"
              type="email"
              required
              className="rn-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-phone">Phone (optional)</FieldLabel>
            <input
              id="partner-phone"
              type="tel"
              className="rn-form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-website">Website (optional)</FieldLabel>
            <input
              id="partner-website"
              type="url"
              className="rn-form-input"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              autoComplete="url"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-description">Short business description</FieldLabel>
            <textarea
              id="partner-description"
              required
              className="rn-form-input min-h-[110px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Markets you serve, expected volume, products of interest…"
            />
          </div>
          {!isSignedIn && !loading ? (
            <p className="text-xs leading-relaxed text-[var(--rn-text-dim)]">
              Tip:{' '}
              <Link
                to="/account/signin?intent=partners"
                className="text-aurora-soft underline-offset-2 hover:underline"
              >
                sign in
              </Link>{' '}
              first if you already have a Rewards account — same login, separate partner review.
            </p>
          ) : null}
          <button type="submit" className="rn-btn-primary w-full min-h-[44px]" disabled={submitting}>
            {submitting ? 'Sending…' : 'Submit application'}
          </button>
        </form>
      </AuthFormShell>
    </div>
  )
}
