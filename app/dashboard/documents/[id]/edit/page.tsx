import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { isValidUUID } from '@/lib/validate'
import { EditForm } from './edit-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EditDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  if (!isValidUUID(id)) return notFound()

  const { userId } = await auth()
  if (!userId) return notFound()

  let dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser) {
    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (email) {
      dbUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      }) ?? undefined
    }
  }

  if (!dbUser?.tenantId) return notFound()

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
