import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { desc, sql } from 'drizzle-orm'
import { BillingClient } from './billing-client'

export const dynamic = 'force-dynamic'

export default async function AdminBillingPage() {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      plan: tenants.plan,
      stripeCustomerId: tenants.stripeCustomerId,
      stripeSubscriptionId: tenants.stripeSubscriptionId,
      stripeSubscriptionStatus: tenants.stripeSubscriptionStatus,
      stripeCurrentPeriodEnd: tenants.stripeCurrentPeriodEnd,
      stripePriceId: tenants.stripePriceId,
      documentQuotaUsed: tenants.documentQuotaUsed,
      createdAt: tenants.createdAt,
      primaryEmail: sql<string | null>`(
        SELECT u.email FROM users u
        WHERE u.tenant_id = tenants.id
        ORDER BY u.created_at ASC
        LIMIT 1
      )`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt))

  const paid = rows.filter((t) => t.plan !== 'free').length
  const active = rows.filter((t) => t.stripeSubscriptionStatus === 'active').length
  const free = rows.filter((t) => t.plan === 'free').length

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Plans & Billing</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Manage plan assignments for all organizations. Manual overrides take effect immediately.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {[
              { label: 'Total orgs', value: rows.length },
              { label: 'Paid', value: paid },
              { label: 'Stripe active', value: active },
              { label: 'Free', value: free },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-semibold tabular-nums text-gray-900">{s.value}</div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <BillingClient tenants={rows} />
      </div>
    </div>
  )
}
