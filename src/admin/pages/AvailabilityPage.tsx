import React, { useEffect, useMemo, useState } from 'react'
import AdminAvailability from '../../components/AdminAvailability'
import { fetchProducts } from '../adminApi'
import type { Product } from '../types'

export default function AvailabilityPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [tourId, setTourId] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
      .then((list) => {
        const active = list.filter((p) => p.is_active !== false)
        setProducts(active)
        if (active.length > 0) setTourId(active[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load tours'))
  }, [])

  const selected = useMemo(
    () => products.find((p) => p.id === tourId) || null,
    [products, tourId],
  )

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Availability</h1>
        <p className="mt-0.5 text-sm text-zinc-500">
          Compact calendar · remaining/capacity per day · refresh stays on-screen
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {products.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5">
          {products.map((p) => {
            const label = p.public_name || p.name
            const active = p.id === tourId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTourId(p.id)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {selected ? (
        <AdminAvailability
          key={selected.id}
          tourId={selected.id}
          tourName={selected.public_name || selected.name}
          maxCapacity={selected.max_capacity || 8}
          embedded
        />
      ) : (
        !error && <p className="text-sm text-zinc-500">Loading tours…</p>
      )}
    </div>
  )
}
