import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { bootstrapUser } from '@/lib/bootstrap-user'
import { BETA_DEFAULT_LIMIT } from '@/lib/beta-quota'

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
  const quotaUsed = tenant.documentQuotaUsed ?? 0
  const limit = tenant.betaDocumentLimit ?? BETA_DEFAULT_LIMIT
  const remaining = Math.max(0, limit - quotaUsed)
  const isAtLimit = quotaUsed >= limit

  return NextResponse.json({
    plan: tenant.plan,
    quotaUsed,
    limit,
    remaining,
    isAtLimit,
    isBetaQuota: true,
  })
}
