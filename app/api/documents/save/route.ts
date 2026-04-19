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
    const tenantSlug = `user-${userId}`

    let tenant = await db.query.tenants.findFirst({
      where: eq(tenants.slug, tenantSlug),
    })

    if (!tenant) {
      const [newTenant] = await db
        .insert(tenants)
        .values({
          name: `${clerkUser.firstName || 'My'} Organisation`,
          slug: tenantSlug,
          plan: 'free',
        })
        .returning()

      tenant = newTenant
    }

    console.log('[save] tenantId:', tenant.id, 'plan:', tenant.plan, 'quotaUsed:', tenant.documentQuotaUsed)

    let user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          tenantId: tenant.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          role: 'admin',
        })
        .returning()

      user = newUser
    } else if (user.tenantId !== tenant.id) {
      console.log('[save] tenantId mismatch — user.tenantId:', user.tenantId, 'slug tenant:', tenant.id, '— remapping user')
      await db
        .update(users)
        .set({ tenantId: tenant.id })
        .where(eq(users.clerkId, userId))

      user = { ...user, tenantId: tenant.id }
    }

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
      console.log('[save] quota check failed — PLAN_LIMIT_REACHED. tenantId:', tenantId, 'limit:', FREE_LIMIT)
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

    console.log('[save] quota claimed — new quotaUsed:', quota.documentQuotaUsed, '— inserting document')

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

    console.log('[save] success — docId:', doc.id)

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
