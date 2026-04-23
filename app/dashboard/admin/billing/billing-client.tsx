'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TenantRow = {
  id: string
  name: string
  slug: string
  plan: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeSubscriptionStatus: string | null
  stripeCurrentPeriodEnd: Date | null
  documentQuotaUsed: number
  createdAt: Date
  primaryEmail: string | null
}

const PLANS = ['free', 'starter', 'enterprise'] as const

export function BillingClient({ tenants }: { tenants: TenantRow[] }) {
  const router = useRouter()
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingPlans, setPendingPlans] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const filtered = tenants.filter((t) => {
    if (planFilter !== 'all' && t.plan !== planFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        t.name.toLowerCase().includes(q) ||
        (t.primaryEmail?.toLowerCase().includes(q) ?? false) ||
        t.slug.toLowerCase().includes(q)
      )
    }
    return true
  })

  async function changePlan(tenantId: string, newPlan: string) {
    setSaving((s) => ({ ...s, [tenantId]: true }))
    try {
      const res = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, newPlan }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error ?? 'Failed to update plan.')
        return
      }
      router.refresh()
    } catch {
      alert('Something went wrong.')
    } finally {
      setSaving((s) => ({ ...s, [tenantId]: false }))
    }
  }

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
          placeholder="Search organization or email…"
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 w-64"
        />
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} org{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_120px] gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Organization</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Stripe status</div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Docs used</div>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No organizations match your filter.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((t) => {
              const isExpanded = expandedId === t.id
              const selectedPlan = pendingPlans[t.id] ?? t.plan
              return (
                <div key={t.id}>
                  <div className="grid items-center gap-4 px-5 py-4 lg:grid-cols-[2fr_1fr_1fr_1fr_120px]">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                      <div className="text-xs text-gray-500 truncate">{t.primaryEmail ?? t.slug}</div>
                    </div>
                    <div><PlanBadge plan={t.plan} /></div>
                    <div>
                      {t.stripeSubscriptionStatus ? (
                        <StripeStatusBadge status={t.stripeSubscriptionStatus} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">{t.documentQuotaUsed} docs</div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 transition"
                      >
                        {isExpanded ? 'Collapse' : 'Manage'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
                        <InfoItem label="Slug" value={t.slug} />
                        <InfoItem label="Created" value={t.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                        {t.stripeCurrentPeriodEnd && (
                          <InfoItem label="Renews" value={t.stripeCurrentPeriodEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
                        )}
                        {t.stripeCustomerId && (
                          <InfoItem label="Stripe customer" value={t.stripeCustomerId} />
                        )}
                        {t.stripeSubscriptionId && (
                          <InfoItem label="Subscription ID" value={t.stripeSubscriptionId.slice(0, 20) + '…'} />
                        )}
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Manual plan override</div>
                        <div className="flex gap-2 items-center flex-wrap">
                          {PLANS.map((p) => (
                            <button
                              key={p}
                              onClick={() => setPendingPlans((prev) => ({ ...prev, [t.id]: p }))}
                              className={`rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                                selectedPlan === p
                                  ? p === 'enterprise'
                                    ? 'bg-violet-100 border-violet-300 text-violet-800'
                                    : p === 'starter'
                                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                                      : 'bg-gray-200 border-gray-300 text-gray-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            disabled={saving[t.id] || selectedPlan === t.plan}
                            onClick={() => changePlan(t.id, selectedPlan)}
                            className="rounded-lg border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-40"
                          >
                            {saving[t.id] ? 'Saving…' : 'Apply'}
                          </button>
                        </div>
                        {selectedPlan !== t.plan && (
                          <p className="mt-2 text-xs text-amber-600">
                            This will change from <strong>{t.plan}</strong> to <strong>{selectedPlan}</strong>. Click Apply to confirm.
                          </p>
                        )}
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
      : status === 'trialing'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : status === 'past_due'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
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
