import React, { useState } from 'react'
import { importBookingsCsv } from '../adminApi'
import type { BookingSource, PaymentStatus } from '../types'

type PreviewRow = {
  customer_name: string
  customer_email: string
  customer_phone?: string
  tour_id: number
  tour_date: string
  adults: number
  children: number
  total_price: number
  source: BookingSource
  payment_status: PaymentStatus
  pickup_location?: string
  error?: string
}

const SOURCES = new Set([
  'direct_website',
  'getyourguide',
  'airbnb',
  'viator',
  'manual',
  'other',
])

function parseCsv(text: string): PreviewRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase())
  const rows: PreviewRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i])
    const get = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 ? (cols[idx] || '').trim() : ''
    }

    const sourceRaw = get('source') || 'other'
    const payRaw = get('payment_status') || 'unpaid'
    const row: PreviewRow = {
      customer_name: get('customer_name'),
      customer_email: get('customer_email'),
      customer_phone: get('customer_phone') || undefined,
      tour_id: Number(get('tour_id')),
      tour_date: get('tour_date'),
      adults: Number(get('adults') || 1),
      children: Number(get('children') || 0),
      total_price: Number(get('total_price') || 0),
      source: (SOURCES.has(sourceRaw) ? sourceRaw : 'other') as BookingSource,
      payment_status: payRaw as PaymentStatus,
      pickup_location: get('pickup_location') || undefined,
    }

    const errs: string[] = []
    if (!row.customer_name) errs.push('name required')
    if (!row.customer_email) errs.push('email required')
    if (!row.tour_id) errs.push('tour_id required')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.tour_date)) errs.push('tour_date YYYY-MM-DD')
    if (!(row.total_price >= 0)) errs.push('total_price invalid')
    if (errs.length) row.error = errs.join('; ')
    rows.push(row)
  }
  return rows
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQ = !inQ
      continue
    }
    if (ch === ',' && !inQ) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

export default function ImportPage() {
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [importing, setImporting] = useState(false)

  const onFile = async (file: File) => {
    setError('')
    setResult('')
    const text = await file.text()
    setPreview(parseCsv(text))
  }

  const confirm = async () => {
    const valid = preview.filter((r) => !r.error)
    if (!valid.length) {
      setError('No valid rows to import')
      return
    }
    if (!window.confirm(`Import ${valid.length} booking(s)? Duplicates will be skipped.`)) return
    setImporting(true)
    setError('')
    try {
      const res = await importBookingsCsv(valid)
      setResult(`Created ${res.created}. ${res.errors.length ? res.errors.join(' | ') : 'No errors.'}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">CSV import</h1>
        <p className="text-sm text-gray-600">
          Preview → validate → confirm. No platform scraping.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-4 text-xs text-gray-600 space-y-1">
        <p className="font-semibold text-gray-800">Required columns</p>
        <p>
          customer_name, customer_email, tour_id, tour_date (YYYY-MM-DD), adults, children,
          total_price, source, payment_status
        </p>
        <p>Optional: customer_phone, pickup_location</p>
      </div>

      <input
        type="file"
        accept=".csv,text/csv"
        className="block w-full text-sm"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm p-3 rounded">
          {result}
        </div>
      )}

      {preview.length > 0 && (
        <>
          <p className="text-sm">
            {preview.filter((r) => !r.error).length} valid / {preview.length} rows
          </p>
          <ul className="space-y-2 max-h-80 overflow-auto">
            {preview.map((r, i) => (
              <li
                key={i}
                className={`border rounded-lg p-2 text-xs ${
                  r.error ? 'bg-red-50 border-red-200' : 'bg-white'
                }`}
              >
                <div className="font-medium">
                  {r.customer_name} · {r.customer_email} · tour {r.tour_id} · {r.tour_date}
                </div>
                {r.error ? (
                  <div className="text-red-700 mt-1">{r.error}</div>
                ) : (
                  <div className="text-gray-600 mt-1">
                    {r.adults + r.children} pax · €{r.total_price} · {r.source}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={importing}
            onClick={confirm}
            className="w-full bg-emerald-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
          >
            {importing ? 'Importing…' : 'Confirm import'}
          </button>
        </>
      )}
    </div>
  )
}
