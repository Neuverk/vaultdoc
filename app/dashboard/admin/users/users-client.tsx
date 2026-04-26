'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type UserRow = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  isActive: boolean | null
  blocked: boolean | null
  internalNote: string | null
  createdAt: Date
  tenantId: string | null
  tenantName: string | null
  tenantPlan: string | null
  docCount: number
  deletedAt: Date | null
  deletionScheduledFor: Date | null
  deletedBy: string | null
}

type Filter = 'active' | 'blocked' | 'deleted' | 'all'

export function UsersClient({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('active')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteInputs, setNoteInputs] = useState<Record<string, string | undefined>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [deletionReason, setDeletionReason] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = users
    .filter((u) => {
      if (filter === 'active') return !u.blocked && !u.deletedAt
      if (filter === 'blocked') return !!u.blocked && !u.deletedAt
      if (filter === 'deleted') return !!u.deletedAt
      return true
    })
    .filter((u) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        u.email.toLowerCase().includes(q) ||
        (u.firstName?.toLowerCase().includes(q) ?? false) ||
        (u.lastName?.toLowerCase().includes(q) ?? false) ||
        (u.tenantName?.toLowerCase().includes(q) ?? false)
      )
    })

  const counts = {
    active: users.filter((u) => !u.blocked && !u.deletedAt).length,
    blocked: users.filter((u) => !!u.blocked && !u.deletedAt).length,
    deleted: users.filter((u) => !!u.deletedAt).length,
    all: users.length,
  }

  async function toggleBlock(id: string, currentlyBlocked: boolean) {
    setSaving((s) => ({ ...s, [id]: true }))
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: currentlyBlocked ? 'unblock' : 'block' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error ?? 'Action failed.')
        return
      }
      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setSaving((s) => ({ ...s, [id]: false }))
    }
  }

  async function saveNote(id: string) {
    const note = noteInputs[id]?.trim() ?? ''
    setSaving((s) => ({ ...s, [`note-${id}`]: true }))
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'note', note }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error ?? 'Failed to save note.')
        return
      }
      router.refresh()
      setExpandedId(null)
    } catch {
      alert('Something went wrong.')
    } finally {
      setSaving((s) => ({ ...s, [`note-${id}`]: false }))
    }
  }

  async function scheduleDeletion(id: string) {
    const note = deletionReason[id]?.trim() || undefined
    setSaving((s) => ({ ...s, [`delete-${id}`]: true }))
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule-deletion', note }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error ?? 'Failed to schedule deletion.')
        return
      }
      setConfirmDelete(null)
      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setSaving((s) => ({ ...s, [`delete-${id}`]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {(['active', 'blocked', 'deleted', 'all'] as Filter[]).map((f) => (
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
          placeholder="Search user or workspace…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-64"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[1fr_1fr_120px_80px_80px_100px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">User</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Workspace</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Docs</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Status</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const isExpanded = expandedId === u.id
              const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
              const isDeleted = !!u.deletedAt
              return (
                <div key={u.id} className={isDeleted ? 'opacity-60' : undefined}>
                  <div className="grid items-center gap-4 px-5 py-4 lg:grid-cols-[1fr_1fr_120px_80px_80px_100px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 truncate">{displayName}</span>
                        {isDeleted && (
                          <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-200">
                            Deleted
                          </span>
                        )}
                        {!isDeleted && u.blocked && (
                          <span className="text-[10px] font-semibold rounded px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200">
                            Blocked
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      <div className="text-[11px] text-gray-400 capitalize">{u.role}</div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm text-gray-800 truncate">{u.tenantName ?? '—'}</div>
                    </div>

                    <div>
                      <PlanBadge plan={u.tenantPlan ?? 'free'} />
                    </div>

                    <div className="text-sm text-gray-700 font-medium">{u.docCount}</div>

                    <div>
                      {isDeleted
                        ? <span className="text-xs text-orange-600 font-medium">Deleted</span>
                        : u.blocked
                          ? <span className="text-xs text-red-600 font-medium">Blocked</span>
                          : <span className="text-xs text-emerald-600 font-medium">Active</span>
                      }
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : u.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        {isExpanded ? 'Collapse' : 'Manage'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                        <InfoItem label="Joined" value={u.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                        <InfoItem label="Role" value={u.role} />
                        <InfoItem label="Tenant ID" value={u.tenantId ? u.tenantId.slice(0, 8) + '…' : '—'} />
                        <InfoItem label="Documents" value={String(u.docCount)} />
                      </div>

                      {isDeleted && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 space-y-2">
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-orange-600">Deletion info</div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 text-sm">
                            <InfoItem
                              label="Deleted at"
                              value={u.deletedAt!.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            />
                            <InfoItem
                              label="Purge scheduled"
                              value={u.deletionScheduledFor
                                ? u.deletionScheduledFor.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—'}
                            />
                            <InfoItem label="Deleted by" value={u.deletedBy ?? '—'} />
                          </div>
                        </div>
                      )}

                      {u.internalNote && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Internal note</div>
                          <p className="text-sm text-gray-700">{u.internalNote}</p>
                        </div>
                      )}

                      {!isDeleted && (
                        <>
                          <div>
                            <label className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 block mb-1">
                              {u.internalNote ? 'Update note' : 'Add internal note'}
                            </label>
                            <div className="flex gap-2 items-start">
                              <textarea
                                rows={2}
                                value={noteInputs[u.id] ?? (u.internalNote ?? '')}
                                onChange={(e) => setNoteInputs((n) => ({ ...n, [u.id]: e.target.value }))}
                                placeholder="Internal note about this user…"
                                className="flex-1 max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100"
                              />
                              <button
                                disabled={saving[`note-${u.id}`]}
                                onClick={() => saveNote(u.id)}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                              >
                                {saving[`note-${u.id}`] ? 'Saving…' : 'Save note'}
                              </button>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              disabled={saving[u.id]}
                              onClick={() => toggleBlock(u.id, !!u.blocked)}
                              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                                u.blocked
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {saving[u.id]
                                ? 'Working…'
                                : u.blocked
                                  ? 'Unblock user'
                                  : 'Block user'}
                            </button>

                            {confirmDelete !== u.id ? (
                              <button
                                onClick={() => setConfirmDelete(u.id)}
                                className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition"
                              >
                                Schedule deletion
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 max-w-sm">
                                <p className="text-xs font-semibold text-orange-700">
                                  This will block the user and schedule their data for permanent deletion in 7 days. This cannot be undone from the UI.
                                </p>
                                <textarea
                                  rows={2}
                                  value={deletionReason[u.id] ?? ''}
                                  onChange={(e) => setDeletionReason((d) => ({ ...d, [u.id]: e.target.value }))}
                                  placeholder="Reason (optional)…"
                                  className="rounded-md border border-orange-200 bg-white px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-orange-300"
                                />
                                <div className="flex gap-2">
                                  <button
                                    disabled={saving[`delete-${u.id}`]}
                                    onClick={() => scheduleDeletion(u.id)}
                                    className="rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 transition disabled:opacity-50"
                                  >
                                    {saving[`delete-${u.id}`] ? 'Scheduling…' : 'Confirm deletion'}
                                  </button>
                                  <button
                                    onClick={() => { setConfirmDelete(null); setDeletionReason((d) => ({ ...d, [u.id]: '' })) }}
                                    className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {u.blocked && (
                            <p className="text-xs text-red-600">
                              This user is blocked. They cannot generate documents or access protected features.
                            </p>
                          )}
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
      <div className="text-sm text-gray-800 mt-0.5">{value}</div>
    </div>
  )
}
