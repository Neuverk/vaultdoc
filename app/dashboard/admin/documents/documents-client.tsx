'use client'

import { useState, useMemo } from 'react'

type DocRow = {
  id: string
  title: string
  type: string
  status: string
  language: string | null
  department: string
  frameworks: string[] | null
  createdAt: Date
  userEmail: string | null
  userFirstName: string | null
  userLastName: string | null
  tenantName: string | null
  tenantPlan: string | null
}

const DOC_STATUSES = ['all', 'draft', 'review', 'approved', 'effective'] as const
type StatusFilter = (typeof DOC_STATUSES)[number]

export function DocumentsClient({ documents }: { documents: DocRow[] }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const plans = useMemo(() => {
    const s = new Set<string>()
    documents.forEach((d) => { if (d.tenantPlan) s.add(d.tenantPlan) })
    return ['all', ...Array.from(s).sort()]
  }, [documents])

  const filtered = documents.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (planFilter !== 'all' && d.tenantPlan !== planFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        d.title.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        (d.userEmail?.toLowerCase().includes(q) ?? false) ||
        (d.tenantName?.toLowerCase().includes(q) ?? false)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {DOC_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition capitalize ${
                statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-gray-300"
        >
          {plans.map((p) => (
            <option key={p} value={p}>
              {p === 'all' ? 'All plans' : p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-56"
        />

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_120px_80px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Document</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Owner</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Organization</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Created</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No documents match the current filters.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((d) => {
              const isExpanded = expandedId === d.id
              return (
                <div key={d.id}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  >
                    <div className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 transition lg:grid-cols-[2fr_1fr_1fr_1fr_120px_80px]">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{d.title}</div>
                        <div className="text-xs text-gray-500">{d.type}{d.language && d.language !== 'English' ? ` · ${d.language}` : ''}</div>
                      </div>
                      <div className="text-sm text-gray-700 truncate">{d.userEmail ?? '—'}</div>
                      <div className="text-sm text-gray-700 truncate">{d.tenantName ?? '—'}</div>
                      <div><PlanBadge plan={d.tenantPlan ?? 'free'} /></div>
                      <div className="text-sm text-gray-600">
                        {d.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div><StatusBadge status={d.status} /></div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                        <InfoItem label="Department" value={d.department} />
                        <InfoItem label="Language" value={d.language ?? 'English'} />
                        <InfoItem label="Status" value={d.status} />
                        <InfoItem label="Document ID" value={d.id.slice(0, 8) + '…'} />
                      </div>
                      {d.frameworks && d.frameworks.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Frameworks</div>
                          <div className="flex flex-wrap gap-1">
                            {d.frameworks.map((f) => (
                              <span key={f} className="inline-flex rounded px-2 py-0.5 text-xs bg-gray-100 text-gray-700 border border-gray-200">{f}</span>
                            ))}
                          </div>
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

function PlanBadge({ plan }: { plan: string }) {
  const cls =
    plan === 'enterprise'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : plan === 'starter'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>{plan}</span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'effective'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'approved'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : status === 'review'
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>{status}</span>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="text-sm text-gray-800 mt-0.5 capitalize">{value}</div>
    </div>
  )
}
