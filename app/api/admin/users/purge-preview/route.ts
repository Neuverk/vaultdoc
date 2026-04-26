/**
 * GET /api/admin/users/purge-preview
 *
 * READ-ONLY preview of users eligible for permanent deletion.
 * Returns users whose deletionScheduledFor timestamp has passed.
 *
 * Does NOT delete anything. A permanent purge would need to:
 *   1. Delete all documents belonging to the user's tenant (if sole user).
 *   2. Delete approvals referencing those documents.
 *   3. Nullify audit_log.user_id FK references (GDPR pseudonymisation).
 *   4. Delete the user row.
 *   5. If sole user of tenant: delete the tenant row.
 *   6. Call clerk.users.deleteUser(user.clerkId) — do this last.
 *
 * Run this endpoint first, review the output, then implement the actual purge
 * as a one-shot admin action or scheduled job — never automatically.
 */
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { isPlatformAdmin } from '@/lib/admin'
import { isNull, lt, and, isNotNull } from 'drizzle-orm'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? null
  if (!isPlatformAdmin(adminEmail)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()

  const eligible = await db.query.users.findMany({
    where: and(
      isNotNull(users.deletedAt),
      isNotNull(users.deletionScheduledFor),
      lt(users.deletionScheduledFor, now),
    ),
    columns: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      tenantId: true,
      deletedAt: true,
      deletionScheduledFor: true,
      deletionReason: true,
      deletedBy: true,
    },
  })

  return NextResponse.json({
    count: eligible.length,
    users: eligible,
    note: 'This is a read-only preview. No data has been deleted. Review before implementing permanent purge.',
  })
}
