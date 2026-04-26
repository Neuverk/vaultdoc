import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { logAdminActivity } from '@/lib/admin-activity'
import { isValidUUID } from '@/lib/validate'

export async function PATCH(
  _req: NextRequest,
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

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { id: true, name: true, archivedAt: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 })
  }

  if (tenant.archivedAt) {
    return NextResponse.json({ error: 'Workspace is already archived.' }, { status: 409 })
  }

  // Safety check: re-query counts fresh from DB to prevent stale-client bypass
  const [counts] = await db
    .select({
      userCount: sql<number>`(SELECT count(*) FROM users u WHERE u.tenant_id = ${tenantId}::uuid)`,
      docCount: sql<number>`(SELECT count(*) FROM documents d WHERE d.tenant_id = ${tenantId}::uuid)`,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))

  if (Number(counts.userCount) > 0) {
    return NextResponse.json(
      { error: 'Cannot archive a workspace that has users.' },
      { status: 422 },
    )
  }

  if (Number(counts.docCount) > 0) {
    return NextResponse.json(
      { error: 'Cannot archive a workspace that has documents.' },
      { status: 422 },
    )
  }

  await db
    .update(tenants)
    .set({ archivedAt: new Date() })
    .where(eq(tenants.id, tenantId))

  await logAdminActivity({
    action: 'workspace_archived',
    targetType: 'tenant',
    targetId: tenantId,
    adminEmail,
    note: null,
    metadata: { workspaceName: tenant.name },
  })

  return NextResponse.json({ success: true })
}
