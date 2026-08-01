import React, { useEffect, useState } from 'react'
import { fetchProducts, setProductActive, updateProduct } from '../adminApi'
import type { Product } from '../types'
import { Badge } from '../components/Badge'
import { formatEuroAmount, validateTourPrices } from '../../lib/tourPricing'
import { TOUR_PUBLIC_PAGES } from '../../lib/productVisibility'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [baseline, setBaseline] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  const load = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))

  useEffect(() => {
    load()
  }, [])

  const startEdit = (product: Product) => {
    setError('')
    setMsg('')
    setEditing({ ...product })
    setBaseline({ ...product })
  }

  const cancelEdit = () => {
    setEditing(null)
    setBaseline(null)
    setError('')
  }

  const save = async () => {
    if (!editing || saving) return
    setMsg('')
    setError('')

    let prices
    try {
      prices = validateTourPrices(Number(editing.adult_price), Number(editing.child_price))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid prices')
      return
    }

    const cap = Number(editing.max_capacity)
    if (!Number.isInteger(cap) || cap < 1 || cap > 100) {
      setError('Capacity must be an integer between 1 and 100')
      return
    }

    if (baseline) {
      const adultDelta = Math.abs(prices.adult_price - Number(baseline.adult_price))
      const childDelta = Math.abs(prices.child_price - Number(baseline.child_price))
      const largeChange =
        adultDelta >= 50 ||
        childDelta >= 50 ||
        (Number(baseline.adult_price) > 0 && adultDelta / Number(baseline.adult_price) >= 0.5) ||
        (Number(baseline.child_price) > 0 && childDelta / Number(baseline.child_price) >= 0.5)
      if (largeChange) {
        const ok = window.confirm(
          `Confirm price change for "${editing.public_name || editing.name}"?\n\n` +
            `Adult: €${formatEuroAmount(Number(baseline.adult_price))} → €${formatEuroAmount(prices.adult_price)}\n` +
            `Child: €${formatEuroAmount(Number(baseline.child_price))} → €${formatEuroAmount(prices.child_price)}\n\n` +
            'This updates live booking prices on royalnordic.fi.',
        )
        if (!ok) return
      }
    }

    setSaving(true)
    try {
      await updateProduct(editing.id, {
        name: editing.name,
        public_name: editing.public_name,
        description: editing.description,
        adult_price: prices.adult_price,
        child_price: prices.child_price,
        max_capacity: cap,
        is_active: editing.is_active,
        duration_text: editing.duration_text,
        inclusions: editing.inclusions,
        operational_notes: editing.operational_notes,
        platform_availability: editing.platform_availability,
        commission_percent:
          editing.commission_percent == null || Number.isNaN(Number(editing.commission_percent))
            ? null
            : Number(editing.commission_percent),
      })
      setMsg(
        `Saved prices: adult €${formatEuroAmount(prices.adult_price)}, child €${formatEuroAmount(prices.child_price)} (EUR, VAT incl.)`,
      )
      setEditing(null)
      setBaseline(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed — apply migration 016 for ops fields')
      // Keep editing form values so the admin does not lose input.
    } finally {
      setSaving(false)
    }
  }

  const removeOrRestore = async (product: Product, makeActive: boolean) => {
    const label = product.public_name || product.name
    const publicPath = TOUR_PUBLIC_PAGES[product.id]?.path
    if (!makeActive) {
      const ok = window.confirm(
        `Remove "${label}" from the website?\n\n` +
          `This hides the product and its public page` +
          (publicPath ? ` (${publicPath})` : '') +
          `. Existing bookings stay in the admin. You can restore it later.`,
      )
      if (!ok) return
    } else {
      const ok = window.confirm(
        `Restore "${label}" on the website?\n\n` +
          `The product and its public page will be visible and bookable again.`,
      )
      if (!ok) return
    }

    setError('')
    setMsg('')
    setRemovingId(product.id)
    try {
      await setProductActive(product.id, makeActive)
      setMsg(
        makeActive
          ? `"${label}" restored — page is public again.`
          : `"${label}" removed from the website (page hidden).`,
      )
      if (editing?.id === product.id) {
        setEditing(null)
        setBaseline(null)
      }
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update product visibility')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm text-gray-600">
          Canonical tour prices in EUR (VAT included). Changes update calendar, booking summary, and
          checkout after refresh — no redeploy required. Remove a product to hide its whole public
          page; you can restore it anytime.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded">
          {msg}
        </div>
      )}

      {editing ? (
        <div className="bg-white border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Edit product #{editing.id}</h2>
          <Field label="Internal name">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Field>
          <Field label="Public name">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.public_name || ''}
              onChange={(e) => setEditing({ ...editing, public_name: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[80px]"
              value={editing.description || ''}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Adult price € (VAT incl.)">
              <input
                type="number"
                min={0}
                max={10000}
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editing.adult_price}
                onChange={(e) =>
                  setEditing({ ...editing, adult_price: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Child price € (VAT incl.)">
              <input
                type="number"
                min={0}
                max={10000}
                step="0.01"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editing.child_price}
                onChange={(e) =>
                  setEditing({ ...editing, child_price: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <p className="text-xs text-gray-500">Currency is fixed to EUR.</p>
          <Field label="Capacity">
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.max_capacity}
              onChange={(e) =>
                setEditing({ ...editing, max_capacity: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="Duration">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.duration_text || ''}
              onChange={(e) => setEditing({ ...editing, duration_text: e.target.value })}
              placeholder="e.g. 3–4 hours"
            />
          </Field>
          <Field label="Inclusions">
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]"
              value={editing.inclusions || ''}
              onChange={(e) => setEditing({ ...editing, inclusions: e.target.value })}
            />
          </Field>
          <Field label="Platform availability">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.platform_availability || ''}
              onChange={(e) =>
                setEditing({ ...editing, platform_availability: e.target.value })
              }
              placeholder="Website / GYG / not listed…"
            />
          </Field>
          <Field label="Commission % (only if real)">
            <input
              type="number"
              step="0.01"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={editing.commission_percent ?? ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  commission_percent: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              placeholder="Leave empty if unknown"
            />
          </Field>
          <Field label="Operational notes">
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm min-h-[72px]"
              value={editing.operational_notes || ''}
              onChange={(e) =>
                setEditing({ ...editing, operational_notes: e.target.value })
              }
            />
          </Field>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
            Website status:{' '}
            <strong className="text-zinc-900">
              {editing.is_active === false ? 'Removed (page hidden)' : 'Live'}
            </strong>
            {TOUR_PUBLIC_PAGES[editing.id]?.path
              ? ` · ${TOUR_PUBLIC_PAGES[editing.id].path}`
              : ''}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving || removingId === editing.id}
              className="flex-1 min-w-[8rem] bg-emerald-700 text-white py-2.5 rounded-lg font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving || removingId === editing.id}
              className="px-4 border rounded-lg disabled:opacity-60"
            >
              Cancel
            </button>
            {editing.is_active === false ? (
              <button
                type="button"
                onClick={() => removeOrRestore(editing, true)}
                disabled={saving || removingId === editing.id}
                className="px-4 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 text-sm font-medium disabled:opacity-60"
              >
                {removingId === editing.id ? 'Restoring…' : 'Restore on website'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => removeOrRestore(editing, false)}
                disabled={saving || removingId === editing.id}
                className="px-4 rounded-lg border border-red-300 bg-red-50 text-red-800 text-sm font-medium disabled:opacity-60"
              >
                {removingId === editing.id ? 'Removing…' : 'Remove from website'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="flex-1 text-left min-w-0"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{p.public_name || p.name}</div>
                    <div className="text-xs text-gray-500">
                      Internal: {p.name}
                      {TOUR_PUBLIC_PAGES[p.id]?.path
                        ? ` · ${TOUR_PUBLIC_PAGES[p.id].path}`
                        : ''}
                    </div>
                  </div>
                  <Badge tone={p.is_active === false ? 'gray' : 'green'}>
                    {p.is_active === false ? 'Removed' : 'Live'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  Adult €{formatEuroAmount(Number(p.adult_price))} · Child €
                  {formatEuroAmount(Number(p.child_price))} · cap {p.max_capacity}
                  {p.duration_text ? ` · ${p.duration_text}` : ''}
                </div>
              </button>
              {p.is_active === false ? (
                <button
                  type="button"
                  onClick={() => removeOrRestore(p, true)}
                  disabled={removingId === p.id}
                  className="shrink-0 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 disabled:opacity-60"
                >
                  {removingId === p.id ? 'Restoring…' : 'Restore'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => removeOrRestore(p, false)}
                  disabled={removingId === p.id}
                  className="shrink-0 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 disabled:opacity-60"
                >
                  {removingId === p.id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  )
}
