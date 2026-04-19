import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/plans'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    columns: { tenantId: true },
  })

  if (!dbUser) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (email) {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { tenantId: true },
      }) ?? undefined
    }
  }

  if (!dbUser?.tenantId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, dbUser.tenantId),
    columns: { plan: true, documentQuotaUsed: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const planKey = tenant.plan as keyof typeof PLANS
  const maxDocuments = PLANS[planKey]?.maxDocuments ?? 3
  const quotaUsed = tenant.documentQuotaUsed ?? 0
  const limit = maxDocuments === Infinity ? null : maxDocuments
  const isAtLimit = maxDocuments !== Infinity && quotaUsed >= maxDocuments

  return NextResponse.json({ plan: tenant.plan, quotaUsed, limit, isAtLimit })
}
