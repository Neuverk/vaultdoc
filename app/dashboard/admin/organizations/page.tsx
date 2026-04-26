import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { desc, sql } from 'drizzle-orm'
import { OrganizationsClient } from './organizations-client'

export const dynamic = 'force-dynamic'

export default async function AdminOrganizationsPage() {
  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      plan: tenants.plan,
      createdAt: tenants.createdAt,
      stripeSubscriptionStatus: tenants.stripeSubscriptionStatus,
      documentQuotaUsed: tenants.documentQuotaUsed,
      betaDocumentLimit: tenants.betaDocumentLimit,
      betaLimitReachedAt: tenants.betaLimitReachedAt,
      betaLimitEmailSentAt: tenants.betaLimitEmailSentAt,
      archivedAt: tenants.archivedAt,
      userCount: sql<number>`(
        SELECT count(*) FROM users u WHERE u.tenant_id = tenants.id
      )`,
      docCount: sql<number>`(
        SELECT count(*) FROM documents d WHERE d.tenant_id = tenants.id
      )`,
      primaryEmail: sql<string | null>`(
        SELECT u.email FROM users u
        WHERE u.tenant_id = tenants.id
        ORDER BY u.created_at ASC
        LIMIT 1
      )`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt))

  const active = rows.filter((r) => !r.archivedAt)
  const totalUsers = active.reduce((s, r) => s + Number(r.userCount), 0)

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Workspaces</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Workspaces and company accounts using VaultDoc.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {[
              { label: 'Total workspaces', value: active.length },
              { label: 'Paid', value: active.filter((r) => r.plan !== 'free').length },
              { label: 'Free', value: active.filter((r) => r.plan === 'free').length },
              { label: 'Total users', value: totalUsers },
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
        <OrganizationsClient organizations={rows} />
      </div>
    </div>
  )
}
