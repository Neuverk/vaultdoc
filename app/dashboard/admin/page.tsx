import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tenants, users, documents } from '@/lib/db/schema'
import { isPlatformAdmin } from '@/lib/admin'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { AdminPlanChanger } from './plan-changer'

type TenantRow = {
  id: string
  name: string
  slug: string
  plan: string
  email: string
  docCount: number
  createdAt: Date
  stripeSubscriptionStatus: string | null
}

export default async function AdminPage() {
  const { userId } = await auth()
  if (!userId) return notFound()

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null

  if (!isPlatformAdmin(email)) return notFound()

  const allTenants = await db.query.tenants.findMany()

  const data: TenantRow[] = await Promise.all(
    allTenants.map(async (t) => {
      const user = await db.query.users.findFirst({
        where: eq(users.tenantId, t.id),
      })

      const docs = await db.query.documents.findMany({
        where: eq(documents.tenantId, t.id),
      })

      return {
        id: t.id,
        name: t.name || 'Unnamed tenant',
        slug: t.slug,
        plan: t.plan,
        email: user?.email ?? '—',
        docCount: docs.length,
        createdAt: t.createdAt,
        stripeSubscriptionStatus: t.stripeSubscriptionStatus ?? null,
      }
    }),
  )

  const totalTenants = data.length
  const totalDocuments = data.reduce((sum, tenant) => sum + tenant.docCount, 0)
  const paidTenants = data.filter((tenant) => tenant.plan !== 'free').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                Internal admin
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Admin Panel
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">
                Manage tenants, inspect workspace usage, and manually adjust plans
                for internal testing and support.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-600">
                Signed in as
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {email ?? '—'}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Tenants" value={String(totalTenants)} />
          <SummaryCard label="Documents" value={String(totalDocuments)} />
          <SummaryCard label="Paid tenants" value={String(paidTenants)} />
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Tenant overview
                </h2>
                <p className="mt-1 text-sm text-gray-700">
                  Review workspace ownership, document volume, and plan assignment.
                </p>
              </div>

              <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                {totalTenants} tenant{totalTenants !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {data.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                      {tenant.name}
                    </h3>
                    <PlanBadge plan={tenant.plan} />
                    {tenant.stripeSubscriptionStatus && (
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium capitalize text-gray-700">
                        {tenant.stripeSubscriptionStatus}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <InfoItem label="Slug" value={tenant.slug} />
                    <InfoItem label="Primary email" value={tenant.email} />
                    <InfoItem
                      label="Documents"
                      value={`${tenant.docCount} document${tenant.docCount !== 1 ? 's' : ''}`}
                    />
                    <InfoItem
                      label="Created"
                      value={tenant.createdAt.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    />
                  </div>
                </div>

                <div className="w-full lg:w-auto">
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-gray-600">
                      Plan control
                    </p>
                    <AdminPlanChanger tenantId={tenant.id} currentPlan={tenant.plan} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-600">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
        {value}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-600">
        {label}
      </div>
      <div className="mt-1 wrap-break-word text-sm font-medium text-gray-900">
        {value}
      </div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const styles =
    plan === 'enterprise'
      ? 'border-violet-200 bg-violet-50 text-violet-700'
      : plan === 'starter'
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-gray-200 bg-gray-50 text-gray-600'

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${styles}`}
    >
      {plan}
    </span>
  )
}

