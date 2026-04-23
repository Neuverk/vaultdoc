import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { desc, eq, gte, sql } from 'drizzle-orm'
import { DocumentsClient } from './documents-client'

export const dynamic = 'force-dynamic'

export default async function AdminDocumentsPage() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [rows, [{ docsToday }], [{ docsWeek }], [{ docsMonth }]] = await Promise.all([
    db
      .select({
        id: documents.id,
        title: documents.title,
        type: documents.type,
        status: documents.status,
        language: documents.language,
        department: documents.department,
        frameworks: documents.frameworks,
        createdAt: documents.createdAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        tenantName: tenants.name,
        tenantPlan: tenants.plan,
      })
      .from(documents)
      .leftJoin(users, eq(documents.createdBy, users.id))
      .leftJoin(tenants, eq(documents.tenantId, tenants.id))
      .orderBy(desc(documents.createdAt)),
    db.select({ docsToday: sql<number>`count(*)` }).from(documents).where(gte(documents.createdAt, today)),
    db.select({ docsWeek: sql<number>`count(*)` }).from(documents).where(gte(documents.createdAt, sevenDaysAgo)),
    db.select({ docsMonth: sql<number>`count(*)` }).from(documents).where(gte(documents.createdAt, thirtyDaysAgo)),
  ])

  const total = rows.length

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Documents</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              All generated documents across all organizations and plans.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {[
              { label: 'Total', value: total },
              { label: 'Today', value: Number(docsToday) },
              { label: 'This week', value: Number(docsWeek) },
              { label: 'This month', value: Number(docsMonth) },
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
        <DocumentsClient documents={rows} />
      </div>
    </div>
  )
}
