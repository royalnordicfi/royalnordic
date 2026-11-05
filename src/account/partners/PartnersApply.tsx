import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthFormShell, { FieldLabel, FormError, FormSuccess } from '../../rewards/components/AuthFormShell'
import { useRewardsAuth } from '../../rewards/RewardsAuthContext'
import { supabase } from '../../lib/supabase'
import { getPartnerAccess } from '../partnerAccess'

export default function PartnersApply() {
  const { isSignedIn, loading, user } = useRewardsAuth()
  const navigate = useNavigate()
  const access = getPartnerAccess(user)

  const [company, setCompany] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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
      const workEmail = (email || user?.email || '').trim().toLowerCase()
      if (!workEmail) {
        throw new Error('Please enter a work email.')
      }
      if (!company.trim()) {
        throw new Error('Please enter your company name.')
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-customized-tour-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'partner',
            name: contactName.trim() || 'Partner applicant',
            email: workEmail,
            phone: phone.trim(),
            message: [
              'PARTNER_APPLICATION',
              `Company: ${company.trim()}`,
              message.trim() || 'No additional notes',
              isSignedIn && user?.id ? `Auth user: ${user.id}` : 'Guest application (not signed in)',
            ].join('\n\n'),
            to: ['royalnordicfi@gmail.com', 'contact@royalnordic.fi'],
            subject: 'Travel Trade Partnership Enquiry - ROYAL NORDIC',
          }),
        },
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not send application. Please try again.')
      }

      // Display-only marker. Never writes app_metadata / partner approval.
      if (isSignedIn) {
        await supabase.auth.updateUser({
          data: {
            partner_application_submitted: true,
            partner_application_submitted_at: new Date().toISOString(),
            partner_application_company: company.trim(),
          },
        })
        setSuccess('Application received. You can track status on the next screen.')
        navigate('/partners/status', { replace: true })
        return
      }

      setSuccess(
        'Application received. Create or sign in to a Royal Nordic account to track status — this does not approve partnership.',
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
        subtitle="Tell us about your agency or company. Applications are reviewed by our team — choosing Partners never unlocks pricing by itself."
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
            <FieldLabel htmlFor="partner-company">Company</FieldLabel>
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
            <FieldLabel htmlFor="partner-name">Contact name</FieldLabel>
            <input
              id="partner-name"
              className="rn-form-input"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-email">Work email</FieldLabel>
            <input
              id="partner-email"
              type="email"
              required
              className="rn-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email || ''}
              autoComplete="email"
            />
          </div>
          <div>
            <FieldLabel htmlFor="partner-phone">Phone</FieldLabel>
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
            <FieldLabel htmlFor="partner-message">How can we work together?</FieldLabel>
            <textarea
              id="partner-message"
              className="rn-form-input min-h-[110px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Markets you serve, expected volume, products of interest…"
            />
          </div>
          {!isSignedIn && !loading ? (
            <p className="text-xs leading-relaxed text-[var(--rn-text-dim)]">
              Tip:{' '}
              <Link to="/account/signin?intent=partners" className="text-aurora-soft underline-offset-2 hover:underline">
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
