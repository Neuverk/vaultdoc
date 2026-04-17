import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAuditLog } from '@/lib/audit'
import { DeleteButton } from './delete-button'
import { ReviseButton } from './revise-button'

export default async function DocumentPage({
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

  const defaultTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, 'default'),
  })

  const allowedTenantIds = [dbUser.tenantId, defaultTenant?.id].filter(Boolean)

  if (!allowedTenantIds.includes(doc.tenantId)) return notFound()

  await createAuditLog({
    tenantId: doc.tenantId,
    userId: dbUser.id,
    action: 'document_viewed',
    resourceType: 'document',
    resourceId: doc.id,
    metadata: {
      title: doc.title,
      type: doc.type,
      status: doc.status,
      confidentiality: doc.confidentiality,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <Link href="/dashboard" className="transition hover:text-gray-600">
                Dashboard
              </Link>
              <span>/</span>
              <Link
                href="/dashboard/library"
                className="transition hover:text-gray-600"
              >
                Library
              </Link>
              <span>/</span>
              <span className="max-w-xs truncate text-gray-600">{doc.title}</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {doc.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                {doc.type}
              </span>

              {doc.department && (
                <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {doc.department}
                </span>
              )}

              <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                {doc.status}
              </span>

              <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                {doc.confidentiality}
              </span>

              {doc.frameworks?.map((fw: string) => (
                <span
                  key={fw}
                  className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  {fw}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {doc.tenantId === dbUser.tenantId && (
              <>
                <ReviseButton documentId={doc.id} originalLanguage={doc.language ?? 'English'} />
                <DeleteButton documentId={doc.id} />
              </>
            )}
            <Link
              href="/dashboard/library"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Back
            </Link>
            <Link
              href="/dashboard/documents/new"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              + New document
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Created
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Version
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {doc.version || '1.0'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Language
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {doc.language || 'English'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">
              Status
            </p>
            <p className="mt-1 text-sm font-medium capitalize text-gray-900">
              {doc.status}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-8 py-4">
            <p className="text-sm font-medium text-gray-900">Document content</p>
            <p className="text-xs text-gray-400">Read only</p>
          </div>

          <div className="px-8 py-8">
            <DocumentContent content={doc.content || ''} />
          </div>
        </div>
      </div>
    </div>
  )
}

function DocumentContent({ content }: { content: string }) {
  const lines = content.split('\n')

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2
              key={i}
              className="mt-8 mb-3 border-b border-gray-100 pb-2 text-xl font-semibold text-gray-900"
            >
              {line.replace('## ', '')}
            </h2>
          )
        }

        if (line.startsWith('### ')) {
          return (
            <h3
              key={i}
              className="mt-6 mb-2 text-base font-semibold text-gray-900"
            >
              {line.replace('### ', '')}
            </h3>
          )
        }

        if (line.startsWith('#### ')) {
          return (
            <h4
              key={i}
              className="mt-4 mb-1 text-sm font-semibold text-gray-900"
            >
              {line.replace('#### ', '')}
            </h4>
          )
        }

        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={i} className="ml-4 list-disc text-sm text-gray-600">
              {line.replace(/^[-*] /, '')}
            </li>
          )
        }

        if (line.startsWith('| ')) {
          return (
            <p key={i} className="font-mono text-sm text-gray-600">
              {line}
            </p>
          )
        }

        if (line.trim() === '' || line.trim() === '---') {
          return <div key={i} className="my-2" />
        }

        return (
          <p key={i} className="text-sm leading-7 text-gray-600">
            {line}
          </p>
        )
      })}
    </div>
  )
}