import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rl = await checkRateLimit(`account:delete:${userId}`, 3, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? ''

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  if (dbUser.deletedAt) {
    return NextResponse.json(
      { error: 'Account is already scheduled for deletion.' },
      { status: 409 },
    )
  }

  const now = new Date()
  const deletionScheduledFor = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const deletionReason = 'User requested account deletion'

  await db
    .update(users)
    .set({
      deletedAt: now,
      deletionScheduledFor,
      deletionReason,
      deletedBy: email,
      blocked: true,
    })
    .where(eq(users.id, dbUser.id))

  await logAdminActivity({
    action: 'user_deletion_scheduled',
    targetType: 'user',
    targetId: dbUser.id,
    targetEmail: email,
    adminEmail: email,
    note: deletionReason,
    metadata: {
      selfRequested: true,
      deletionScheduledFor: deletionScheduledFor.toISOString(),
    },
  })

  resend.emails
    .send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your VaultDoc account has been scheduled for deletion',
      html: `
        <p>Hi${clerkUser?.firstName ? ` ${clerkUser.firstName}` : ''},</p>
        <p>
          Your VaultDoc account has been scheduled for deletion. Access has been disabled,
          and your data will be retained for 7 days before permanent deletion.
        </p>
        <p>
          If this was a mistake, please contact VaultDoc support immediately by replying
          to this email.
        </p>
        <p>— The VaultDoc team</p>
      `,
    })
    .catch((err) => console.error('[self-delete] deletion email failed:', err))

  return NextResponse.json({ success: true })
}
