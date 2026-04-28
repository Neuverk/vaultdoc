import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { logAdminActivity } from '@/lib/admin-activity'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { accountDeletionScheduled } from '@/lib/email-templates'
import { revalidatePath } from 'next/cache'

const VALID_ACTIONS = ['block', 'unblock', 'note', 'schedule-deletion'] as const
type Action = (typeof VALID_ACTIONS)[number]

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

  if (!action || !(VALID_ACTIONS as readonly string[]).includes(action)) {
    return NextResponse.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(', ')}.` },
      { status: 400 },
    )
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, id) })
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const typedAction = action as Action

  if (typedAction === 'block' || typedAction === 'unblock') {
    const blocked = typedAction === 'block'
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

  if (typedAction === 'note') {
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

  if (typedAction === 'schedule-deletion') {
    if (user.deletedAt) {
      return NextResponse.json(
        { error: 'User is already scheduled for deletion.' },
        { status: 409 },
      )
    }

    const now = new Date()
    const deletionScheduledFor = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const deletionReason = note?.trim() || 'Admin deleted user'

    await db
      .update(users)
      .set({
        deletedAt: now,
        deletionScheduledFor,
        deletionReason,
        deletedBy: adminEmail,
        blocked: true,
      })
      .where(eq(users.id, id))

    await logAdminActivity({
      action: 'user_deletion_scheduled',
      targetType: 'user',
      targetId: id,
      targetEmail: user.email,
      adminEmail,
      note: deletionReason,
      metadata: {
        deletionScheduledFor: deletionScheduledFor.toISOString(),
        adminTriggered: true,
      },
    })

    const deletionEmail = accountDeletionScheduled({
      to: user.email,
      accountEmail: user.email,
      deletionDate: deletionScheduledFor,
      requestId: id,
    })
    void resend.emails
      .send({
        from: FROM_EMAIL,
        to: user.email,
        replyTo: 'support@neuverk.com',
        subject: deletionEmail.subject,
        html: deletionEmail.html,
      })
      .catch((err) => console.error('[admin-delete] deletion email failed:', err))
  }

  revalidatePath('/dashboard/admin/users')
  revalidatePath('/dashboard/admin/activity')

  return NextResponse.json({ success: true })
}
