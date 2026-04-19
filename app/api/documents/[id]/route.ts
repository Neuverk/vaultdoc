import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { createAuditLog } from '@/lib/audit'
import { isValidUUID } from '@/lib/validate'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!isValidUUID(id)) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })
  if (!dbUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (doc.tenantId !== dbUser.tenantId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({})) as { title?: string; content?: string }

  const title = body.title?.trim()
  const content = body.content

  if (!title && content === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const updatedFields: string[] = []
  const updates: Partial<{ title: string; content: string; updatedAt: Date }> = {
    updatedAt: new Date(),
  }
  if (title) { updates.title = title; updatedFields.push('title') }
  if (content !== undefined) { updates.content = content; updatedFields.push('content') }

  await db.update(documents).set(updates).where(eq(documents.id, id))

  await createAuditLog({
    tenantId: doc.tenantId,
    userId: dbUser.id,
    action: 'document_updated',
    resourceType: 'document',
    resourceId: doc.id,
    metadata: { title: updates.title ?? doc.title, updatedFields },
  })

  return NextResponse.json({ success: true })
}
