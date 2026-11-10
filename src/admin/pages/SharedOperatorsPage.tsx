import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  createSharedBookingOperator,
  fetchSharedBookingsAccess,
  listSharedBookingOperators,
  listSharedSuppliersAdmin,
  resetSharedOperatorTemporaryPassword,
  setSharedOperatorActive,
} from '../adminApi'
import { Card, ErrorBanner, Field, PageHeader, PrimaryButton, SecondaryButton, inputClass } from '../components/ui'
import { Badge } from '../components/Badge'
import type { SharedBookingsAccess, SharedOperatorRow, SharedSupplierOption } from '../sharedBookings'

export default function SharedOperatorsPage() {
  const [access, setAccess] = useState<SharedBookingsAccess | null>(null)
  const [operators, setOperators] = useState<SharedOperatorRow[]>([])
  const [suppliers, setSuppliers] = useState<SharedSupplierOption[]>([])
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    const [ops, sups] = await Promise.all([
      listSharedBookingOperators(),
      listSharedSuppliersAdmin(),
    ])
    if (!ops.ok) throw new Error(ops.error || 'Could not load operators')
    if (!sups.ok) throw new Error(sups.error || 'Could not load suppliers')
    setOperators(ops.operators)
    setSuppliers(sups.suppliers)
    if (!supplierId && sups.suppliers[0]) setSupplierId(sups.suppliers[0].id)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const a = await fetchSharedBookingsAccess()
        if (cancelled) return
        setAccess(a)
        if (a.ok && a.access === 'admin') {
          await reload()
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loading && access && !(access.ok && access.access === 'admin')) {
    return <Navigate to="/sharedbookings/access-denied" replace />
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setOneTimePassword(null)
    setBusy(true)
    try {
      const res = await createSharedBookingOperator({
        email,
        display_name: displayName || undefined,
        supplier_id: supplierId,
      })
      setOneTimePassword(res.temporary_password)
      setEmail('')
      setDisplayName('')
      await reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Shared Bookings operators"
        subtitle="Admin-only provisioning. Temporary passwords are shown once and never stored."
        actions={
          <Link
            to="/sharedbookings"
            className="inline-flex min-h-[40px] items-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            ← Shared Bookings
          </Link>
        }
      />

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      {oneTimePassword ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-950">One-time temporary password</p>
          <p className="mt-1 text-xs text-amber-900">
            Share securely with the operator. They must change it on first login. It cannot be
            retrieved again.
          </p>
          <code className="mt-3 block break-all rounded-lg bg-white px-3 py-2 text-sm text-zinc-900">
            {oneTimePassword}
          </code>
          <SecondaryButton
            type="button"
            className="mt-3"
            onClick={() => {
              void navigator.clipboard?.writeText(oneTimePassword)
            }}
          >
            Copy password
          </SecondaryButton>
        </Card>
      ) : null}

      <Card>
        <h2 className="text-sm font-semibold text-zinc-900">Create operator</h2>
        <form onSubmit={onCreate} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Email">
            <input
              className={inputClass}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Display name">
            <input
              className={inputClass}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional"
            />
          </Field>
          <Field label="Supplier" className="sm:col-span-2">
            <select
              className={inputClass}
              required
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name} ({s.code})
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit" disabled={busy || !supplierId}>
              {busy ? 'Creating…' : 'Create operator'}
            </PrimaryButton>
          </div>
        </form>
      </Card>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900">Operators</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : operators.length === 0 ? (
          <Card>
            <p className="text-sm text-zinc-600">No operators yet.</p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {operators.map((op) => (
              <li key={op.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-zinc-900">{op.display_name || op.email}</p>
                    <p className="text-xs text-zinc-500">
                      {op.email} · {op.supplier_name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={op.is_active ? 'green' : 'gray'}>
                        {op.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {op.must_change_password ? (
                        <Badge tone="yellow">Must change password</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        setError('')
                        setOneTimePassword(null)
                        try {
                          const res = await resetSharedOperatorTemporaryPassword(op.id)
                          setOneTimePassword(res.temporary_password)
                          await reload()
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Reset failed')
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      Reset temp password
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true)
                        setError('')
                        try {
                          await setSharedOperatorActive(op.id, !op.is_active)
                          await reload()
                        } catch (e) {
                          setError(e instanceof Error ? e.message : 'Update failed')
                        } finally {
                          setBusy(false)
                        }
                      }}
                    >
                      {op.is_active ? 'Deactivate' : 'Activate'}
                    </SecondaryButton>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
