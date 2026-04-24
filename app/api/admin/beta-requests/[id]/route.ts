import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'
const DASHBOARD_URL = `${APP_URL}/dashboard`
const SIGNIN_URL = `${APP_URL}/sign-in`

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

    // Send rejection notification — fire and forget, DB is already updated
    resend.emails
      .send({
        from: FROM_EMAIL,
        to: request.email,
        subject: 'Your VaultDoc beta request',
        html: `
          <p>Hi ${request.name},</p>
          <p>
            Thank you for your interest in VaultDoc. Unfortunately, we're not
            able to offer you beta access at this time.
          </p>
          <p>
            We'll keep your request on file and may reach out in the future
            as we expand access.
          </p>
          <p>— The VaultDoc team</p>
        `,
      })
      .catch((err) => console.error('[beta-requests] rejection email failed:', err))

    return NextResponse.json({ success: true })
  }

  // ── Approve ──────────────────────────────────────────────────────────────

  // 1. Create Clerk invitation first — before touching the DB so the admin
  //    gets a clear error if Clerk is unavailable.
  //
  //    notify: false   → we send our own email via Resend; Clerk does NOT send
  //                      a separate invitation email (avoids two confusing emails)
  //    ignoreExisting  → if a Clerk account already exists for this email,
  //                      skip the invitation silently; invitation.url will be
  //                      undefined and we fall back to the sign-in URL
  //    redirectUrl     → where Clerk sends the user after account creation
  let inviteUrl: string = SIGNIN_URL
  let clerkWarning: string | null = null

  try {
    const clerk = await clerkClient()
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: request.email,
      redirectUrl: DASHBOARD_URL,
      notify: false,
      ignoreExisting: true,
    })
    // invitation.url is set for new Clerk users; undefined when ignoreExisting
    // silently skipped because a Clerk account already exists
    inviteUrl = invitation.url ?? SIGNIN_URL
  } catch (err) {
    console.error('[beta-requests] Clerk invitation failed:', err)
    clerkWarning = 'Clerk invitation could not be created. User can still sign in if they already have a Clerk account, otherwise resend manually.'
  }

  // 2. Mark approved in DB
  await db
    .update(betaRequests)
    .set({ status: 'approved', reviewedAt: new Date(), reviewNote: note ?? null })
    .where(eq(betaRequests.id, id))

  // 3. Log activity
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

  // 4. Send approval email with the Clerk invitation link embedded.
  //    One email, one button — no separate Clerk email to confuse the user.
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
        <p>Click the button below to set up your account and get started:</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            Set up your VaultDoc account →
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color:#374151">${inviteUrl}</a>
        </p>
        <p>
          If you have any questions, reply to this email and we'll help you
          get started.
        </p>
        <p>— The VaultDoc team</p>
      `,
    })
    .catch((err) => console.error('[beta-requests] welcome email failed:', err))

  return NextResponse.json({
    success: true,
    ...(clerkWarning ? { warning: clerkWarning } : {}),
  })
}
