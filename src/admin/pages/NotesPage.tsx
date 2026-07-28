import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createOpsNote,
  fetchOpsNotes,
  updateOpsNote,
} from '../adminApi'
import type { OpsNote, OpsNotePriority } from '../types'
import { NOTE_PRIORITY_LABELS } from '../types'
import { todayTourDateISO } from '../../lib/tourDate'

export default function NotesPage() {
  const [notes, setNotes] = useState<OpsNote[]>([])
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState<OpsNotePriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [showDone, setShowDone] = useState(false)

  const load = () =>
    fetchOpsNotes(showDone ? 'active' : 'open')
      .then(setNotes)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load notes'))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDone])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMsg('')
    try {
      await createOpsNote({
        title,
        body: body || undefined,
        priority,
        due_date: dueDate || null,
      })
      setTitle('')
      setBody('')
      setPriority('normal')
      setDueDate('')
      setMsg('Note added')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    }
  }

  const open = notes.filter((n) => n.status === 'open')
  const done = notes.filter((n) => n.status === 'done')
  const today = todayTourDateISO()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Operations notes</h1>
        <p className="text-sm text-gray-500">Call customer · fuel · snacks · invoice · repair — nothing more.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-lg">{error}</div>
      )}
      {msg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg">
          {msg}
        </div>
      )}

      <form onSubmit={create} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <input
          required
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Task title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm min-h-[64px]"
          placeholder="Details (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value as OpsNotePriority)}
          >
            {Object.entries(NOTE_PRIORITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold"
        >
          Add note
        </button>
      </form>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
        Show completed
      </label>

      <NoteList
        title="Open"
        items={open}
        today={today}
        onComplete={async (id) => {
          await updateOpsNote(id, { status: 'done' })
          await load()
        }}
        onArchive={async (id) => {
          await updateOpsNote(id, { status: 'archived' })
          await load()
        }}
      />

      {showDone && (
        <NoteList
          title="Done"
          items={done}
          today={today}
          onReopen={async (id) => {
            await updateOpsNote(id, { status: 'open' })
            await load()
          }}
          onArchive={async (id) => {
            await updateOpsNote(id, { status: 'archived' })
            await load()
          }}
        />
      )}
    </div>
  )
}

function NoteList({
  title,
  items,
  today,
  onComplete,
  onReopen,
  onArchive,
}: {
  title: string
  items: OpsNote[]
  today: string
  onComplete?: (id: number) => Promise<void>
  onReopen?: (id: number) => Promise<void>
  onArchive?: (id: number) => Promise<void>
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title} · {items.length}
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">None.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => {
            const overdue = n.due_date && n.due_date < today && n.status === 'open'
            return (
              <li
                key={n.id}
                className={`bg-white border rounded-xl p-3 ${
                  overdue ? 'border-amber-300' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{n.title}</div>
                    {n.body && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{n.body}</p>}
                    <p className="text-[11px] text-gray-400 mt-2">
                      {NOTE_PRIORITY_LABELS[n.priority]}
                      {n.due_date ? ` · due ${n.due_date}` : ''}
                      {n.assigned_to ? ` · ${n.assigned_to}` : ''}
                      {overdue ? ' · overdue' : ''}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {onComplete && (
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-emerald-700 text-white rounded-lg"
                        onClick={() => onComplete(n.id)}
                      >
                        Done
                      </button>
                    )}
                    {onReopen && (
                      <button
                        type="button"
                        className="text-xs px-2 py-1 bg-gray-800 text-white rounded-lg"
                        onClick={() => onReopen(n.id)}
                      >
                        Reopen
                      </button>
                    )}
                    {onArchive && (
                      <button
                        type="button"
                        className="text-xs px-2 py-1 border rounded-lg text-gray-600"
                        onClick={() => onArchive(n.id)}
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
