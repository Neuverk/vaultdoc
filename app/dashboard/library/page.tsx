import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { LibraryTable } from './library-table'

export default async function LibraryPage() {
  const { userId } = await auth()
  let docs: any[] = []

  try {
    let dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId!),
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

    if (dbUser?.tenantId) {
      docs = await db.query.documents.findMany({
        where: eq(documents.tenantId, dbUser.tenantId),
        orderBy: (documents, { desc }) => [desc(documents.createdAt)],
      })
    }
  } catch (e) {
    console.error('Library error:', e)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <a href="/dashboard" className="transition hover:text-gray-600">Dashboard</a>
              <span>/</span>
              <span className="text-gray-600">Library</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Document library</h1>
            <p className="mt-1 text-sm text-gray-500">
              {docs.length === 0
                ? 'No documents yet. Create your first to get started.'
                : `${docs.length} document${docs.length !== 1 ? 's' : ''} in your workspace.`}
            </p>
          </div>
          <a
            href="/dashboard/documents/new"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
          >
            + New document
          </a>
        </div>

        {docs.length === 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-sm sm:p-14">
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create your first compliance document
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                Upload an existing policy or generate one using AI. VaultDoc helps you align with ISO 27001, SOC 2, GDPR and more.
              </p>
              <div className="mt-8">
                <a
                  href="/dashboard/documents/new"
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                  Create your first document →
                </a>
              </div>
            </div>
          </div>
        )}

        {docs.length > 0 && <LibraryTable docs={docs} />}
      </div>
    </div>
  )
}
