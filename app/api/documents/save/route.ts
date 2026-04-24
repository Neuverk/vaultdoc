import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, tenants } from '@/lib/db/schema'
import { eq, sql, and, or, ne, lt } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'
import { bootstrapUser } from '@/lib/bootstrap-user'
import { sanitizeField, sanitizeStringArray } from '@/lib/sanitize'
import { PLANS } from '@/lib/plans'

const MAX_CONTENT_LENGTH = 100_000

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400)
  }

  const raw = body as Record<string, unknown>

  const title = sanitizeField(raw.title)
  const type = sanitizeField(raw.type)
  const department = sanitizeField(raw.department)
  const frameworks = sanitizeStringArray(raw.frameworks)
  const content =
    typeof raw.content === 'string' ? raw.content.trim().slice(0, MAX_CONTENT_LENGTH) : ''
  const scope = sanitizeField(raw.scope)
  const purpose = sanitizeField(raw.purpose)
  const tools = sanitizeField(raw.tools)
  const tone = sanitizeField(raw.tone)
  const language = sanitizeField(raw.language)
  const confidentiality = sanitizeField(raw.confidentiality)

  if (!title) return jsonResponse({ error: 'Document title is required.' }, 400)
  if (!type) return jsonResponse({ error: 'Document type is required.' }, 400)
  if (!department) return jsonResponse({ error: 'Department is required.' }, 400)
  if (!content) return jsonResponse({ error: 'Document content is required.' }, 400)

  try {
    const clerkEmail = clerkUser.emailAddresses[0]?.emailAddress ?? ''

    const bootstrapped = await bootstrapUser({
      clerkUserId: userId,
      email: clerkEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    })

    if (!bootstrapped) {
      return jsonResponse(
        { error: 'Account conflict detected. Please contact support.' },
        409,
      )
    }

    const { user, tenant } = bootstrapped

    if (user.blocked) {
      return jsonResponse({ error: 'Account suspended.' }, 403)
    }

    // ── Quota enforcement ─────────────────────────────────────────────────────
    // Atomically claim a quota slot. Returns 0 rows if the free-plan limit is
    // already reached; returns 1 row otherwise (race-safe via conditional UPDATE).
    const FREE_LIMIT = PLANS.free.maxDocuments

    const [quota] = await db
      .update(tenants)
      .set({ documentQuotaUsed: sql`${tenants.documentQuotaUsed} + 1` })
      .where(
        and(
          eq(tenants.id, tenant.id),
          or(
            ne(tenants.plan, 'free'),
            lt(tenants.documentQuotaUsed, FREE_LIMIT),
          ),
        ),
      )
      .returning({ documentQuotaUsed: tenants.documentQuotaUsed })

    if (!quota) {
      return jsonResponse(
        {
          error: `Free plan limit reached (${FREE_LIMIT} documents max)`,
          code: 'PLAN_LIMIT_REACHED',
          limit: FREE_LIMIT,
        },
        403,
      )
    }

    const [doc] = await db
      .insert(documents)
      .values({
        tenantId: tenant.id,
        createdBy: user.id,
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
      tenantId: tenant.id,
      userId: user.id,
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

    return jsonResponse({ success: true, id: doc.id })
  } catch (error) {
    console.error('[save] unexpected error:', error)
    return jsonResponse({ error: 'Failed to save document.' }, 500)
  }
}
