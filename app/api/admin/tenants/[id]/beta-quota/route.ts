import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { logAdminActivity } from '@/lib/admin-activity'
import { isValidUUID } from '@/lib/validate'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: tenantId } = await params

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? null
  if (!isPlatformAdmin(adminEmail)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!isValidUUID(tenantId)) {
    return NextResponse.json({ error: 'Invalid tenant ID.' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { newLimit, resetUsage } = body as { newLimit?: unknown; resetUsage?: unknown }

  if (
    typeof newLimit !== 'number' ||
    !Number.isInteger(newLimit) ||
    newLimit < 1 ||
    newLimit > 10_000
  ) {
    return NextResponse.json(
      { error: 'newLimit must be an integer between 1 and 10000.' },
      { status: 400 },
    )
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: {
      id: true,
      betaDocumentLimit: true,
      documentQuotaUsed: true,
    },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
  }

  const oldLimit = tenant.betaDocumentLimit
  const oldUsage = tenant.documentQuotaUsed
  const shouldReset = resetUsage === true

  await db
    .update(tenants)
    .set({
      betaDocumentLimit: newLimit,
      ...(shouldReset
        ? {
            documentQuotaUsed: 0,
            betaLimitReachedAt: null,
            betaLimitEmailSentAt: null,
          }
        : {}),
    })
    .where(eq(tenants.id, tenantId))

  await logAdminActivity({
    action: 'beta_quota_updated',
    targetType: 'tenant',
    targetId: tenantId,
    adminEmail,
    note: shouldReset ? 'Usage reset to 0' : null,
    metadata: {
      oldLimit,
      newLimit,
      oldUsage,
      ...(shouldReset ? { usageReset: true, newUsage: 0 } : {}),
    },
  })

  return NextResponse.json({ success: true })
}
