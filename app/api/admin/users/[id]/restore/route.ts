import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { isPlatformAdmin } from '@/lib/admin'
import { logAdminActivity } from '@/lib/admin-activity'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null

  if (!isPlatformAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, id),
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }

  if (!user.deletedAt) {
    return NextResponse.json({ error: 'User is not deleted.' }, { status: 400 })
  }

  await db
    .update(users)
    .set({
      deletedAt: null,
      deletionScheduledFor: null,
      deletionReason: null,
      deletedBy: null,
      blocked: false,
    })
    .where(eq(users.id, id))

  await logAdminActivity({
    action: 'user_restored',
    targetType: 'user',
    targetId: id,
    targetEmail: user.email,
    adminEmail,
    note: 'User restored by admin',
  })

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/activity')

  return NextResponse.json({ success: true })
}