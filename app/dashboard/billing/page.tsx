import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { tenants, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { PLANS, PlanType } from '@/lib/plans'
import { BillingClient } from './billing-client'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  const tenant = user
    ? await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId!),
      })
    : null

  const plan = (tenant?.plan ?? 'free') as PlanType
  const planDetails = PLANS[plan]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                Billing workspace
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Billing &amp; Plan
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Manage your subscription, review your current plan, and upgrade your
                workspace when you need more document capacity and features.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Current plan
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {planDetails.name}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Billing status
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {tenant?.stripeCurrentPeriodEnd ? 'Active subscription' : 'No renewal set'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Current Plan</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-gray-900">
                {planDetails.name}
              </p>

              {tenant?.stripeCurrentPeriodEnd && (
                <p className="mt-2 text-sm text-gray-600">
                  Renews{' '}
                  {new Date(tenant.stripeCurrentPeriodEnd).toLocaleDateString('de-DE')}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                Workspace plan
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                {plan}
              </div>
            </div>
          </div>
        </section>

        <BillingClient currentPlan={plan} tenantId={tenant?.id ?? ''} />
      </div>
    </div>
  )
}