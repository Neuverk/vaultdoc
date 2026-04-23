'use client'

import { useState } from 'react'

type OrgRow = {
  id: string
  name: string
  slug: string
  plan: string
  createdAt: Date
  stripeSubscriptionStatus: string | null
  documentQuotaUsed: number
  userCount: number
  docCount: number
  primaryEmail: string | null
}

export function OrganizationsClient({ organizations }: { organizations: OrgRow[] }) {
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = organizations.filter((o) => {
    if (planFilter !== 'all' && o.plan !== planFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        o.name.toLowerCase().includes(q) ||
        (o.primaryEmail?.toLowerCase().includes(q) ?? false) ||
        o.slug.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 w-fit">
          {['all', 'free', 'starter', 'enterprise'].map((p) => (
            <button
              key={p}
              onClick={() => setPlanFilter(p)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition capitalize ${
                planFilter === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organization…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-56"
        />
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} organization{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_80px_80px_1fr_120px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Organization</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Users</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Docs</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Stripe</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Created</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No organizations match your filter.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((o) => {
              const isExpanded = expandedId === o.id
              return (
                <div key={o.id}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    <div className="grid items-center gap-4 px-5 py-4 hover:bg-gray-50 transition lg:grid-cols-[2fr_1fr_80px_80px_1fr_120px]">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{o.name}</div>
                        <div className="text-xs text-gray-500 truncate">{o.primaryEmail ?? o.slug}</div>
                      </div>
                      <div><PlanBadge plan={o.plan} /></div>
                      <div className="text-sm font-medium text-gray-700">{Number(o.userCount)}</div>
                      <div className="text-sm font-medium text-gray-700">{Number(o.docCount)}</div>
                      <div>
                        {o.stripeSubscriptionStatus ? (
                          <StripeStatusBadge status={o.stripeSubscriptionStatus} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
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
                        <InfoItem label="Docs (quota)" value={String(o.documentQuotaUsed)} />
                        <InfoItem label="Users" value={String(Number(o.userCount))} />
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`/dashboard/admin/billing`}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          Manage plan →
                        </a>
                        <a
                          href={`/dashboard/admin/users`}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          View users →
                        </a>
                      </div>
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

function StripeStatusBadge({ status }: { status: string }) {
  const cls =
    status === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace('_', ' ')}
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
