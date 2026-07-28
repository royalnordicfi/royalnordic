import React, { useEffect, useState } from 'react'
import { fetchGuides, fetchVehicles, saveGuide, saveVehicle } from '../adminApi'
import type { Guide, Vehicle } from '../types'
import { Badge } from '../components/Badge'

export default function FleetPage() {
  const [guides, setGuides] = useState<Guide[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'guides' | 'vehicles'>('guides')
  const [editGuide, setEditGuide] = useState<Guide | null>(null)
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null)

  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gEmail, setGEmail] = useState('')
  const [gLang, setGLang] = useState('')
  const [gNotes, setGNotes] = useState('')

  const [vName, setVName] = useState('')
  const [vReg, setVReg] = useState('')
  const [vCap, setVCap] = useState(8)
  const [vNotes, setVNotes] = useState('')

  const load = async () => {
    setError('')
    try {
      const [g, v] = await Promise.all([fetchGuides(), fetchVehicles()])
      setGuides(g)
      setVehicles(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed — apply migration 016')
    }
  }

  useEffect(() => {
    load()
  }, [])

  const addGuide = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveGuide({
        name: gName.trim(),
        phone: gPhone || null,
        email: gEmail || null,
        languages: gLang || null,
        notes: gNotes || null,
        availability_status: 'available',
        is_active: true,
      })
      setGName('')
      setGPhone('')
      setGEmail('')
      setGLang('')
      setGNotes('')
      setMsg('Guide saved')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await saveVehicle({
        name: vName.trim(),
        registration_number: vReg || null,
        passenger_capacity: vCap,
        notes: vNotes || null,
        status: 'available',
        is_active: true,
      })
      setVName('')
      setVReg('')
      setVCap(8)
      setVNotes('')
      setMsg('Vehicle saved')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Guides & vehicles</h1>
      <p className="text-sm text-gray-500">
        Assign from booking detail. Same-day double assignment and over-capacity are blocked.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
          {msg}
        </div>
      )}

      <div className="flex gap-2">
        <TabBtn active={tab === 'guides'} onClick={() => setTab('guides')}>
          Guides
        </TabBtn>
        <TabBtn active={tab === 'vehicles'} onClick={() => setTab('vehicles')}>
          Vehicles
        </TabBtn>
      </div>

      {tab === 'guides' ? (
        <>
          <form onSubmit={addGuide} className="bg-white border rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm">Add guide</h2>
            <input required placeholder="Name" className="w-full border rounded-lg px-3 py-2 text-sm" value={gName} onChange={(e) => setGName(e.target.value)} />
            <input placeholder="Phone" className="w-full border rounded-lg px-3 py-2 text-sm" value={gPhone} onChange={(e) => setGPhone(e.target.value)} />
            <input placeholder="Email" type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={gEmail} onChange={(e) => setGEmail(e.target.value)} />
            <input placeholder="Languages (e.g. EN, FI)" className="w-full border rounded-lg px-3 py-2 text-sm" value={gLang} onChange={(e) => setGLang(e.target.value)} />
            <input placeholder="Notes" className="w-full border rounded-lg px-3 py-2 text-sm" value={gNotes} onChange={(e) => setGNotes(e.target.value)} />
            <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-semibold">
              Save guide
            </button>
          </form>
          <ul className="space-y-2">
            {guides.length === 0 && (
              <p className="text-sm text-gray-500">No guides yet (or tables not migrated).</p>
            )}
            {guides.map((g) => (
              <li key={g.id} className="bg-white border rounded-xl p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{g.name}</div>
                    <div className="text-xs text-gray-600">
                      {g.phone || '—'} · {g.email || '—'} · {g.languages || 'langs TBD'} ·{' '}
                      {g.availability_status}
                    </div>
                    {g.notes && <div className="text-xs text-gray-500 mt-1">{g.notes}</div>}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveGuide({ name: g.name, is_active: !g.is_active }, g.id)
                        await load()
                      }}
                    >
                      <Badge tone={g.is_active ? 'green' : 'gray'}>
                        {g.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                    <button type="button" className="text-xs text-emerald-800" onClick={() => setEditGuide(g)}>
                      Edit
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['available', 'busy', 'off'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`text-[11px] px-2 py-1 rounded-lg border ${
                        g.availability_status === s ? 'bg-gray-900 text-white' : 'bg-white'
                      }`}
                      onClick={async () => {
                        await saveGuide({ name: g.name, availability_status: s }, g.id)
                        await load()
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <form onSubmit={addVehicle} className="bg-white border rounded-xl p-4 space-y-2">
            <h2 className="font-semibold text-sm">Add vehicle</h2>
            <input required placeholder="Name" className="w-full border rounded-lg px-3 py-2 text-sm" value={vName} onChange={(e) => setVName(e.target.value)} />
            <input placeholder="Registration" className="w-full border rounded-lg px-3 py-2 text-sm" value={vReg} onChange={(e) => setVReg(e.target.value)} />
            <input type="number" min={1} placeholder="Capacity" className="w-full border rounded-lg px-3 py-2 text-sm" value={vCap} onChange={(e) => setVCap(Number(e.target.value))} />
            <input placeholder="Notes" className="w-full border rounded-lg px-3 py-2 text-sm" value={vNotes} onChange={(e) => setVNotes(e.target.value)} />
            <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-semibold">
              Save vehicle
            </button>
          </form>
          <ul className="space-y-2">
            {vehicles.length === 0 && (
              <p className="text-sm text-gray-500">No vehicles yet (or tables not migrated).</p>
            )}
            {vehicles.map((v) => (
              <li key={v.id} className="bg-white border rounded-xl p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{v.name}</div>
                    <div className="text-xs text-gray-600">
                      {v.registration_number || '—'} · cap {v.passenger_capacity} · {v.status}
                    </div>
                    {v.notes && <div className="text-xs text-gray-500 mt-1">{v.notes}</div>}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <button
                      type="button"
                      onClick={async () => {
                        await saveVehicle(
                          {
                            name: v.name,
                            passenger_capacity: v.passenger_capacity,
                            is_active: !v.is_active,
                          },
                          v.id,
                        )
                        await load()
                      }}
                    >
                      <Badge tone={v.is_active ? 'green' : 'gray'}>
                        {v.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </button>
                    <button type="button" className="text-xs text-emerald-800" onClick={() => setEditVehicle(v)}>
                      Edit
                    </button>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(['available', 'in_use', 'maintenance'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`text-[11px] px-2 py-1 rounded-lg border ${
                        v.status === s ? 'bg-gray-900 text-white' : 'bg-white'
                      }`}
                      onClick={async () => {
                        await saveVehicle(
                          { name: v.name, passenger_capacity: v.passenger_capacity, status: s },
                          v.id,
                        )
                        await load()
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {editGuide && (
        <EditModal
          title="Edit guide"
          onClose={() => setEditGuide(null)}
          onSave={async (fields) => {
            await saveGuide(
              {
                name: fields.name,
                phone: fields.phone || null,
                email: fields.email || null,
                languages: fields.extra || null,
                notes: fields.notes || null,
                availability_status: editGuide.availability_status,
                is_active: editGuide.is_active,
              },
              editGuide.id,
            )
            setEditGuide(null)
            setMsg('Guide updated')
            await load()
          }}
          initial={{
            name: editGuide.name,
            phone: editGuide.phone || '',
            email: editGuide.email || '',
            extra: editGuide.languages || '',
            notes: editGuide.notes || '',
          }}
          extraLabel="Languages"
        />
      )}

      {editVehicle && (
        <EditModal
          title="Edit vehicle"
          onClose={() => setEditVehicle(null)}
          onSave={async (fields) => {
            await saveVehicle(
              {
                name: fields.name,
                registration_number: fields.phone || null,
                passenger_capacity: Number(fields.extra) || editVehicle.passenger_capacity,
                notes: fields.notes || null,
                status: editVehicle.status,
                is_active: editVehicle.is_active,
              },
              editVehicle.id,
            )
            setEditVehicle(null)
            setMsg('Vehicle updated')
            await load()
          }}
          initial={{
            name: editVehicle.name,
            phone: editVehicle.registration_number || '',
            email: '',
            extra: String(editVehicle.passenger_capacity),
            notes: editVehicle.notes || '',
          }}
          extraLabel="Capacity"
          hideEmail
        />
      )}
    </div>
  )
}

function EditModal({
  title,
  initial,
  extraLabel,
  hideEmail,
  onClose,
  onSave,
}: {
  title: string
  initial: { name: string; phone: string; email: string; extra: string; notes: string }
  extraLabel: string
  hideEmail?: boolean
  onClose: () => void
  onSave: (fields: typeof initial) => Promise<void>
}) {
  const [fields, setFields] = useState(initial)
  const [saving, setSaving] = useState(false)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-xl p-4 w-full max-w-md space-y-3">
        <div className="flex justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button type="button" className="text-sm text-gray-500" onClick={onClose}>
            Close
          </button>
        </div>
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={fields.name} onChange={(e) => setFields({ ...fields, name: e.target.value })} placeholder="Name" />
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={fields.phone} onChange={(e) => setFields({ ...fields, phone: e.target.value })} placeholder={hideEmail ? 'Registration' : 'Phone'} />
        {!hideEmail && (
          <input className="w-full border rounded-lg px-3 py-2 text-sm" value={fields.email} onChange={(e) => setFields({ ...fields, email: e.target.value })} placeholder="Email" />
        )}
        <input className="w-full border rounded-lg px-3 py-2 text-sm" value={fields.extra} onChange={(e) => setFields({ ...fields, extra: e.target.value })} placeholder={extraLabel} />
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm min-h-[64px]" value={fields.notes} onChange={(e) => setFields({ ...fields, notes: e.target.value })} placeholder="Notes" />
        <button
          type="button"
          disabled={saving}
          className="w-full bg-emerald-700 text-white py-2.5 rounded-lg font-semibold"
          onClick={async () => {
            setSaving(true)
            try {
              await onSave(fields)
            } finally {
              setSaving(false)
            }
          }}
        >
          Save
        </button>
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium ${
        active ? 'bg-black text-white' : 'bg-white border text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
