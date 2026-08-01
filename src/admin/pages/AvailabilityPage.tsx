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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Availability</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Open or close calendar dates and set capacity for each bookable tour.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {products.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {products.map((p) => {
            const label = p.public_name || p.name
            const active = p.id === tourId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setTourId(p.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50'
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
