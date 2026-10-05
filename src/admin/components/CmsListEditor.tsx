import { newCmsId, reindexSort, type CmsListItem } from '../../lib/tourCms'

type Props = {
  label: string
  help?: string
  items: CmsListItem[]
  onChange: (items: CmsListItem[]) => void
  placeholder?: string
}

export default function CmsListEditor({ label, help, items, onChange, placeholder }: Props) {
  const sorted = [...items].sort((a, b) => a.sort - b.sort)

  const update = (next: CmsListItem[]) => onChange(reindexSort(next))

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-zinc-600">{label}</p>
          {help ? <p className="text-[11px] text-zinc-500">{help}</p> : null}
        </div>
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={() =>
            update([
              ...sorted,
              { id: newCmsId('item'), text: '', sort: sorted.length },
            ])
          }
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {sorted.map((item, index) => (
          <li key={item.id} className="flex items-start gap-2">
            <div className="flex shrink-0 flex-col gap-1 pt-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0}
                className="rounded border px-1.5 text-xs disabled:opacity-30"
                onClick={() => {
                  if (index === 0) return
                  const next = [...sorted]
                  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                  update(next)
                }}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === sorted.length - 1}
                className="rounded border px-1.5 text-xs disabled:opacity-30"
                onClick={() => {
                  if (index >= sorted.length - 1) return
                  const next = [...sorted]
                  ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                  update(next)
                }}
              >
                ↓
              </button>
            </div>
            <input
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={item.text}
              placeholder={placeholder || 'Item text'}
              onChange={(e) => {
                const next = sorted.map((row) =>
                  row.id === item.id ? { ...row, text: e.target.value } : row,
                )
                update(next)
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-lg border border-red-200 px-2 py-2 text-xs text-red-700"
              onClick={() => update(sorted.filter((row) => row.id !== item.id))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-xs text-zinc-500">
          No items yet
        </p>
      ) : null}
    </div>
  )
}
