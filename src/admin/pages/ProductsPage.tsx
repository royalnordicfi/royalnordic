import React, { useEffect, useState } from 'react'
import { fetchProducts, updateProduct } from '../adminApi'
import type { Product } from '../types'
import { Badge } from '../components/Badge'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)

  const load = () =>
    fetchProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!editing) return
    setMsg('')
    setError('')
    try {
      await updateProduct(editing.id, {
        name: editing.name,
        public_name: editing.public_name,
        description: editing.description,
        adult_price: Number(editing.adult_price),
        child_price: Number(editing.child_price),
        max_capacity: Number(editing.max_capacity),
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
      setMsg('Product saved')
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed — apply migration 016 for ops fields')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Products</h1>
        <p className="text-sm text-gray-600">Existing tours only — no invented products.</p>
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
            <Field label="Adult price €">
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editing.adult_price}
                onChange={(e) =>
                  setEditing({ ...editing, adult_price: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Child price €">
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={editing.child_price}
                onChange={(e) =>
                  setEditing({ ...editing, child_price: Number(e.target.value) })
                }
              />
            </Field>
          </div>
          <Field label="Capacity">
            <input
              type="number"
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={editing.is_active !== false}
              onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="flex-1 bg-emerald-700 text-white py-2.5 rounded-lg font-semibold"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 border rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setEditing(p)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg p-3"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{p.public_name || p.name}</div>
                    <div className="text-xs text-gray-500">Internal: {p.name}</div>
                  </div>
                  <Badge tone={p.is_active === false ? 'gray' : 'green'}>
                    {p.is_active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  €{p.adult_price} adult · cap {p.max_capacity}
                  {p.duration_text ? ` · ${p.duration_text}` : ''}
                </div>
              </button>
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
