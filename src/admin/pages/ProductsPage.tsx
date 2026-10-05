import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProducts, setProductActive } from '../adminApi'
import type { Product } from '../types'
import { Badge } from '../components/Badge'
import { formatEuroAmount } from '../../lib/tourPricing'
import { getDisplayPricing } from '../../lib/tourCms'
import { TOUR_PUBLIC_PAGES } from '../../lib/productVisibility'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load tours'))

  useEffect(() => {
    load()
  }, [])

  const removeOrRestore = async (product: Product, makeActive: boolean) => {
    const label = product.public_name || product.name
    const publicPath = TOUR_PUBLIC_PAGES[product.id]?.path
    if (!makeActive) {
      const ok = window.confirm(
        `Hide "${label}" from the website?\n\n` +
          `This hides the product and its public page` +
          (publicPath ? ` (${publicPath})` : '') +
          `. Existing bookings stay in admin.`,
      )
      if (!ok) return
    } else {
      const ok = window.confirm(`Publish "${label}" on the website again?`)
      if (!ok) return
    }
    setError('')
    setMsg('')
    setBusyId(product.id)
    try {
      await setProductActive(product.id, makeActive)
      setMsg(makeActive ? `"${label}" published.` : `"${label}" hidden from the website.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update visibility')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Tours / Experiences</h1>
        <p className="text-sm text-zinc-600">
          Edit prices, sale, descriptions, highlights, inclusions, photos and SEO here. Changes go live on
          royalnordic.fi after save — no code deploy required for normal commercial updates.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {msg}
        </div>
      ) : null}

      <ul className="space-y-2">
        {products.map((p) => {
          const pricing = getDisplayPricing(p as never)
          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:items-center"
            >
              <Link to={`/products/${p.id}`} className="min-w-0 flex-1 text-left">
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      {p.public_name || p.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      #{p.id}
                      {TOUR_PUBLIC_PAGES[p.id]?.path ? ` · ${TOUR_PUBLIC_PAGES[p.id].path}` : ''}
                      {p.badge ? ` · ${p.badge}` : ''}
                    </div>
                  </div>
                  <Badge tone={p.is_active === false ? 'gray' : 'green'}>
                    {p.is_active === false ? 'Hidden' : 'Live'}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-zinc-600">
                  {pricing.saleActive ? (
                    <>
                      <span className="line-through opacity-60">
                        €{formatEuroAmount(pricing.reference!)}
                      </span>{' '}
                      <strong>€{formatEuroAmount(pricing.current)}</strong> adult
                    </>
                  ) : (
                    <>
                      Adult €{formatEuroAmount(pricing.current)}
                    </>
                  )}
                  {' · '}Child €{formatEuroAmount(pricing.child)} · cap {p.max_capacity}
                  {p.duration_text ? ` · ${p.duration_text}` : ''}
                </div>
              </Link>
              <div className="flex shrink-0 gap-2">
                <Link
                  to={`/products/${p.id}`}
                  className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  Edit
                </Link>
                {p.is_active === false ? (
                  <button
                    type="button"
                    onClick={() => removeOrRestore(p, true)}
                    disabled={busyId === p.id}
                    className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 disabled:opacity-60"
                  >
                    {busyId === p.id ? '…' : 'Publish'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => removeOrRestore(p, false)}
                    disabled={busyId === p.id}
                    className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-800 disabled:opacity-60"
                  >
                    {busyId === p.id ? '…' : 'Hide'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
