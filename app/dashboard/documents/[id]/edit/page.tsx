import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditForm } from './edit-form'

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) return notFound()

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })
  if (!dbUser) return notFound()

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  })
  if (!doc) return notFound()
  if (doc.tenantId !== dbUser.tenantId) return notFound()

  return (
    <EditForm
      docId={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content ?? ''}
    />
  )
}
