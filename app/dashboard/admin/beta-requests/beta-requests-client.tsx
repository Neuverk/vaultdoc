'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BetaRequest = {
  id: string
  name: string
  email: string
  company: string
  position: string | null
  useCase: string | null
  status: string
  createdAt: Date
  reviewedAt: Date | null
  reviewNote: string | null
}

type Filter = 'all' | 'pending' | 'approved' | 'rejected'

export function BetaRequestsClient({ requests }: { requests: BetaRequest[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('pending')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [resendLoading, setResendLoading] = useState<Record<string, boolean>>({})
  const [resendResult, setResendResult] = useState<Record<string, { ok: boolean; message: string }>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  const filtered = requests
    .filter((r) => (filter === 'all' ? true : r.status === filter))
    .filter((r) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q)
      )
    })

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    const note = noteInputs[id]?.trim() || undefined
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert((data as { error?: string }).error ?? 'Action failed.')
        return
      }
      setExpandedId(null)
      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  async function handleResend(id: string) {
    setResendLoading((l) => ({ ...l, [id]: true }))
    setResendResult((r) => ({ ...r, [id]: { ok: true, message: '' } }))
    try {
      const res = await fetch(`/api/admin/beta-requests/${id}/resend-invite`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({})) as { success?: boolean; error?: string; emailType?: string }
      if (!res.ok) {
        setResendResult((r) => ({
          ...r,
          [id]: { ok: false, message: data.error ?? 'Resend failed.' },
        }))
        return
      }
      const label = data.emailType === 'signin' ? 'Sign-in email sent.' : 'Invitation email sent.'
      setResendResult((r) => ({ ...r, [id]: { ok: true, message: label } }))
    } catch {
      setResendResult((r) => ({ ...r, [id]: { ok: false, message: 'Something went wrong.' } }))
    } finally {
      setResendLoading((l) => ({ ...l, [id]: false }))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter + Search bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}{' '}
              <span className="ml-1 text-xs text-gray-400">{counts[f]}</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, company…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-64"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_140px_120px_100px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Applicant</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Company / Role</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Submitted</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            {search ? 'No results match your search.' : `No ${filter === 'all' ? '' : filter} requests.`}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((r) => {
              const isExpanded = expandedId === r.id
              return (
                <div key={r.id}>
                  <div className="grid items-center gap-4 px-5 py-4 lg:grid-cols-[1fr_1fr_140px_120px_100px]">
                    {/* Applicant */}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{r.name}</div>
                      <div className="text-xs text-gray-500 truncate">{r.email}</div>
                    </div>

                    {/* Company / Role */}
                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 truncate">{r.company}</div>
                      {r.position && (
                        <div className="text-xs text-gray-500 truncate">{r.position}</div>
                      )}
                    </div>

                    {/* Submitted */}
                    <div className="text-sm text-gray-600">
                      {r.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Status */}
                    <div>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        {isExpanded ? 'Collapse' : 'Details'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                      {r.useCase && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Use case</div>
                          <p className="text-sm text-gray-700 leading-relaxed max-w-2xl">{r.useCase}</p>
                        </div>
                      )}

                      {r.reviewNote && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Review note</div>
                          <p className="text-sm text-gray-700">{r.reviewNote}</p>
                        </div>
                      )}

                      {r.reviewedAt && (
                        <div className="text-xs text-gray-400">
                          Reviewed {r.reviewedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      )}

                      {r.status === 'pending' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">
                              Internal note (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={noteInputs[r.id] ?? ''}
                              onChange={(e) => setNoteInputs((n) => ({ ...n, [r.id]: e.target.value }))}
                              placeholder="Add a note before approving or rejecting…"
                              className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={loading[r.id]}
                              onClick={() => handleAction(r.id, 'approve')}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {loading[r.id] ? 'Processing…' : 'Approve & invite'}
                            </button>
                            <button
                              disabled={loading[r.id]}
                              onClick={() => handleAction(r.id, 'reject')}
                              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {r.status === 'approved' && (
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            disabled={resendLoading[r.id]}
                            onClick={() => handleResend(r.id)}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                          >
                            {resendLoading[r.id] ? 'Sending…' : 'Resend invite'}
                          </button>
                          {resendResult[r.id]?.message && (
                            <span className={`text-sm font-medium ${resendResult[r.id].ok ? 'text-emerald-600' : 'text-red-600'}`}>
                              {resendResult[r.id].message}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'approved'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'rejected'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  )
}
