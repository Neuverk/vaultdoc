import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, documents, auditLogs } from '@/lib/db/schema'
import { and, lt, gt, eq, isNull, isNotNull } from 'drizzle-orm'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { createAuditLog } from '@/lib/audit'
import { getReminderEmail } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  // Users whose account is 24–48 h old (so the cron only fires once per user)
  const candidates = await db.query.users.findMany({
    where: and(
      lt(users.createdAt, cutoff24h),
      gt(users.createdAt, cutoff48h),
      isNull(users.deletedAt),
      isNotNull(users.tenantId),
    ),
    columns: { id: true, email: true, firstName: true, tenantId: true, blocked: true },
  })

  const active = candidates.filter((u) => !u.blocked)
  if (active.length === 0) return NextResponse.json({ sent: 0 })

  // Users who already received a reminder (audit_log dedup — no schema change needed)
  const alreadySent = await db.query.auditLogs.findMany({
    where: eq(auditLogs.action, 'reminder_sent'),
    columns: { userId: true },
  })
  const sentIds = new Set(alreadySent.map((r) => r.userId))

  const toRemind = active.filter((u) => !sentIds.has(u.id))
  if (toRemind.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  const failed: string[] = []

  for (const user of toRemind) {
    // Skip if user already created at least one document
    const existing = await db.query.documents.findFirst({
      where: eq(documents.createdBy, user.id),
      columns: { id: true },
    })
    if (existing) continue

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Ihr erstes Dokument wartet / Create your first document',
        html: getReminderEmail(user.firstName),
      })
      sent++
    } catch (err) {
      console.error(`[cron/reminder] email failed for ${user.email}:`, err)
      failed.push(user.email)
      continue
    }

    // Log so the user is never reminded again
    await createAuditLog({
      tenantId: user.tenantId!,
      userId: user.id,
      action: 'reminder_sent',
      resourceType: 'user',
      resourceId: user.id,
    })
  }

  return NextResponse.json({ sent, ...(failed.length ? { failed } : {}) })
}
