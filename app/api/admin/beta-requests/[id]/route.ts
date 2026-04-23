import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaRequests, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity'
import { revalidatePath } from 'next/cache'

const SIGNUP_URL =
  process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`
    : 'https://vaultdoc.neuverk.com/sign-up'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? null
  if (!isPlatformAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const email = adminEmail

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { action, note } = body as { action?: string; note?: string }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json(
      { error: 'action must be "approve" or "reject".' },
      { status: 400 },
    )
  }

  const request = await db.query.betaRequests.findFirst({
    where: eq(betaRequests.id, id),
  })

  if (!request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }

  if (request.status !== 'pending') {
    return NextResponse.json(
      { error: `Request is already ${request.status}.` },
      { status: 409 },
    )
  }

  if (action === 'reject') {
    await db
      .update(betaRequests)
      .set({ status: 'rejected', reviewedAt: new Date(), reviewNote: note ?? null })
      .where(eq(betaRequests.id, id))

    await logAdminActivity({
      action: 'beta_rejected',
      targetType: 'beta_request',
      targetId: id,
      targetEmail: request.email,
      adminEmail,
      note: note ?? null,
      metadata: { company: request.company },
    })

    revalidatePath('/dashboard/admin/beta-requests')
    revalidatePath('/dashboard/admin/activity')
    revalidatePath('/dashboard/admin')

    return NextResponse.json({ success: true })
  }

  // ── Approve ──────────────────────────────────────────────────────────────

  // 1. Mark approved
  await db
    .update(betaRequests)
    .set({ status: 'approved', reviewedAt: new Date(), reviewNote: note ?? null })
    .where(eq(betaRequests.id, id))

  // 2. Create tenant (slug derived from email prefix + id suffix for uniqueness)
  const slugBase = request.email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
  const slug = `${slugBase}-${id.slice(0, 8)}`

  await db.insert(tenants).values({
    name: request.company,
    slug,
    plan: 'free',
  })

  // 3. Send Clerk invitation
  try {
    const clerk = await clerkClient()
    await clerk.invitations.createInvitation({
      emailAddress: request.email,
      redirectUrl: SIGNUP_URL,
      ignoreExisting: true,
    })
  } catch (err) {
    console.error('[beta-requests] Clerk invitation failed:', err)
    // Non-fatal — tenant is created, admin can resend manually
  }

  // 4. Log activity
  await logAdminActivity({
    action: 'beta_approved',
    targetType: 'beta_request',
    targetId: id,
    targetEmail: request.email,
    adminEmail,
    note: note ?? null,
    metadata: { company: request.company, name: request.name },
  })

  revalidatePath('/dashboard/admin/beta-requests')
  revalidatePath('/dashboard/admin/activity')
  revalidatePath('/dashboard/admin')

  // 5. Send welcome email
  resend.emails
    .send({
      from: FROM_EMAIL,
      to: request.email,
      subject: "You're in — VaultDoc Beta Access",
      html: `
        <p>Hi ${request.name},</p>
        <p>
          Great news — you've been approved for VaultDoc beta access.
          VaultDoc helps enterprise teams generate audit-ready compliance
          documentation aligned to ISO 27001, TISAX, SOC 2, GDPR, and more.
        </p>
        <p>
          Click below to create your account and get started:
        </p>
        <p style="margin:24px 0">
          <a href="${SIGNUP_URL}" style="background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Create your VaultDoc account →
          </a>
        </p>
        <p>
          If you have any questions, reply to this email and we'll help you
          get started.
        </p>
        <p>— The VaultDoc team</p>
      `,
    })
    .catch((err) => console.error('[beta-requests] welcome email failed:', err))

  return NextResponse.json({ success: true })
}
