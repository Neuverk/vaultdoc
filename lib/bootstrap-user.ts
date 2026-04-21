import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
 * Resolves or creates the Neon user + tenant for a given Clerk userId.
 *
 * Resolution order (mirrors save/route.ts):
 *  1. Find user by clerkId (fast path)
 *  2. Find user by email (handles clerkId rotation)
 *     a. Exactly one match → reuse account, update clerkId
 *     b. Multiple matches → conflict, return null
 *     c. No match → create fresh tenant + user
 *
 * Returns null only on unresolvable conflict.
 * Callers are responsible for obtaining Clerk user data before calling.
 */
export async function bootstrapUser({
  clerkUserId,
  email,
  firstName,
  lastName,
}: BootstrapInput): Promise<BootstrappedUser | null> {
  // ── 1. Fast path: look up by clerkId ─────────────────────────────────────
  let user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  })

  let tenant: TenantRow | null = user?.tenantId
    ? (await db.query.tenants.findFirst({ where: eq(tenants.id, user.tenantId) })) ?? null
    : null

  if (user && tenant) return { user, tenant }

  // ── 2. Email fallback (handles clerkId change for same account) ──────────
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
      await db
        .update(users)
        .set({
          clerkId: clerkUserId,
          email: email || existing.email,
          firstName: firstName || existing.firstName || '',
          lastName: lastName || existing.lastName || '',
        })
        .where(eq(users.id, existing.id))

      user = { ...existing, clerkId: clerkUserId }
      tenant = existing.tenantId
        ? (await db.query.tenants.findFirst({ where: eq(tenants.id, existing.tenantId) })) ?? null
        : null
    }
  }

  // ── 3. Create tenant if still missing ────────────────────────────────────
  if (!tenant) {
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name: `${firstName || 'My'} Organisation`,
        slug: `user-${clerkUserId}`,
        plan: 'free',
      })
      .returning()

    tenant = newTenant
  }

  // ── 4. Create user if still missing ──────────────────────────────────────
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
