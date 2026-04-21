'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BetaRequest = {
  id: string
  name: string
  email: string
  company: string
  useCase: string | null
  status: string
  createdAt: Date
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function BetaRequestsClient({ requests }: { requests: BetaRequest[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  const filtered =
    filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? 'Action failed.')
        return
      }
      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              filter === f
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
            <span className="ml-1 text-xs text-gray-400">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No {filter === 'all' ? '' : filter} requests.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {r.name}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="text-sm text-gray-600">{r.email}</div>
                  <div className="text-xs text-gray-500">{r.company}</div>
                  {r.useCase && (
                    <div className="max-w-sm truncate text-xs text-gray-400" title={r.useCase}>
                      {r.useCase}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={loading[r.id]}
                      onClick={() => handleAction(r.id, 'approve')}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      disabled={loading[r.id]}
                      onClick={() => handleAction(r.id, 'reject')}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'approved'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'rejected'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-amber-200 bg-amber-50 text-amber-700'

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${styles}`}
    >
      {status}
    </span>
  )
}
