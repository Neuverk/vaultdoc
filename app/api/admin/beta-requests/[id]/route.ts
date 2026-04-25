import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaRequests, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity'
import { revalidatePath } from 'next/cache'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'
const DASHBOARD_URL = `${APP_URL}/dashboard`
const SIGNUP_URL = `${APP_URL}/sign-up`
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
  //
  // The Clerk invitation URL is the ONLY correct entry point for a user who
  // does not yet have a Clerk account. Sending them to /sign-in or /sign-up
  // without a valid ticket will always produce "Couldn't find your account".
  //
  // Flow:
  //   a) Check whether a Clerk account already exists for this email.
  //      If yes  → user can sign in directly; use SIGNIN_URL as the CTA.
  //      If no   → create a Clerk invitation (notify: false so we send the
  //                email ourselves) and use invitation.url as the CTA.
  //   b) invitation.url must be present. If it is missing, fail the entire
  //      approval and return an error — never mark as approved without it.
  //   c) Only after a valid inviteUrl is confirmed do we write to the DB.

  const clerk = await clerkClient()

  // ── a) Check for existing Clerk account ──────────────────────────────────
  let clerkUserExists = false
  try {
    const existing = await clerk.users.getUserList({ emailAddress: [request.email] })
    clerkUserExists = existing.totalCount > 0
    console.log(`[beta-approve] Clerk user lookup — email: ${request.email}, exists: ${clerkUserExists}`)
  } catch (err) {
    console.error(`[beta-approve] Clerk user lookup failed for ${request.email}:`, err)
    return NextResponse.json(
      { error: 'Could not verify Clerk account status. Please try again.' },
      { status: 502 },
    )
  }

  // ── b) Build the invitation CTA URL ──────────────────────────────────────
  let inviteUrl: string

  if (clerkUserExists) {
    // Clerk account already exists — invitation not needed; just sign in.
    inviteUrl = SIGNIN_URL
    console.log(`[beta-approve] Clerk account already exists for ${request.email} — using sign-in URL`)
  } else {
    // New user — create a Clerk invitation.
    //   notify: false   → Clerk does NOT send its own email; we send via Resend
    //   redirectUrl     → where Clerk redirects after the user creates the account
    //   (no ignoreExisting — we already confirmed the user does not exist)
    let invitation
    try {
      invitation = await clerk.invitations.createInvitation({
        emailAddress: request.email,
        redirectUrl: SIGNUP_URL,
        notify: false,
      })
    } catch (err) {
      console.error(`[beta-approve] Clerk invitation creation failed for ${request.email}:`, err)
      return NextResponse.json(
        { error: 'Failed to create Clerk invitation. Approval not saved. Please try again.' },
        { status: 502 },
      )
    }

    // Temporary full-response log — remove once invitation URL is confirmed working
    console.log('[beta-approve] full Clerk invitation response:', JSON.stringify(invitation))
    console.log(
      `[beta-approve] Clerk invitation created — id: ${invitation.id}, ` +
      `email: ${request.email}, url present: ${Boolean(invitation.url)}, ` +
      `url: ${invitation.url ?? '(missing)'}`,
    )

    if (!invitation.url) {
      // This should not happen with notify: false, but guard against it.
      // Without the URL we cannot send a working setup link — do not approve.
      console.error(
        `[beta-approve] invitation.url missing for invitation ${invitation.id} — aborting approval`,
      )
      return NextResponse.json(
        {
          error:
            'Clerk returned an invitation without a setup URL. ' +
            'Check your Clerk application configuration and try again.',
        },
        { status: 502 },
      )
    }

    inviteUrl = invitation.url
  }

  console.log(`[beta-approve] final CTA URL for ${request.email}: ${inviteUrl}`)

  // ── c) Persist approval — only reached when inviteUrl is confirmed ────────

  // Create the tenant now so betaRequests.tenantId is populated immediately.
  // bootstrapUser() will reuse this tenant on first sign-in; no second tenant is created.
  const [approvedTenant] = await db
    .insert(tenants)
    .values({
      name: request.company,
      slug: `beta-${request.id}`,
      plan: 'free',
    })
    .returning()

  console.log(`[beta-approve] tenant linked: ${approvedTenant.id}`)

  await db
    .update(betaRequests)
    .set({
      status: 'approved',
      reviewedAt: new Date(),
      reviewNote: note ?? null,
      tenantId: approvedTenant.id,
    })
    .where(eq(betaRequests.id, id))

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

  // ── d) Send approval email — one email, one button ────────────────────────
  //
  // inviteUrl is either the Clerk invitation acceptance URL (new users) or
  // the sign-in URL (existing Clerk users). Either way the button label is
  // accurate for what the user needs to do next.
  const emailSubject = clerkUserExists
    ? "You're in — Sign in to VaultDoc"
    : "You're in — Set up your VaultDoc account"

  const emailAction = clerkUserExists
    ? 'Your account is ready. Click below to sign in:'
    : 'Click the button below to create your account and get started. <strong>This link is single-use</strong> — keep it safe.'

  const emailCta = clerkUserExists ? 'Sign in to VaultDoc →' : 'Set up your VaultDoc account →'

  resend.emails
    .send({
      from: FROM_EMAIL,
      to: request.email,
      subject: emailSubject,
      html: `
        <p>Hi ${request.name},</p>
        <p>
          Great news — you've been approved for VaultDoc beta access.
          VaultDoc helps enterprise teams generate audit-ready compliance
          documentation aligned to ISO 27001, TISAX, SOC 2, GDPR, and more.
        </p>
        <p>${emailAction}</p>
        <p style="margin:24px 0">
          <a href="${inviteUrl}" style="background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
            ${emailCta}
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color:#374151">${inviteUrl}</a>
        </p>
        <p>If you have any questions, reply to this email and we'll help you get started.</p>
        <p>— The VaultDoc team</p>
      `,
    })
    .catch((err) => console.error('[beta-approve] welcome email failed:', err))

  return NextResponse.json({ success: true })
}
