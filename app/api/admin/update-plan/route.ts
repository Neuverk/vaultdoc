import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { isPlatformAdmin } from '@/lib/admin'
import { createAuditLog } from '@/lib/audit'
import { logAdminActivity } from '@/lib/admin-activity'
import { revalidatePath } from 'next/cache'

const ALLOWED_PLANS = ['free', 'starter', 'enterprise'] as const
type AllowedPlan = (typeof ALLOWED_PLANS)[number]

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null

  if (!isPlatformAdmin(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let tenantId = ''
  let newPlan = '' as AllowedPlan | ''

  try {
    const body = await req.json()
    tenantId = String(body.tenantId ?? '').trim()
    newPlan = String(body.newPlan ?? '').trim() as AllowedPlan | ''
  } catch (error) {
    console.error('Admin update-plan: failed to parse request body', String(error))
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!tenantId || !newPlan) {
    return NextResponse.json(
      { error: 'Missing tenantId or newPlan.' },
      { status: 400 },
    )
  }

  if (!ALLOWED_PLANS.includes(newPlan)) {
    return NextResponse.json({ error: 'Invalid plan value.' }, { status: 400 })
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
  }

  if (tenant.plan === newPlan) {
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/library')

    return NextResponse.json({
      success: true,
      message: 'Plan already set.',
      tenantId,
      plan: tenant.plan,
    })
  }

  try {
    const updated = await db
      .update(tenants)
      .set({ plan: newPlan })
      .where(eq(tenants.id, tenantId))
      .returning({
        id: tenants.id,
        plan: tenants.plan,
      })

    if (!updated.length) {
      return NextResponse.json(
        { error: 'Tenant not found or not updated.' },
        { status: 404 },
      )
    }

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

    await logAdminActivity({
      action: 'plan_updated',
      targetType: 'tenant',
      targetId: tenantId,
      adminEmail: email,
      metadata: { from: tenant.plan, to: newPlan, tenantName: tenant.name },
    })

    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/billing')
    revalidatePath('/dashboard/admin/activity')
    revalidatePath('/dashboard/library')

    return NextResponse.json({
      success: true,
      tenantId: updated[0].id,
      plan: updated[0].plan,
    })
  } catch (error) {
    console.error('Admin update-plan failed:', String(error))
    return NextResponse.json(
      { error: 'Failed to update tenant plan.' },
      { status: 500 },
    )
  }
}