'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OrgRow = {
  id: string
  name: string
  slug: string
  plan: string
  createdAt: Date
  stripeSubscriptionStatus: string | null
  documentQuotaUsed: number
  betaDocumentLimit: number
  betaLimitReachedAt: Date | null
  betaLimitEmailSentAt: Date | null
  archivedAt: Date | null
  userCount: number
  docCount: number
  primaryEmail: string | null
}

type WorkspaceType = 'orphan' | 'personal' | 'company'
type WorkspaceStatus = 'active' | 'no-users' | 'needs-review' | 'archived'
type WorkspaceFilter = 'all' | 'active' | 'no-users' | 'needs-review' | 'personal' | 'company' | 'archived'

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'icloud.com', 'proton.me', 'protonmail.com', 'gmx.de', 'web.de',
])

function getType(o: OrgRow): WorkspaceType {
  if (Number(o.userCount) === 0) return 'orphan'
  const domain = (o.primaryEmail ?? '').split('@')[1]?.toLowerCase() ?? ''
  return PERSONAL_DOMAINS.has(domain) ? 'personal' : 'company'
}

function getStatus(o: OrgRow): WorkspaceStatus {
  if (o.archivedAt) return 'archived'
  if (Number(o.userCount) > 0) return 'active'
  if (Number(o.docCount) > 0) return 'needs-review'
  return 'no-users'
}

const FILTER_LABELS: Record<WorkspaceFilter, string> = {
  all: 'All',
  active: 'Active',
  'no-users': 'No users',
  'needs-review': 'Needs review',
  personal: 'Personal',
  company: 'Company',
  archived: 'Archived',
}

export function OrganizationsClient({ organizations }: { organizations: OrgRow[] }) {
  const router = useRouter()
  const [wsFilter, setWsFilter] = useState<WorkspaceFilter>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = organizations
    .filter((o) => {
      const status = getStatus(o)
      if (status === 'archived' && wsFilter !== 'archived') return false
      switch (wsFilter) {
        case 'all': return true
        case 'active': return status === 'active'
        case 'no-users': return status === 'no-users'
        case 'needs-review': return status === 'needs-review'
        case 'personal': return getType(o) === 'personal'
        case 'company': return getType(o) === 'company'
        case 'archived': return status === 'archived'
      }
    })
    .filter((o) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        o.name.toLowerCase().includes(q) ||
        (o.primaryEmail?.toLowerCase().includes(q) ?? false) ||
        o.slug.toLowerCase().includes(q)
      )
    })

  // Badge counts for filter pills (non-archived only, except the archived pill itself)
  const counts: Record<WorkspaceFilter, number> = {
    all: organizations.filter((o) => !o.archivedAt).length,
    active: organizations.filter((o) => getStatus(o) === 'active').length,
    'no-users': organizations.filter((o) => getStatus(o) === 'no-users').length,
    'needs-review': organizations.filter((o) => getStatus(o) === 'needs-review').length,
    personal: organizations.filter((o) => getType(o) === 'personal').length,
    company: organizations.filter((o) => getType(o) === 'company').length,
    archived: organizations.filter((o) => !!o.archivedAt).length,
  }

  return (
    <div className="space-y-4">
      {/* Filter + Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {(Object.keys(FILTER_LABELS) as WorkspaceFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setWsFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${
                wsFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {FILTER_LABELS[f]}
              {counts[f] > 0 && (
                <span className={`ml-1.5 text-xs tabular-nums ${wsFilter === f ? 'text-gray-500' : 'text-gray-400'}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workspace…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-52"
        />
        <span className="text-xs text-gray-400 ml-auto">
          {filtered.length} workspace{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[2fr_80px_60px_60px_70px_100px_110px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Workspace / Company</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Type</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Users</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Docs</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Created</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No workspaces match your filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((o) => {
              const isExpanded = expandedId === o.id
              const wsType = getType(o)
              const wsStatus = getStatus(o)
              const isArchived = wsStatus === 'archived'
              return (
                <div key={o.id} className={isArchived ? 'opacity-60' : undefined}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    <div className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 transition lg:grid-cols-[2fr_80px_60px_60px_70px_100px_110px]">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{o.name}</div>
                        <div className="text-xs text-gray-500 truncate">{o.primaryEmail ?? o.slug}</div>
                      </div>
                      <div><TypeBadge type={wsType} /></div>
                      <div className="text-sm font-medium text-gray-700">{Number(o.userCount)}</div>
                      <div className="text-sm font-medium text-gray-700">{Number(o.docCount)}</div>
                      <div><PlanBadge plan={o.plan} /></div>
                      <div><StatusBadge status={wsStatus} /></div>
                      <div className="text-sm text-gray-500">
                        {o.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <InfoItem label="Slug" value={o.slug} />
                        <InfoItem label="Tenant ID" value={o.id.slice(0, 8) + '…'} />
                        <InfoItem label="Quota used" value={`${o.documentQuotaUsed} / ${o.betaDocumentLimit}`} />
                        <InfoItem label="Users" value={String(Number(o.userCount))} />
                      </div>

                      {isArchived ? (
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
                          Archived {o.archivedAt!.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      ) : (
                        <>
                          <BetaQuotaEditor org={o} />
                          <div className="flex flex-wrap gap-2 items-center">
                            <a
                              href="/dashboard/admin/billing"
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                              Manage plan →
                            </a>
                            <a
                              href="/dashboard/admin/users"
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                              View users →
                            </a>
                            {Number(o.userCount) === 0 && Number(o.docCount) === 0 && (
                              <ArchiveButton tenantId={o.id} onSuccess={() => router.refresh()} />
                            )}
                          </div>
                        </>
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

// ─── Archive button with inline confirmation ──────────────────────────────────

function ArchiveButton({ tenantId, onSuccess }: { tenantId: string; onSuccess: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleArchive() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/archive`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Archive failed.')
        setConfirming(false)
      } else {
        onSuccess()
      }
    } catch {
      setError('Network error.')
      setConfirming(false)
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Archive this workspace?</span>
        <button
          onClick={handleArchive}
          disabled={loading}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
        >
          {loading ? 'Archiving…' : 'Confirm'}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null) }}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-700 transition"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 hover:border-red-200 hover:text-red-600 transition"
    >
      Archive
    </button>
  )
}

// ─── Beta quota editor ────────────────────────────────────────────────────────

const QUICK_LIMITS = [25, 50, 100, 999]

function BetaQuotaEditor({ org }: { org: OrgRow }) {
  const used = Number(org.documentQuotaUsed)
  const currentLimit = Number(org.betaDocumentLimit)
  const remaining = Math.max(0, currentLimit - used)

  const [newLimit, setNewLimit] = useState<number>(currentLimit)
  const [customInput, setCustomInput] = useState('')
  const [resetUsage, setResetUsage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const isDirty = newLimit !== currentLimit || resetUsage

  async function handleSave() {
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch(`/api/admin/tenants/${org.id}/beta-quota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newLimit, resetUsage }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ ok: true, msg: 'Saved.' })
        setResetUsage(false)
      } else {
        setResult({ ok: false, msg: data?.error ?? 'Save failed.' })
      }
    } catch {
      setResult({ ok: false, msg: 'Network error.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Beta quota</div>
        {org.betaLimitReachedAt && (
          <span className="text-[11px] text-amber-600 font-medium">
            Limit reached {new Date(org.betaLimitReachedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <span className="font-semibold text-gray-900">{used}</span>
          <span className="text-gray-400"> used</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">{currentLimit}</span>
          <span className="text-gray-400"> limit</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">{remaining}</span>
          <span className="text-gray-400"> remaining</span>
        </div>
        {org.betaLimitEmailSentAt && (
          <div className="text-[11px] text-gray-400 self-center">
            Limit email sent {new Date(org.betaLimitEmailSentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium">Set limit:</span>
        {QUICK_LIMITS.map((l) => (
          <button
            key={l}
            onClick={() => { setNewLimit(l); setCustomInput('') }}
            className={`rounded-lg border px-3 py-1 text-sm font-medium transition ${
              newLimit === l
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            {l}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={10000}
          value={customInput}
          onChange={(e) => {
            setCustomInput(e.target.value)
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n) && n >= 1 && n <= 10000) setNewLimit(n)
          }}
          placeholder="Custom"
          className="w-20 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={resetUsage}
          onChange={(e) => setResetUsage(e.target.checked)}
          className="rounded border-gray-300 text-gray-900"
        />
        Reset usage to 0 (clears limit-reached flags)
      </label>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {result && (
          <span className={`text-xs font-medium ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {result.msg}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: WorkspaceType }) {
  if (type === 'orphan') {
    return (
      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-400">
        No users
      </span>
    )
  }
  if (type === 'personal') {
    return (
      <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
        Personal
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      Company
    </span>
  )
}

function StatusBadge({ status }: { status: WorkspaceStatus }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  }
  if (status === 'needs-review') {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        Needs review
      </span>
    )
  }
  if (status === 'archived') {
    return (
      <span className="inline-flex rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-400">
        Archived
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
      No users
    </span>
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
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {plan}
    </span>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="text-sm text-gray-800 mt-0.5 break-all">{value}</div>
    </div>
  )
}
