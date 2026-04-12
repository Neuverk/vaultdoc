import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function LibraryPage() {
  const { userId } = await auth()
  let docs: any[] = []

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId!),
    })
    if (dbUser) {
      docs = await db.query.documents.findMany({
        where: eq(documents.tenantId, dbUser.tenantId!),
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
          <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900">No documents yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              Generate your first AI-powered compliance document to begin building your library.
            </p>
            <a
              href="/dashboard/documents/new"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Create your first document
            </a>
          </div>
        )}

        {docs.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-gray-900">
                All documents
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {docs.length}
                </span>
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white sm:w-56"
                />
                <select className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400">
                  <option>All types</option>
                  <option>SOP</option>
                  <option>Policy</option>
                  <option>Runbook</option>
                </select>
                <select className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400">
                  <option>All status</option>
                  <option>Draft</option>
                  <option>Approved</option>
                  <option>Effective</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Frameworks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Classification</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {docs.map((doc: any) => (
                    <tr key={doc.id} className="transition hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        {doc.department && (
                          <div className="mt-0.5 text-xs text-gray-400">{doc.department}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {doc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {doc.frameworks?.slice(0, 2).map((fw: string) => (
                            <span key={fw} className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {fw}
                            </span>
                          ))}
                          {doc.frameworks?.length > 2 && (
                            <span className="inline-flex items-center text-xs text-gray-400">
                              +{doc.frameworks.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {doc.confidentiality}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(doc.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <a
                            href={'/dashboard/documents/' + doc.id}
                            className="text-xs font-medium text-gray-900 transition hover:text-gray-600"
                          >
                            View
                          </a>
                          <span className="text-gray-200">·</span>
                          <button className="text-xs font-medium text-gray-400 transition hover:text-gray-900">
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 px-6 py-3">
              <p className="text-xs text-gray-400">
                Showing {docs.length} of {docs.length} documents
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}