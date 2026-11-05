import React, { useEffect, useMemo, useState } from 'react'
import {
  fetchPartnerCompaniesList,
  fetchPartnerPriceAudit,
  fetchPartnerTourPricesAdmin,
  fetchProducts,
  resolvePartnerNetPreview,
  upsertPartnerTourPriceAdmin,
  type PartnerPriceAuditRow,
  type PartnerTourPriceRow,
} from '../adminApi'
import { Badge } from '../components/Badge'
import { Card, ErrorBanner, Field, inputClass, selectClass } from '../components/ui'

type TourLite = {
  id: number
  name: string
  public_name?: string | null
  adult_price: number
  is_active?: boolean | null
  badge?: string | null
}

function tourTitle(t: TourLite) {
  return (t.public_name || t.name || `Tour ${t.id}`).trim()
}

function isInternal(t: TourLite) {
  return (
    String(t.badge || '') === 'INTERNAL_CERT' ||
    String(t.name || '').toUpperCase().startsWith('INTERNAL CERT')
  )
}

export default function PartnerPricingPanel() {
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([])
  const [tours, setTours] = useState<TourLite[]>([])
  const [companyId, setCompanyId] = useState('')
  const [prices, setPrices] = useState<PartnerTourPriceRow[]>([])
  const [audit, setAudit] = useState<PartnerPriceAuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [tourId, setTourId] = useState<number | ''>('')
  const [pricingType, setPricingType] = useState<'fixed_net' | 'percent_off_retail'>('fixed_net')
  const [fixedNet, setFixedNet] = useState('')
  const [percentOff, setPercentOff] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [effectiveTo, setEffectiveTo] = useState('')
  const [active, setActive] = useState(true)
  const [note, setNote] = useState('')
  const [editId, setEditId] = useState<string | null>(null)

  const priceByTour = useMemo(() => {
    const m = new Map<number, PartnerTourPriceRow>()
    for (const p of prices) {
      const prev = m.get(p.tour_id)
      if (!prev || (p.is_active && !prev.is_active) || p.updated_at > prev.updated_at) {
        m.set(p.tour_id, p)
      }
    }
    return m
  }, [prices])

  const selectedTour = tours.find((t) => t.id === tourId) || null
  const previewNet =
    selectedTour && tourId
      ? resolvePartnerNetPreview(
          Number(selectedTour.adult_price),
          pricingType,
          pricingType === 'fixed_net' ? Number(fixedNet) : null,
          pricingType === 'percent_off_retail' ? Number(percentOff) : null,
        )
      : null

  const loadMeta = async () => {
    const [cos, ts] = await Promise.all([fetchPartnerCompaniesList(), fetchProducts()])
    setCompanies(cos)
    setTours((ts as unknown as TourLite[]).filter((t) => t.is_active !== false && !isInternal(t)))
  }

  const loadCompany = async (id: string) => {
    if (!id) {
      setPrices([])
      setAudit([])
      return
    }
    const [p, a] = await Promise.all([
      fetchPartnerTourPricesAdmin(id),
      fetchPartnerPriceAudit(id),
    ])
    setPrices(p)
    setAudit(a)
  }

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true)
        setError('')
        await loadMeta()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load pricing data')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    void loadCompany(companyId).catch((e) =>
      setError(e instanceof Error ? e.message : 'Failed to load company prices'),
    )
  }, [companyId])

  const startEdit = (row: PartnerTourPriceRow) => {
    setEditId(row.id)
    setTourId(row.tour_id)
    setPricingType(row.pricing_type)
    setFixedNet(row.fixed_net_eur != null ? String(row.fixed_net_eur) : '')
    setPercentOff(row.percent_off != null ? String(row.percent_off) : '')
    setEffectiveFrom(row.effective_from?.slice(0, 10) || new Date().toISOString().slice(0, 10))
    setEffectiveTo(row.effective_to?.slice(0, 10) || '')
    setActive(row.is_active)
    setNote(row.admin_note || '')
  }

  const resetForm = () => {
    setEditId(null)
    setTourId('')
    setPricingType('fixed_net')
    setFixedNet('')
    setPercentOff('')
    setEffectiveFrom(new Date().toISOString().slice(0, 10))
    setEffectiveTo('')
    setActive(true)
    setNote('')
  }

  const save = async () => {
    if (!companyId || !tourId) {
      setError('Select a company and tour.')
      return
    }
    const retail = Number(selectedTour?.adult_price || 0)
    const net = previewNet
    if (net == null) {
      setError('Enter a valid partner price.')
      return
    }
    if (retail > 0 && Math.abs(net - retail) / retail >= 0.25) {
      const ok = window.confirm(
        `This partner net (€${net.toFixed(2)}) differs from retail (€${retail.toFixed(2)}) by 25% or more. Save anyway?`,
      )
      if (!ok) return
    } else if (!window.confirm('Save partner rate for this tour?')) {
      return
    }
    try {
      setBusy(true)
      setError('')
      await upsertPartnerTourPriceAdmin({
        partner_company_id: companyId,
        tour_id: Number(tourId),
        pricing_type: pricingType,
        fixed_net_eur: pricingType === 'fixed_net' ? Number(fixedNet) : null,
        percent_off: pricingType === 'percent_off_retail' ? Number(percentOff) : null,
        is_active: active,
        effective_from: effectiveFrom,
        effective_to: effectiveTo || null,
        admin_note: note || null,
        price_id: editId,
      })
      await loadCompany(companyId)
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const deactivate = async (row: PartnerTourPriceRow) => {
    if (!window.confirm(`Deactivate rate for tour #${row.tour_id}?`)) return
    try {
      setBusy(true)
      await upsertPartnerTourPriceAdmin({
        partner_company_id: row.partner_company_id,
        tour_id: row.tour_id,
        pricing_type: row.pricing_type,
        fixed_net_eur: row.fixed_net_eur,
        percent_off: row.percent_off,
        is_active: false,
        effective_from: row.effective_from,
        effective_to: row.effective_to,
        admin_note: row.admin_note,
        price_id: row.id,
      })
      await loadCompany(companyId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deactivate failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading pricing…</p>

  return (
    <div className="space-y-4">
      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <Card>
        <Field label="Partner company">
          <select
            className={selectClass}
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value)
              resetForm()
            }}
          >
            <option value="">Select company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        {!companyId ? (
          <p className="mt-2 text-sm text-zinc-500">
            Choose a company to assign company-specific partner net rates. No default discounts are
            applied.
          </p>
        ) : null}
      </Card>

      {companyId ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
          <Card padded={false}>
            <div className="border-b border-zinc-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-900">Tour rates</h3>
              <p className="text-xs text-zinc-500">Retail vs configured partner net</p>
            </div>
            <ul className="divide-y divide-zinc-100">
              {tours.map((t) => {
                const row = priceByTour.get(t.id)
                const net = row
                  ? resolvePartnerNetPreview(
                      Number(t.adult_price),
                      row.pricing_type,
                      row.fixed_net_eur,
                      row.percent_off,
                    )
                  : null
                return (
                  <li key={t.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{tourTitle(t)}</p>
                      <p className="text-xs text-zinc-500">
                        Retail €{Number(t.adult_price).toFixed(2)}
                        {net != null ? ` · Partner net €${net.toFixed(2)}` : ' · No partner rate'}
                        {row && !row.is_active ? ' · inactive' : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row ? (
                        <Badge tone={row.is_active ? 'green' : 'gray'}>
                          {row.is_active ? row.pricing_type : 'inactive'}
                        </Badge>
                      ) : (
                        <Badge tone="gray">unset</Badge>
                      )}
                      {row ? (
                        <>
                          <button
                            type="button"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            onClick={() => startEdit(row)}
                          >
                            Edit
                          </button>
                          {row.is_active ? (
                            <button
                              type="button"
                              className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800"
                              disabled={busy}
                              onClick={() => void deactivate(row)}
                            >
                              Deactivate
                            </button>
                          ) : null}
                        </>
                      ) : (
                        <button
                          type="button"
                          className="rounded border border-zinc-300 px-2 py-1 text-xs"
                          onClick={() => {
                            resetForm()
                            setTourId(t.id)
                          }}
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-zinc-900">
                {editId ? 'Edit rate' : 'Assign rate'}
              </h3>
              <div className="mt-3 space-y-3">
                <Field label="Tour">
                  <select
                    className={selectClass}
                    value={tourId}
                    onChange={(e) => setTourId(e.target.value ? Number(e.target.value) : '')}
                    disabled={Boolean(editId)}
                  >
                    <option value="">Select tour…</option>
                    {tours.map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.id} {tourTitle(t)} (€{Number(t.adult_price).toFixed(0)})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Pricing type">
                  <select
                    className={selectClass}
                    value={pricingType}
                    onChange={(e) =>
                      setPricingType(e.target.value as 'fixed_net' | 'percent_off_retail')
                    }
                  >
                    <option value="fixed_net">Fixed EUR net</option>
                    <option value="percent_off_retail">Percent off retail</option>
                  </select>
                </Field>
                {pricingType === 'fixed_net' ? (
                  <Field label="Fixed net (EUR)">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      step="0.01"
                      value={fixedNet}
                      onChange={(e) => setFixedNet(e.target.value)}
                    />
                  </Field>
                ) : (
                  <Field label="Percent off retail">
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={percentOff}
                      onChange={(e) => setPercentOff(e.target.value)}
                    />
                  </Field>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Effective from">
                    <input
                      className={inputClass}
                      type="date"
                      value={effectiveFrom}
                      onChange={(e) => setEffectiveFrom(e.target.value)}
                    />
                  </Field>
                  <Field label="Effective to (optional)">
                    <input
                      className={inputClass}
                      type="date"
                      value={effectiveTo}
                      onChange={(e) => setEffectiveTo(e.target.value)}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  Active
                </label>
                <Field label="Admin note">
                  <input
                    className={inputClass}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                {selectedTour ? (
                  <p className="text-xs text-zinc-500">
                    Retail €{Number(selectedTour.adult_price).toFixed(2)}
                    {previewNet != null ? ` → Partner net €${previewNet.toFixed(2)}` : ''}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save()}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {busy ? 'Saving…' : 'Save rate'}
                  </button>
                  {editId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-zinc-900">Audit trail</h3>
              {audit.length === 0 ? (
                <p className="mt-2 text-xs text-zinc-500">No pricing changes yet.</p>
              ) : (
                <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto text-xs text-zinc-600">
                  {audit.map((a) => (
                    <li key={a.id} className="border-b border-zinc-100 pb-2">
                      <span className="font-medium text-zinc-800">{a.action}</span> · tour #
                      {a.tour_id}
                      <br />
                      <span className="text-zinc-400">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
