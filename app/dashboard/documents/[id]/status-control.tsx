'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['draft', 'review', 'approved', 'effective'] as const
type DocStatus = (typeof STATUSES)[number]

const STATUS_STYLES: Record<DocStatus, string> = {
  draft:    'border-gray-200 bg-gray-50 text-gray-600',
  review:   'border-amber-200 bg-amber-50 text-amber-700',
  approved: 'border-blue-200 bg-blue-50 text-blue-700',
  effective: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

export function StatusControl({ docId, status, inline }: { docId: string; status: string; inline?: boolean }) {
  const router = useRouter()
  const [current, setCurrent] = useState<DocStatus>(
    STATUSES.includes(status as DocStatus) ? (status as DocStatus) : 'draft',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(next: DocStatus) {
    if (next === current || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${docId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Failed to update status.')
        return
      }
      setCurrent(next)
      router.refresh()
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={inline ? 'flex items-center gap-1.5' : ''}>
      {!inline && <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Status</p>}
      {inline && <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">Status</span>}
      <div className={inline ? 'flex flex-wrap gap-1' : 'mt-1 flex flex-wrap gap-1'}>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleChange(s)}
            disabled={loading}
            className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition disabled:opacity-60 ${
              s === current
                ? STATUS_STYLES[s] + ' ring-1 ring-offset-1 ' + ringColor(s)
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {s === current && loading ? (
              <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : s === current ? (
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            ) : null}
            {s}
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function ringColor(s: DocStatus) {
  return {
    draft:     'ring-gray-300',
    review:    'ring-amber-300',
    approved:  'ring-blue-300',
    effective: 'ring-emerald-300',
  }[s]
}
