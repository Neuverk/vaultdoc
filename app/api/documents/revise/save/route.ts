import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { canCreateDocument } from '@/lib/plan-limits'
import { createAuditLog } from '@/lib/audit'

const MAX_TITLE_LENGTH = 500
const MAX_CONTENT_LENGTH = 100_000

function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const title = sanitizeText(body.title, MAX_TITLE_LENGTH)
  const content = sanitizeText(body.content, MAX_CONTENT_LENGTH)
  const language = sanitizeText(body.language, 100) || 'English'
  const sourceDocumentId = typeof body.sourceDocumentId === 'string' ? body.sourceDocumentId.trim() : ''
  const type = sanitizeText(body.type, 200)
  const department = sanitizeText(body.department, 200)
  const confidentiality = sanitizeText(body.confidentiality, 100)
  const frameworks = Array.isArray(body.frameworks)
    ? body.frameworks.filter((f): f is string => typeof f === 'string').slice(0, 20)
    : []
  const scope = typeof body.scope === 'string' ? body.scope.trim().slice(0, 2000) : null
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim().slice(0, 2000) : null
  const owner = typeof body.owner === 'string' ? body.owner.trim().slice(0, 200) : null
  const reviewer = typeof body.reviewer === 'string' ? body.reviewer.trim().slice(0, 200) : null

  if (!title) {
    return new Response(
      JSON.stringify({ error: 'Title is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (!content) {
    return new Response(
      JSON.stringify({ error: 'Content is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (!sourceDocumentId) {
    return new Response(
      JSON.stringify({ error: 'sourceDocumentId is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser || !dbUser.tenantId) {
    return new Response(
      JSON.stringify({ error: 'User not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Verify source document belongs to the same tenant
  if (sourceDocumentId) {
    const sourceDoc = await db.query.documents.findFirst({
      where: eq(documents.id, sourceDocumentId),
    })
    if (!sourceDoc || sourceDoc.tenantId !== dbUser.tenantId) {
      return new Response(
        JSON.stringify({ error: 'Source document not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      )
    }
  }

  const { allowed, reason, quotaUsed, limit } = await canCreateDocument(dbUser.tenantId)
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: reason, code: 'PLAN_LIMIT_REACHED', quotaUsed, limit }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  let newDoc: { id: string }
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        tenantId: dbUser.tenantId,
        createdBy: dbUser.id,
        title,
        type,
        department,
        frameworks,
        confidentiality,
        scope: scope ?? undefined,
        purpose: purpose ?? undefined,
        owner: owner ?? undefined,
        reviewer: reviewer ?? undefined,
        language,
        content,
        status: 'draft',
        version: '1.0',
        sourceDocumentId: sourceDocumentId || null,
      })
      .returning({ id: documents.id })

    newDoc = inserted
  } catch (error) {
    console.error('Revise save: DB insert failed:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to save document.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  await db
    .update(tenants)
    .set({ documentQuotaUsed: sql`${tenants.documentQuotaUsed} + 1` })
    .where(eq(tenants.id, dbUser.tenantId))

  await createAuditLog({
    tenantId: dbUser.tenantId,
    userId: dbUser.id,
    action: 'document_revised',
    resourceType: 'document',
    resourceId: newDoc.id,
    metadata: {
      sourceDocumentId,
      newTitle: title,
      language,
    },
  })

  return new Response(
    JSON.stringify({ success: true, id: newDoc.id }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
