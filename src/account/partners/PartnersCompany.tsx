import { useEffect, useState, type FormEvent } from 'react'
import { FieldLabel, FormError, FormSuccess } from '../../rewards/components/AuthFormShell'
import {
  CONTACT_ERROR_COPY,
  businessTypeLabel,
  fetchMyPartnerCompany,
  updateMyPartnerCompanyContact,
  type PartnerCompany,
} from './partnerCompany'

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rn-text-dim)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-white/90">{value || '—'}</p>
    </div>
  )
}

export default function PartnersCompany() {
  const [company, setCompany] = useState<PartnerCompany | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [vatId, setVatId] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [city, setCity] = useState('')
  const [postal, setPostal] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await fetchMyPartnerCompany()
      if (cancelled) return
      if (!res.ok || !res.company) {
        setError(CONTACT_ERROR_COPY[res.error || ''] || res.error || 'Could not load company.')
        setLoading(false)
        return
      }
      const c = res.company
      setCompany(c)
      setContactName(c.contact_name || '')
      setContactEmail(c.contact_email || '')
      setContactPhone(c.contact_phone || '')
      setVatId(c.vat_id || '')
      setAddress1(c.address_line1 || '')
      setAddress2(c.address_line2 || '')
      setCity(c.city || '')
      setPostal(c.postal_code || '')
      setWebsite(c.website || '')
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const res = await updateMyPartnerCompanyContact({
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        vat_id: vatId,
        address_line1: address1,
        address_line2: address2,
        city,
        postal_code: postal,
        website: website || null,
      })
      if (!res.ok || !res.company) {
        throw new Error(CONTACT_ERROR_COPY[res.error || ''] || res.error || 'Save failed')
      }
      setCompany(res.company)
      setSuccess('Company contact details saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rn-rewards-skel h-7 w-40" />
        <div className="rn-rewards-skel h-48 w-full max-w-2xl" />
      </div>
    )
  }

  if (!company) {
    return (
      <p role="alert" className="text-sm text-red-200">
        {error || 'Company profile unavailable.'}
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-white">Company</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--rn-text-muted)]">
          Legal company identity is controlled by Royal Nordic. You can update contact and address
          details for your partnership.
        </p>
      </div>

      <section className="rounded-[var(--rn-radius)] border border-[var(--rn-border)] bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--rn-text-dim)]">
          Registered identity
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Company name" value={company.name} />
          <ReadOnlyField label="Business ID" value={company.business_id || ''} />
          <ReadOnlyField label="Country" value={company.country} />
          <ReadOnlyField label="Business type" value={businessTypeLabel(company.business_type)} />
        </div>
        <p className="mt-4 text-xs text-[var(--rn-text-dim)]">
          To change company name, business ID, country, or type, contact Royal Nordic.
        </p>
      </section>

      <form onSubmit={onSave} className="rn-rewards-auth space-y-4" noValidate>
        <FormError message={error} />
        <FormSuccess message={success} />

        <div>
          <FieldLabel htmlFor="pc-contact-name">Contact person</FieldLabel>
          <input
            id="pc-contact-name"
            className="rn-form-input"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pc-contact-email">Contact email</FieldLabel>
            <input
              id="pc-contact-email"
              type="email"
              className="rn-form-input"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <FieldLabel htmlFor="pc-contact-phone">Phone</FieldLabel>
            <input
              id="pc-contact-phone"
              type="tel"
              className="rn-form-input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="pc-vat">VAT ID</FieldLabel>
          <input
            id="pc-vat"
            className="rn-form-input"
            value={vatId}
            onChange={(e) => setVatId(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="pc-address1">Address</FieldLabel>
          <input
            id="pc-address1"
            className="rn-form-input"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
            autoComplete="address-line1"
          />
        </div>
        <div>
          <FieldLabel htmlFor="pc-address2">Address line 2</FieldLabel>
          <input
            id="pc-address2"
            className="rn-form-input"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
            autoComplete="address-line2"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="pc-city">City</FieldLabel>
            <input
              id="pc-city"
              className="rn-form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level1"
            />
          </div>
          <div>
            <FieldLabel htmlFor="pc-postal">Postal code</FieldLabel>
            <input
              id="pc-postal"
              className="rn-form-input"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="pc-website">Website</FieldLabel>
          <input
            id="pc-website"
            type="url"
            className="rn-form-input"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            autoComplete="url"
          />
        </div>

        <button type="submit" className="rn-btn-primary min-h-[44px] w-full sm:w-auto" disabled={saving}>
          {saving ? 'Saving…' : 'Save contact details'}
        </button>
      </form>
    </div>
  )
}
