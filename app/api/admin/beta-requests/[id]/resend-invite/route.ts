import { auth, currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { logAdminActivity } from '@/lib/admin-activity'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'
const SIGNUP_URL = `${APP_URL}/sign-up`
const SIGNIN_URL = `${APP_URL}/sign-in`

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // ── Auth ─────────────────────────────────────────────────────────────────
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  const adminEmail = clerkUser?.emailAddresses[0]?.emailAddress ?? null
  if (!isPlatformAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Load request ──────────────────────────────────────────────────────────
  const request = await db.query.betaRequests.findFirst({
    where: eq(betaRequests.id, id),
  })

  if (!request) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }

  if (request.status !== 'approved') {
    return NextResponse.json(
      { error: `Only approved requests can have invites resent (current status: ${request.status}).` },
      { status: 409 },
    )
  }

  // ── Check for existing Clerk account ──────────────────────────────────────
  const clerk = await clerkClient()
  let clerkUserExists = false

  try {
    const existing = await clerk.users.getUserList({ emailAddress: [request.email] })
    clerkUserExists = existing.totalCount > 0
  } catch (err) {
    console.error('[resend-invite] Clerk user lookup failed:', err)
    return NextResponse.json(
      { error: 'Could not verify Clerk account status. Please try again.' },
      { status: 502 },
    )
  }

  // ── Build the CTA URL ─────────────────────────────────────────────────────
  let inviteUrl: string
  let emailType: 'invitation' | 'signin'

  if (clerkUserExists) {
    // User already has a Clerk account — direct them to sign in.
    inviteUrl = SIGNIN_URL
    emailType = 'signin'
  } else {
    // No Clerk account — create a fresh invitation every time.
    // Clerk invitation URLs are single-use and must not be reused.
    let invitation
    try {
      invitation = await clerk.invitations.createInvitation({
        emailAddress: request.email,
        redirectUrl: SIGNUP_URL,
        notify: false,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[resend-invite] Clerk invitation creation failed:', message)

      // Clerk rejects the request when a pending invitation already exists.
      // The admin must revoke it in the Clerk dashboard before resending.
      if (
        message.toLowerCase().includes('already been invited') ||
        message.toLowerCase().includes('already exists')
      ) {
        return NextResponse.json(
          {
            error:
              'A pending Clerk invitation already exists for this email. ' +
              'Revoke it in the Clerk dashboard, then resend.',
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { error: 'Failed to create Clerk invitation. Please try again.' },
        { status: 502 },
      )
    }

    if (!invitation.url) {
      console.error(`[resend-invite] invitation.url missing for invitation ${invitation.id}`)

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
    emailType = 'invitation'
  }

  // ── Send email ────────────────────────────────────────────────────────────
  const emailSubject = clerkUserExists
    ? 'Your VaultDoc account is ready'
    : 'Set up your VaultDoc account'

  const emailBody = clerkUserExists
    ? '<p>Your VaultDoc account is ready. Click below to sign in:</p>'
    : '<p>Click the button below to create your VaultDoc account. <strong>This link is single-use</strong> — keep it safe.</p>'

  const emailCta = clerkUserExists ? 'Sign in to VaultDoc →' : 'Set up your VaultDoc account →'

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: request.email,
      subject: emailSubject,
      html: `
        <p>Hi ${request.name},</p>
        <p>
          This is a reminder that you have been approved for VaultDoc beta access.
        </p>
        ${emailBody}
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
  } catch (err) {
    console.error('[resend-invite] Resend email failed:', err)
    return NextResponse.json(
      { error: 'Email delivery failed. Check Resend logs.' },
      { status: 502 },
    )
  }

  await logAdminActivity({
    action: 'invite_resent',
    targetType: 'beta_request',
    targetId: id,
    targetEmail: request.email,
    adminEmail,
    note: null,
    metadata: { emailType, company: request.company },
  })

  return NextResponse.json({ success: true, emailType })
}
