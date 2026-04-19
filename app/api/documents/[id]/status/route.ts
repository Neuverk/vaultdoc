import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { createAuditLog } from '@/lib/audit'
import { isValidUUID } from '@/lib/validate'

const ALLOWED_STATUSES = ['draft', 'review', 'approved', 'effective'] as const
type DocStatus = (typeof ALLOWED_STATUSES)[number]

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

  const body = await req.json().catch(() => ({})) as { status?: string }
  const status = body.status as DocStatus | undefined

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 },
    )
  }

  if (status === doc.status) {
    return NextResponse.json({ success: true })
  }

  await db.update(documents).set({ status, updatedAt: new Date() }).where(eq(documents.id, id))

  await createAuditLog({
    tenantId: doc.tenantId,
    userId: dbUser.id,
    action: 'document_status_updated',
    resourceType: 'document',
    resourceId: doc.id,
    metadata: { title: doc.title, from: doc.status, to: status },
  })

  return NextResponse.json({ success: true })
}
