import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { PLANS } from '@/lib/plans'
import { bootstrapUser } from '@/lib/bootstrap-user'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bootstrapped = await bootstrapUser({
    clerkUserId: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  if (!bootstrapped) {
    return NextResponse.json({ error: 'Unable to initialize user account.' }, { status: 500 })
  }

  const { tenant } = bootstrapped
  const planKey = tenant.plan as keyof typeof PLANS
  const maxDocuments = PLANS[planKey]?.maxDocuments ?? 3
  const quotaUsed = tenant.documentQuotaUsed ?? 0
  const limit = maxDocuments === Infinity ? null : maxDocuments
  const isAtLimit = maxDocuments !== Infinity && quotaUsed >= maxDocuments

  return NextResponse.json({ plan: tenant.plan, quotaUsed, limit, isAtLimit })
}
