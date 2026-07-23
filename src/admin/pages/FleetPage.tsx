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

  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  const [gEmail, setGEmail] = useState('')
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
        notes: gNotes || null,
        availability_status: 'available',
        is_active: true,
      })
      setGName('')
      setGPhone('')
      setGEmail('')
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

  const toggleGuide = async (g: Guide) => {
    await saveGuide({ name: g.name, is_active: !g.is_active }, g.id)
    await load()
  }

  const toggleVehicle = async (v: Vehicle) => {
    await saveVehicle(
      { name: v.name, passenger_capacity: v.passenger_capacity, is_active: !v.is_active },
      v.id,
    )
    await load()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Guides & vehicles</h1>
      <p className="text-sm text-gray-600">Assign from booking detail. Capacity checked on assign.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded">
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
          <form onSubmit={addGuide} className="bg-white border rounded-lg p-4 space-y-2">
            <h2 className="font-semibold text-sm">Add guide</h2>
            <input
              required
              placeholder="Name"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={gName}
              onChange={(e) => setGName(e.target.value)}
            />
            <input
              placeholder="Phone"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={gPhone}
              onChange={(e) => setGPhone(e.target.value)}
            />
            <input
              placeholder="Email"
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={gEmail}
              onChange={(e) => setGEmail(e.target.value)}
            />
            <input
              placeholder="Notes"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={gNotes}
              onChange={(e) => setGNotes(e.target.value)}
            />
            <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-semibold">
              Save guide
            </button>
          </form>
          <ul className="space-y-2">
            {guides.length === 0 && (
              <p className="text-sm text-gray-500">No guides yet (or tables not migrated).</p>
            )}
            {guides.map((g) => (
              <li key={g.id} className="bg-white border rounded-lg p-3 flex justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-xs text-gray-600">
                    {g.phone || '—'} · {g.email || '—'} · {g.availability_status}
                  </div>
                </div>
                <button type="button" onClick={() => toggleGuide(g)}>
                  <Badge tone={g.is_active ? 'green' : 'gray'}>
                    {g.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <form onSubmit={addVehicle} className="bg-white border rounded-lg p-4 space-y-2">
            <h2 className="font-semibold text-sm">Add vehicle</h2>
            <input
              required
              placeholder="Name"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={vName}
              onChange={(e) => setVName(e.target.value)}
            />
            <input
              placeholder="Registration"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={vReg}
              onChange={(e) => setVReg(e.target.value)}
            />
            <input
              type="number"
              min={1}
              placeholder="Capacity"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={vCap}
              onChange={(e) => setVCap(Number(e.target.value))}
            />
            <input
              placeholder="Notes"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={vNotes}
              onChange={(e) => setVNotes(e.target.value)}
            />
            <button type="submit" className="w-full bg-emerald-700 text-white py-2 rounded-lg font-semibold">
              Save vehicle
            </button>
          </form>
          <ul className="space-y-2">
            {vehicles.length === 0 && (
              <p className="text-sm text-gray-500">No vehicles yet (or tables not migrated).</p>
            )}
            {vehicles.map((v) => (
              <li key={v.id} className="bg-white border rounded-lg p-3 flex justify-between gap-2">
                <div>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-xs text-gray-600">
                    {v.registration_number || '—'} · cap {v.passenger_capacity} · {v.status}
                  </div>
                </div>
                <button type="button" onClick={() => toggleVehicle(v)}>
                  <Badge tone={v.is_active ? 'green' : 'gray'}>
                    {v.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
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
