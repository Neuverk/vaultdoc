import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq, sql, and, or, ne, lt } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'
import { PLANS } from '@/lib/plans'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    title,
    type,
    department,
    frameworks,
    content,
    scope,
    purpose,
    tools,
    tone,
    language,
    confidentiality,
  } = body

  try {
    const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress || ''

    // ── User + tenant resolution ──────────────────────────────────────────────
    //
    // Priority:
    //  1. Find user by current Clerk userId (fast path, normal case)
    //  2. Find user by email (Clerk userId changed for same account)
    //     a. Exactly one match → reuse that account, update clerkId
    //     b. Multiple matches → fail safely, do NOT create another tenant
    //     c. No match → create fresh tenant + user
    //
    // Tenant is always derived from the resolved user, never looked up by slug
    // except when creating a brand-new record.

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    // Resolve the tenant from the user we already found (may be null if user
    // is new or their tenant row was somehow dropped).
    let tenant = user?.tenantId
      ? (await db.query.tenants.findFirst({
          where: eq(tenants.id, user.tenantId),
        })) ?? null
      : null

    if (!user) {
      // clerkId not in DB — check whether this email already has an account
      const byEmail = clerkEmail
        ? await db.query.users.findMany({ where: eq(users.email, clerkEmail) })
        : []

      if (byEmail.length > 1) {
        // Multiple users share this email — auto-merge is unsafe
        console.error('[save] multiple users found for same email — cannot auto-merge')
        return new Response(
          JSON.stringify({ error: 'Account conflict detected. Please contact support.' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (byEmail.length === 1) {
        // Exactly one existing user → reuse their account; update clerkId
        const existing = byEmail[0]
        console.log('[save] clerkId reconciled via email match')
        await db
          .update(users)
          .set({
            clerkId: userId,
            email: clerkEmail || existing.email,
            firstName: clerkUser.firstName || existing.firstName || '',
            lastName: clerkUser.lastName || existing.lastName || '',
          })
          .where(eq(users.id, existing.id))

        user = { ...existing, clerkId: userId }
        tenant = existing.tenantId
          ? (await db.query.tenants.findFirst({
              where: eq(tenants.id, existing.tenantId),
            })) ?? null
          : null
      }
      // else: byEmail.length === 0 → fall through; new user created below
    }

    // If tenant is still null (new account or orphaned user), create one
    if (!tenant) {
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: `${clerkUser.firstName || 'My'} Organisation`,
          slug: `user-${userId}`,
          plan: 'free',
        })
        .returning()

      tenant = newTenant
    }

    // If user is still null (no clerkId match, no email match), create one
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          tenantId: tenant.id,
          email: clerkEmail,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          role: 'admin',
        })
        .returning()

      user = newUser
    } else if (user.tenantId !== tenant.id) {
      // User exists but their tenantId doesn't match the resolved tenant
      // (can happen when a new tenant was just created for an orphaned user)
      await db
        .update(users)
        .set({ tenantId: tenant.id })
        .where(eq(users.id, user.id))

      user = { ...user, tenantId: tenant.id }
    }

    // ── Quota + document insert ───────────────────────────────────────────────

    const tenantId = tenant.id
    const dbUserId = user.id
    const FREE_LIMIT = PLANS.free.maxDocuments

    // Atomically claim a quota slot via a conditional UPDATE (race-safe at the
    // Postgres level — single statement with row-level locking). Returns 0 rows
    // if the free-plan limit is already reached; returns 1 row otherwise.
    //
    // Note: drizzle-orm/neon-http (HTTP driver) does not support db.transaction().
    // The conditional UPDATE alone is sufficient for atomic quota enforcement.
    const [quota] = await db
      .update(tenants)
      .set({ documentQuotaUsed: sql`${tenants.documentQuotaUsed} + 1` })
      .where(
        and(
          eq(tenants.id, tenantId),
          or(
            ne(tenants.plan, 'free'),
            lt(tenants.documentQuotaUsed, FREE_LIMIT),
          ),
        ),
      )
      .returning({ documentQuotaUsed: tenants.documentQuotaUsed })

    if (!quota) {
      console.log('[save] quota check failed — PLAN_LIMIT_REACHED')
      return new Response(
        JSON.stringify({
          error: `Free plan limit reached (${FREE_LIMIT} documents max)`,
          code: 'PLAN_LIMIT_REACHED',
          limit: FREE_LIMIT,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const [doc] = await db
      .insert(documents)
      .values({
        tenantId,
        createdBy: dbUserId,
        title,
        type,
        department,
        frameworks,
        content,
        scope,
        purpose,
        language,
        confidentiality,
        status: 'draft',
        version: '1.0',
      })
      .returning()

    await createAuditLog({
      tenantId,
      userId: dbUserId,
      action: 'document_created',
      resourceType: 'document',
      resourceId: doc.id,
      metadata: {
        title,
        type,
        department,
        frameworks,
        language,
        confidentiality,
        hasScope: Boolean(scope),
        hasPurpose: Boolean(purpose),
        hasTools: Boolean(tools),
        tone,
        status: 'draft',
      },
    })

    return new Response(JSON.stringify({ success: true, id: doc.id }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[save] unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to save document.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
