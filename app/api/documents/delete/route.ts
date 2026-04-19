import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { createAuditLog } from '@/lib/audit'
import { isValidUUID } from '@/lib/validate'

export async function DELETE(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  let documentId: string | undefined

  try {
    const body = await req.json()
    documentId = typeof body?.documentId === 'string' ? body.documentId : undefined
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!documentId) {
    return new Response(
      JSON.stringify({ error: 'documentId is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!isValidUUID(documentId)) {
    return new Response(
      JSON.stringify({ error: 'Invalid document ID.' }),
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

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  })

  if (!doc) {
    return new Response(
      JSON.stringify({ error: 'Document not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Strict tenant check — only owner tenant may delete
  if (doc.tenantId !== dbUser.tenantId) {
    return new Response(
      JSON.stringify({ error: 'Forbidden.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    await db.delete(documents).where(eq(documents.id, documentId))
  } catch (error) {
    console.error('Delete document: DB delete failed', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to delete document.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  await createAuditLog({
    tenantId: doc.tenantId,
    userId: dbUser.id,
    action: 'document_deleted',
    resourceType: 'document',
    resourceId: doc.id,
    metadata: {
      title: doc.title,
      type: doc.type,
      status: doc.status,
      confidentiality: doc.confidentiality,
    },
  })

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
