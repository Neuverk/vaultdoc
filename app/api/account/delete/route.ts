import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, documents, tenants, approvals, auditLogs } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'
import { stripe } from '@/lib/stripe'

export async function POST(_req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser) {
    return new Response(
      JSON.stringify({ error: 'User not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const tenantId = dbUser.tenantId
  if (!tenantId) {
    return new Response(
      JSON.stringify({ error: 'No tenant associated with this account.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
  })

  try {
    // 1. Audit log before any data is removed
    await createAuditLog({
      tenantId,
      userId: dbUser.id,
      action: 'account_deleted',
      resourceType: 'user',
      resourceId: dbUser.id,
      metadata: {
        email: dbUser.email,
        tenantId,
      },
    })

    // 2. Cancel active Stripe subscription before removing DB records
    if (tenant?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(tenant.stripeSubscriptionId)
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', String(stripeError))
        // Non-fatal: log and continue — billing team can reconcile manually
      }
    }

    // 3. Count users in tenant to decide whether to delete the tenant
    const [{ value: userCount }] = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.tenantId, tenantId))

    const isSoleUser = userCount <= 1

    // 4. Delete approvals (FK: approvals.documentId → documents.id,
    //    approvals.requestedBy/reviewedBy → users.id)
    await db.delete(approvals).where(eq(approvals.tenantId, tenantId))

    // 5. Delete documents (FK: documents.createdBy → users.id)
    await db.delete(documents).where(eq(documents.tenantId, tenantId))

    // 6. Nullify audit log user references — GDPR pseudonymisation and clears
    //    the FK so the user row can be deleted
    await db
      .update(auditLogs)
      .set({ userId: null })
      .where(eq(auditLogs.userId, dbUser.id))

    // 7. Delete user BEFORE tenant (tenant FK on auditLogs is still intact here)
    await db.delete(users).where(eq(users.id, dbUser.id))

    // 8. If sole user: clear tenant-scoped audit logs (removes tenantId FK),
    //    then delete the tenant itself
    if (isSoleUser) {
      await db.delete(auditLogs).where(eq(auditLogs.tenantId, tenantId))
      await db.delete(tenants).where(eq(tenants.id, tenantId))
    }
  } catch (error) {
    console.error('Account deletion failed:', String(error))
    return new Response(
      JSON.stringify({ error: 'Account deletion failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // 9. Delete Clerk user — done last so a DB failure leaves the account intact
  try {
    const clerk = await clerkClient()
    await clerk.users.deleteUser(userId)
  } catch (clerkError) {
    console.error('Failed to delete Clerk user:', String(clerkError))
    // DB records are already gone; log the failure for manual cleanup
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
