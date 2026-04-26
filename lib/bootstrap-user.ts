import { db } from '@/lib/db'
import { users, tenants, betaRequests } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

type UserRow = typeof users.$inferSelect
type TenantRow = typeof tenants.$inferSelect

export type BootstrappedUser = {
  user: UserRow
  tenant: TenantRow
}

type BootstrapInput = {
  clerkUserId: string
  email: string
  firstName?: string | null
  lastName?: string | null
}

/**
 * Resolves or creates the Neon user + tenant for a given Clerk user.
 *
 * Resolution order:
 *  1. Find user by clerkId
 *  2. Find user by email
 *     - exactly one match: reuse and reconcile clerkId/profile fields
 *     - multiple matches: conflict, return null
 *     - no match: create tenant + user
 *
 * Returns null only on unresolvable conflict.
 */
export async function bootstrapUser({
  clerkUserId,
  email,
  firstName,
  lastName,
}: BootstrapInput): Promise<BootstrappedUser | null> {
  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  })

  if (user?.deletedAt) {
    console.warn('[bootstrap] user scheduled for deletion — denying access:', user.email)
    return null
  }

  let tenant: TenantRow | null = user?.tenantId
    ? (await db.query.tenants.findFirst({
        where: eq(tenants.id, user.tenantId),
      })) ?? null
    : null

  if (user && tenant) {
    return { user, tenant }
  }

  if (!user && email) {
    const byEmail = await db.query.users.findMany({
      where: eq(users.email, email),
    })

    if (byEmail.length > 1) {
      console.error('[bootstrap] multiple users found for same email — cannot auto-merge')
      return null
    }

    if (byEmail.length === 1) {
      const existing = byEmail[0]

      if (existing.deletedAt) {
        console.warn('[bootstrap] email-matched user scheduled for deletion — denying access:', existing.email)
        return null
      }

      await db
        .update(users)
        .set({
          clerkId: clerkUserId,
          email: email || existing.email,
          firstName: firstName || existing.firstName || '',
          lastName: lastName || existing.lastName || '',
        })
        .where(eq(users.id, existing.id))

      user = {
        ...existing,
        clerkId: clerkUserId,
        email: email || existing.email,
        firstName: firstName || existing.firstName || '',
        lastName: lastName || existing.lastName || '',
      }

      tenant = existing.tenantId
        ? (await db.query.tenants.findFirst({
            where: eq(tenants.id, existing.tenantId),
          })) ?? null
        : null
    }
  }

  if (!tenant) {
    // Locate the approved beta request for this email (normal invite path).
    let approvedRequest: (typeof betaRequests.$inferSelect) | undefined
    if (email) {
      approvedRequest = await db.query.betaRequests.findFirst({
        where: and(
          eq(betaRequests.email, email.toLowerCase()),
          eq(betaRequests.status, 'approved'),
        ),
      }) ?? undefined
    }

    // If a tenant was already created for this beta request, reuse it.
    if (approvedRequest?.tenantId) {
      tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, approvedRequest.tenantId),
      }) ?? null
    }

    if (!tenant) {
      // Use the company name from the approved request; fall back only when
      // no beta request exists (e.g. direct admin-created accounts).
      const tenantName = approvedRequest?.company ?? `${firstName || 'My'} Organisation`

      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: tenantName,
          slug: `user-${clerkUserId}`,
          plan: 'free',
        })
        .returning()

      tenant = newTenant

      // Write the tenantId back so future signups for this invitation reuse it.
      if (approvedRequest) {
        await db
          .update(betaRequests)
          .set({ tenantId: tenant.id })
          .where(eq(betaRequests.id, approvedRequest.id))
      }
    }
  }

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUserId,
        tenantId: tenant.id,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'admin',
      })
      .returning()

    user = newUser
  } else if (user.tenantId !== tenant.id) {
    await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, user.id))
    user = { ...user, tenantId: tenant.id }
  }

  return { user, tenant }
}