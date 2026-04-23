import { db } from '@/lib/db'
import { users, tenants, documents } from '@/lib/db/schema'
import { desc, eq, count } from 'drizzle-orm'
import { UsersClient } from './users-client'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      isActive: users.isActive,
      blocked: users.blocked,
      internalNote: users.internalNote,
      createdAt: users.createdAt,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      tenantPlan: tenants.plan,
      docCount: count(documents.id),
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .leftJoin(documents, eq(documents.createdBy, users.id))
    .groupBy(users.id, tenants.name, tenants.plan)
    .orderBy(desc(users.createdAt))

  const total = rows.length
  const blocked = rows.filter((u) => u.blocked).length
  const paid = rows.filter((u) => u.tenantPlan && u.tenantPlan !== 'free').length

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Users</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              All registered users across every organization.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {[
              { label: 'Total', value: total },
              { label: 'Paid plan', value: paid },
              { label: 'Blocked', value: blocked },
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
        <UsersClient users={rows} />
      </div>
    </div>
  )
}
