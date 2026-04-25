import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { checkRateLimit } from '@/lib/rate-limit'

const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_EMAIL ?? 'baijuamal97@gmail.com'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = await checkRateLimit(`beta_requests:${ip}`, 5, 15 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { name, email, company, position, useCase } = body as Record<string, string>

  if (!name?.trim() || !email?.trim() || !company?.trim()) {
    return NextResponse.json(
      { error: 'Name, email, and company are required.' },
      { status: 400 },
    )
  }

  const emailLower = email.trim().toLowerCase()

  try {
    const existing = await db.query.betaRequests.findFirst({
      where: eq(betaRequests.email, emailLower),
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This email has already been submitted.' },
        { status: 409 },
      )
    }

    await db.insert(betaRequests).values({
      name: name.trim(),
      email: emailLower,
      company: company.trim(),
      position: position?.trim() || null,
      useCase: useCase?.trim() || null,
      status: 'pending',
    })
  } catch (err) {
    console.error('[beta-requests] DB error:', err)
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 })
  }

  // Internal notification — fire and forget, don't fail the request if email fails
  resend.emails
    .send({
      from: FROM_EMAIL,
      to: ADMIN_NOTIFY_EMAIL,
      subject: 'New VaultDoc beta request',
      html: `
        <p>A new beta access request was submitted.</p>
        <table style="border-collapse:collapse;width:100%;max-width:480px">
          <tr><td style="padding:8px 0;font-weight:600;color:#111">Name</td><td style="padding:8px 0;color:#374151">${name.trim()}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;color:#111">Email</td><td style="padding:8px 0;color:#374151">${emailLower}</td></tr>
          <tr><td style="padding:8px 0;font-weight:600;color:#111">Company</td><td style="padding:8px 0;color:#374151">${company.trim()}</td></tr>
          ${position?.trim() ? `<tr><td style="padding:8px 0;font-weight:600;color:#111">Position</td><td style="padding:8px 0;color:#374151">${position.trim()}</td></tr>` : ''}
          ${useCase?.trim() ? `<tr><td style="padding:8px 0;font-weight:600;color:#111;vertical-align:top">Use case</td><td style="padding:8px 0;color:#374151">${useCase.trim()}</td></tr>` : ''}
        </table>
        <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin/beta-requests">Review in admin panel →</a></p>
      `,
    })
    .catch((err) => console.error('[beta-requests] notification email failed:', err))

  return NextResponse.json({ success: true }, { status: 201 })
}
