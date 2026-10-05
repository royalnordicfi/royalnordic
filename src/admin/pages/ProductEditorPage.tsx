import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  fetchProduct,
  setProductActive,
  updateProduct,
  uploadTourMedia,
} from '../adminApi'
import type { Product } from '../types'
import CmsListEditor from '../components/CmsListEditor'
import { Badge } from '../components/Badge'
import { formatEuroAmount } from '../../lib/tourPricing'
import { newCmsId, reindexSort, type CmsFaqItem, type CmsGalleryItem } from '../../lib/tourCms'
import { TOUR_PUBLIC_PAGES } from '../../lib/productVisibility'
import { getDisplayPricing } from '../../lib/tourCms'

type Tab = 'overview' | 'content' | 'pricing' | 'inclusions' | 'photos' | 'booking' | 'seo'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'content', label: 'Content' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inclusions', label: 'Inclusions' },
  { id: 'photos', label: 'Photos' },
  { id: 'booking', label: 'Booking' },
  { id: 'seo', label: 'SEO' },
]

const BADGE_OPTIONS = [
  '',
  'MOST POPULAR',
  'BEST VALUE',
  'PRIVATE',
  'SMALL GROUP',
  'SALE',
  '100% GUARANTEE',
]

export default function ProductEditorPage() {
  const { id } = useParams()
  const tourId = Number(id)
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [product, setProduct] = useState<Product | null>(null)
  const [baseline, setBaseline] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty = useMemo(() => {
    if (!product) return false
    return JSON.stringify(product) !== baseline
  }, [product, baseline])

  useEffect(() => {
    if (!Number.isFinite(tourId)) {
      setError('Invalid tour')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchProduct(tourId)
      .then((p) => {
        if (cancelled) return
        setProduct(p)
        setBaseline(JSON.stringify(p))
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load tour')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tourId])

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const patch = <K extends keyof Product>(key: K, value: Product[K]) => {
    setProduct((prev) => (prev ? { ...prev, [key]: value } : prev))
    setMsg('')
  }

  const save = async () => {
    if (!product || saving) return
    setError('')
    setMsg('')
    setSaving(true)
    try {
      const gallery = reindexSort([...(product.gallery || [])])
      const hero = gallery.find((g) => g.is_hero) || gallery[0]
      await updateProduct(product.id, {
        name: product.name,
        public_name: product.public_name,
        description: product.description,
        tagline: product.tagline,
        card_description: product.card_description,
        full_description: product.full_description,
        adult_price: Number(product.adult_price),
        child_price: Number(product.child_price),
        reference_price:
          product.reference_price == null || product.reference_price === ('' as unknown)
            ? null
            : Number(product.reference_price),
        sale_enabled: Boolean(product.sale_enabled),
        sale_label: product.sale_label,
        sale_starts_at: product.sale_starts_at || null,
        sale_ends_at: product.sale_ends_at || null,
        max_capacity: Number(product.max_capacity),
        duration_text: product.duration_text,
        group_size_text: product.group_size_text,
        meeting_point: product.meeting_point,
        badge: product.badge || null,
        highlights: reindexSort([...(product.highlights || [])].filter((i) => i.text.trim())),
        included_items: reindexSort([...(product.included_items || [])].filter((i) => i.text.trim())),
        excluded_items: reindexSort([...(product.excluded_items || [])].filter((i) => i.text.trim())),
        what_to_expect: product.what_to_expect,
        important_info: product.important_info,
        know_before: product.know_before,
        what_to_bring: product.what_to_bring,
        pickup_info: product.pickup_info,
        cancellation_info: product.cancellation_info,
        guarantee_info: product.guarantee_info,
        gallery,
        hero_image_url: hero?.url || product.hero_image_url || null,
        faq: reindexSort(
          [...(product.faq || [])].filter((f) => f.question.trim() && f.answer.trim()),
        ),
        seo_title: product.seo_title,
        seo_description: product.seo_description,
        seo_image: product.seo_image || hero?.url || null,
        operational_notes: product.operational_notes,
        platform_availability: product.platform_availability,
        commission_percent: product.commission_percent,
        is_active: product.is_active,
      })
      const refreshed = await fetchProduct(product.id)
      setProduct(refreshed)
      setBaseline(JSON.stringify(refreshed))
      setMsg('Tour saved. The public website will use these values on the next page load.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const onUpload = async (files: FileList | null) => {
    if (!product || !files?.length || uploading) return
    setUploading(true)
    setError('')
    try {
      const gallery = [...(product.gallery || [])]
      for (const file of Array.from(files)) {
        const { url } = await uploadTourMedia(product.id, file)
        gallery.push({
          id: newCmsId('g'),
          url,
          alt: `${product.public_name || product.name} photo`,
          sort: gallery.length,
          is_hero: gallery.length === 0,
        })
      }
      patch('gallery', reindexSort(gallery))
      setMsg('Photo uploaded — remember to Save Changes.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading tour…</p>
  }
  if (!product) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-700">{error || 'Tour not found'}</p>
        <Link to="/products" className="text-sm font-medium text-emerald-800 underline">
          Back to tours
        </Link>
      </div>
    )
  }

  const pricing = getDisplayPricing(product as never)
  const publicPath = TOUR_PUBLIC_PAGES[product.id]?.path

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link to="/products" className="text-xs font-medium text-emerald-800 hover:underline">
            ← Tours / Experiences
          </Link>
          <h1 className="mt-1 truncate text-xl font-bold text-zinc-900">
            {product.public_name || product.name}
          </h1>
          <p className="text-xs text-zinc-500">
            #{product.id}
            {publicPath ? ` · ${publicPath}` : ''} · charged adult €{formatEuroAmount(pricing.current)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={product.is_active === false ? 'gray' : 'green'}>
            {product.is_active === false ? 'Hidden' : 'Published'}
          </Badge>
          {dirty ? <Badge tone="yellow">Unsaved</Badge> : null}
          {publicPath ? (
            <a
              href={`https://royalnordic.fi${publicPath}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-3 py-2 text-xs font-medium"
            >
              View live
            </a>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}
      {msg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {msg}
        </div>
      ) : null}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
              tab === t.id ? 'bg-emerald-700 text-white' : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        {tab === 'overview' && (
          <div className="space-y-3">
            <Field label="Internal name (ops / integrations)">
              <input
                className="field"
                value={product.name}
                onChange={(e) => patch('name', e.target.value)}
              />
            </Field>
            <Field label="Public title">
              <input
                className="field"
                value={product.public_name || ''}
                onChange={(e) => patch('public_name', e.target.value)}
              />
            </Field>
            <Field label="Tagline (hero promise)">
              <input
                className="field"
                value={product.tagline || ''}
                onChange={(e) => patch('tagline', e.target.value)}
                placeholder="See the Aurora or get your money back."
              />
            </Field>
            <Field label="Short card description">
              <textarea
                className="field min-h-[72px]"
                value={product.card_description || ''}
                onChange={(e) => patch('card_description', e.target.value)}
              />
            </Field>
            <Field label="Product badge">
              <select
                className="field"
                value={product.badge || ''}
                onChange={(e) => patch('badge', e.target.value || null)}
              >
                {BADGE_OPTIONS.map((b) => (
                  <option key={b || 'none'} value={b}>
                    {b || 'None'}
                  </option>
                ))}
              </select>
            </Field>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600">
              Website status:{' '}
              <strong className="text-zinc-900">
                {product.is_active === false ? 'Hidden' : 'Published'}
              </strong>
              . Use Remove / Restore on the tours list for visibility — booking IDs stay intact.
            </div>
          </div>
        )}

        {tab === 'content' && (
          <div className="space-y-4">
            <Field label="Full description">
              <textarea
                className="field min-h-[140px]"
                value={product.full_description || ''}
                onChange={(e) => patch('full_description', e.target.value)}
                placeholder="Paragraphs separated by blank lines. Use **bold** and - for lists."
              />
            </Field>
            <CmsListEditor
              label="Highlights"
              help="Shown as key selling points near the top of the tour page."
              items={product.highlights || []}
              onChange={(items) => patch('highlights', items)}
              placeholder="e.g. Free Professional Photos"
            />
            <Field label="What to expect">
              <textarea
                className="field min-h-[90px]"
                value={product.what_to_expect || ''}
                onChange={(e) => patch('what_to_expect', e.target.value)}
              />
            </Field>
            <Field label="Important information">
              <textarea
                className="field min-h-[80px]"
                value={product.important_info || ''}
                onChange={(e) => patch('important_info', e.target.value)}
              />
            </Field>
            <Field label="Know before you go">
              <textarea
                className="field min-h-[80px]"
                value={product.know_before || ''}
                onChange={(e) => patch('know_before', e.target.value)}
              />
            </Field>
            <Field label="What to bring">
              <textarea
                className="field min-h-[80px]"
                value={product.what_to_bring || ''}
                onChange={(e) => patch('what_to_bring', e.target.value)}
              />
            </Field>
            <Field label="Guarantee information">
              <textarea
                className="field min-h-[90px]"
                value={product.guarantee_info || ''}
                onChange={(e) => patch('guarantee_info', e.target.value)}
              />
            </Field>
            <Field label="Cancellation / refund information">
              <textarea
                className="field min-h-[80px]"
                value={product.cancellation_info || ''}
                onChange={(e) => patch('cancellation_info', e.target.value)}
              />
            </Field>
            <FaqEditor
              items={product.faq || []}
              onChange={(faq) => patch('faq', faq)}
            />
          </div>
        )}

        {tab === 'pricing' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              <strong>Current adult price</strong> is what checkout charges. Original price is display-only
              when sale is enabled.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Current adult price € (charged)">
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  className="field"
                  value={product.adult_price}
                  onChange={(e) => patch('adult_price', Number(e.target.value))}
                />
              </Field>
              <Field label="Child price €">
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  className="field"
                  value={product.child_price}
                  onChange={(e) => patch('child_price', Number(e.target.value))}
                />
              </Field>
              <Field label="Original / reference price €">
                <input
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  className="field"
                  value={product.reference_price ?? ''}
                  onChange={(e) =>
                    patch(
                      'reference_price',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  placeholder="e.g. 129"
                />
              </Field>
              <Field label="Sale label">
                <input
                  className="field"
                  value={product.sale_label || ''}
                  onChange={(e) => patch('sale_label', e.target.value)}
                  placeholder="Special offer"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-800">
              <input
                type="checkbox"
                checked={Boolean(product.sale_enabled)}
                onChange={(e) => patch('sale_enabled', e.target.checked)}
              />
              Sale enabled (show crossed-out original price on the website)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Sale starts (optional)">
                <input
                  type="datetime-local"
                  className="field"
                  value={toLocalInput(product.sale_starts_at)}
                  onChange={(e) =>
                    patch('sale_starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                />
              </Field>
              <Field label="Sale ends (optional)">
                <input
                  type="datetime-local"
                  className="field"
                  value={toLocalInput(product.sale_ends_at)}
                  onChange={(e) =>
                    patch('sale_ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)
                  }
                />
              </Field>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Public preview:{' '}
              {pricing.saleActive ? (
                <>
                  <span className="line-through opacity-60">€{formatEuroAmount(pricing.reference!)}</span>{' '}
                  <strong>€{formatEuroAmount(pricing.current)}</strong> / adult
                  {pricing.saveAmount > 0 ? ` · Save €${formatEuroAmount(pricing.saveAmount)}` : ''}
                </>
              ) : (
                <>
                  <strong>€{formatEuroAmount(pricing.current)}</strong> / adult
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'inclusions' && (
          <div className="space-y-5">
            <CmsListEditor
              label="What's included"
              items={product.included_items || []}
              onChange={(items) => patch('included_items', items)}
            />
            <CmsListEditor
              label="Not included"
              items={product.excluded_items || []}
              onChange={(items) => patch('excluded_items', items)}
            />
          </div>
        )}

        {tab === 'photos' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => onUpload(e.target.files)}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Upload photos'}
              </button>
              <p className="text-xs text-zinc-500">Images are resized automatically (max ~1920px).</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {(product.gallery || [])
                .slice()
                .sort((a, b) => a.sort - b.sort)
                .map((img, index, arr) => (
                  <li key={img.id} className="overflow-hidden rounded-lg border border-zinc-200">
                    <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full object-cover" />
                    <div className="space-y-2 p-2">
                      <input
                        className="field"
                        value={img.alt}
                        onChange={(e) => {
                          const next = (product.gallery || []).map((g) =>
                            g.id === img.id ? { ...g, alt: e.target.value } : g,
                          )
                          patch('gallery', next)
                        }}
                        placeholder="Alt text"
                      />
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-[11px]"
                          disabled={index === 0}
                          onClick={() => patch('gallery', moveItem(product.gallery || [], img.id, -1))}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="rounded border px-2 py-1 text-[11px]"
                          disabled={index === arr.length - 1}
                          onClick={() => patch('gallery', moveItem(product.gallery || [], img.id, 1))}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={`rounded border px-2 py-1 text-[11px] ${img.is_hero ? 'border-emerald-600 bg-emerald-50' : ''}`}
                          onClick={() =>
                            patch(
                              'gallery',
                              (product.gallery || []).map((g) => ({
                                ...g,
                                is_hero: g.id === img.id,
                              })),
                            )
                          }
                        >
                          {img.is_hero ? 'Hero' : 'Set hero'}
                        </button>
                        <button
                          type="button"
                          className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-700"
                          onClick={() =>
                            patch(
                              'gallery',
                              reindexSort((product.gallery || []).filter((g) => g.id !== img.id)),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {tab === 'booking' && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Duration text">
                <input
                  className="field"
                  value={product.duration_text || ''}
                  onChange={(e) => patch('duration_text', e.target.value)}
                  placeholder="2–10 h (~6h)"
                />
              </Field>
              <Field label="Group size text">
                <input
                  className="field"
                  value={product.group_size_text || ''}
                  onChange={(e) => patch('group_size_text', e.target.value)}
                  placeholder="Max 8 / vehicle"
                />
              </Field>
              <Field label="Max capacity (inventory)">
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="field"
                  value={product.max_capacity}
                  onChange={(e) => patch('max_capacity', Number(e.target.value))}
                />
              </Field>
              <Field label="Meeting point">
                <input
                  className="field"
                  value={product.meeting_point || ''}
                  onChange={(e) => patch('meeting_point', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Pickup information">
              <textarea
                className="field min-h-[90px]"
                value={product.pickup_info || ''}
                onChange={(e) => patch('pickup_info', e.target.value)}
              />
            </Field>
            <Field label="Operational notes (admin only)">
              <textarea
                className="field min-h-[72px]"
                value={product.operational_notes || ''}
                onChange={(e) => patch('operational_notes', e.target.value)}
              />
            </Field>
            <p className="text-xs text-zinc-500">
              Date availability is managed under Availability / Calendar — not duplicated here.
            </p>
          </div>
        )}

        {tab === 'seo' && (
          <div className="space-y-3">
            <Field label="SEO title">
              <input
                className="field"
                value={product.seo_title || ''}
                onChange={(e) => patch('seo_title', e.target.value)}
              />
            </Field>
            <Field label="Meta description">
              <textarea
                className="field min-h-[90px]"
                value={product.seo_description || ''}
                onChange={(e) => patch('seo_description', e.target.value)}
              />
            </Field>
            <Field label="Social / share image URL">
              <input
                className="field"
                value={product.seo_image || ''}
                onChange={(e) => patch('seo_image', e.target.value)}
                placeholder="/nortti1.jpg or uploaded image URL"
              />
            </Field>
            <p className="text-xs text-zinc-500">
              Structured data (Product JSON-LD) is generated automatically from title, description, and
              current adult price.
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:rounded-xl sm:border sm:bg-white sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">
            {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg border px-3 py-2 text-sm"
              onClick={() => {
                if (dirty && !window.confirm('Discard unsaved changes?')) return
                navigate('/products')
              }}
            >
              Back
            </button>
            {product.is_active === false ? (
              <button
                type="button"
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                onClick={async () => {
                  await setProductActive(product.id, true)
                  patch('is_active', true)
                  setMsg('Tour restored on the website.')
                }}
              >
                Publish
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                onClick={async () => {
                  if (!window.confirm('Hide this tour from the public website?')) return
                  await setProductActive(product.id, false)
                  patch('is_active', false)
                  setMsg('Tour hidden from the website.')
                }}
              >
                Hide
              </button>
            )}
            <button
              type="button"
              disabled={saving || !dirty}
              onClick={save}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .field { width: 100%; border-radius: 0.5rem; border: 1px solid #e4e4e7; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .field:focus { outline: 2px solid rgba(4,120,87,0.25); border-color: #047857; }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  )
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function moveItem(items: CmsGalleryItem[], id: string, dir: -1 | 1): CmsGalleryItem[] {
  const sorted = [...items].sort((a, b) => a.sort - b.sort)
  const index = sorted.findIndex((i) => i.id === id)
  const target = index + dir
  if (index < 0 || target < 0 || target >= sorted.length) return reindexSort(sorted)
  ;[sorted[index], sorted[target]] = [sorted[target], sorted[index]]
  return reindexSort(sorted)
}

function FaqEditor({
  items,
  onChange,
}: {
  items: CmsFaqItem[]
  onChange: (items: CmsFaqItem[]) => void
}) {
  const sorted = [...items].sort((a, b) => a.sort - b.sort)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-600">FAQ</p>
        <button
          type="button"
          className="rounded-lg border px-2.5 py-1.5 text-xs font-medium"
          onClick={() =>
            onChange(
              reindexSort([
                ...sorted,
                { id: newCmsId('f'), question: '', answer: '', sort: sorted.length },
              ]),
            )
          }
        >
          Add question
        </button>
      </div>
      {sorted.map((item) => (
        <div key={item.id} className="space-y-2 rounded-lg border border-zinc-200 p-3">
          <input
            className="field"
            placeholder="Question"
            value={item.question}
            onChange={(e) =>
              onChange(
                sorted.map((row) =>
                  row.id === item.id ? { ...row, question: e.target.value } : row,
                ),
              )
            }
          />
          <textarea
            className="field min-h-[72px]"
            placeholder="Answer"
            value={item.answer}
            onChange={(e) =>
              onChange(
                sorted.map((row) =>
                  row.id === item.id ? { ...row, answer: e.target.value } : row,
                ),
              )
            }
          />
          <button
            type="button"
            className="text-xs text-red-700"
            onClick={() => onChange(reindexSort(sorted.filter((row) => row.id !== item.id)))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}
