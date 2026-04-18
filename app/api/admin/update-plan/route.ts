import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { createAuditLog } from '@/lib/audit'

const ALLOWED_PLANS = ['free', 'starter', 'enterprise'] as const
type AllowedPlan = (typeof ALLOWED_PLANS)[number]

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null

  if (!isPlatformAdmin(email)) {
    return new Response('Forbidden', { status: 403 })
  }

  let tenantId = ''
  let newPlan = ''

  try {
    const body = await req.json()
    tenantId = String(body.tenantId ?? '').trim()
    newPlan = String(body.newPlan ?? '').trim()
  } catch (error) {
    console.error('Admin update-plan: failed to parse request body', String(error))
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  if (!tenantId || !newPlan) {
    return new Response(
      JSON.stringify({ error: 'Missing tenantId or newPlan.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  if (!ALLOWED_PLANS.includes(newPlan as AllowedPlan)) {
    return new Response(
      JSON.stringify({ error: 'Invalid plan value.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  if (!tenant) {
    return new Response(
      JSON.stringify({ error: 'Tenant not found.' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  if (tenant.plan === newPlan) {
    return new Response(
      JSON.stringify({ success: true, message: 'Plan already set.' }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  try {
    await db
      .update(tenants)
      .set({ plan: newPlan })
      .where(eq(tenants.id, tenantId))

    await createAuditLog({
      tenantId,
      action: 'plan_updated_manual',
      resourceType: 'tenant',
      metadata: {
        oldPlan: tenant.plan,
        newPlan,
        changedBy: email,
      },
    })

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Admin update-plan failed:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to update tenant plan.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}