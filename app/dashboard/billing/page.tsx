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

  const tenant = user ? await db.query.tenants.findFirst({
    where: eq(tenants.id, user.tenantId!),
  }) : null

  const plan = (tenant?.plan ?? 'free') as PlanType
  const planDetails = PLANS[plan]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing & Plan</h1>
          <p className="text-gray-500 mt-1">Manage your subscription and usage.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <p className="text-sm text-gray-500">Current Plan</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">{planDetails.name}</p>
          {tenant?.stripeCurrentPeriodEnd && (
            <p className="text-sm text-gray-500 mt-1">
              Renews {new Date(tenant.stripeCurrentPeriodEnd).toLocaleDateString('de-DE')}
            </p>
          )}
        </div>

        <BillingClient currentPlan={plan} tenantId={tenant?.id ?? ''} />
      </div>
    </div>
  )
}