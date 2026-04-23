import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { logAdminActivity } from '@/lib/admin-activity'
import { revalidatePath } from 'next/cache'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null
  if (!isPlatformAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { action?: string; note?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { action, note } = body

  if (!action || !['block', 'unblock', 'note'].includes(action)) {
    return NextResponse.json({ error: 'action must be "block", "unblock", or "note".' }, { status: 400 })
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  if (action === 'block' || action === 'unblock') {
    const blocked = action === 'block'
    await db.update(users).set({ blocked }).where(eq(users.id, id))

    await logAdminActivity({
      action: blocked ? 'user_blocked' : 'user_unblocked',
      targetType: 'user',
      targetId: id,
      targetEmail: user.email,
      adminEmail,
      note: note ?? null,
    })
  }

  if (action === 'note') {
    await db.update(users).set({ internalNote: note ?? null }).where(eq(users.id, id))

    await logAdminActivity({
      action: 'note_added',
      targetType: 'user',
      targetId: id,
      targetEmail: user.email,
      adminEmail,
      note: note ?? null,
    })
  }

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/activity')

  return NextResponse.json({ success: true })
}
