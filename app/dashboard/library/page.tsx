import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'

export default async function LibraryPage() {
  const { userId } = await auth()
  const user = await currentUser()

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

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    review: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    effective: 'bg-green-100 text-green-700',
  }

  const confColors: Record<string, string> = {
    Public: 'bg-green-100 text-green-700',
    Internal: 'bg-blue-100 text-blue-700',
    Confidential: 'bg-amber-100 text-amber-700',
    Restricted: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <span className="font-semibold text-gray-900">Vaultdoc</span>
          <span className="text-xs text-gray-400 ml-1">by Neuverk</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
              <span>/</span>
              <span className="text-gray-900">Document library</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Document library</h1>
            <p className="text-sm text-gray-500 mt-1">
              {docs.length} document{docs.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link
            href="/dashboard/documents/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2"
          >
            + New document
          </Link>
        </div>

        {/* Empty state */}
        {docs.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="text-5xl mb-4">📄</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create your first AI-generated compliance document
            </p>
            <Link
              href="/dashboard/documents/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg inline-block"
            >
              Create document
            </Link>
          </div>
        )}

        {/* Document table */}
        {docs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search documents..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none">
                <option>All types</option>
                <option>SOP</option>
                <option>Policy</option>
                <option>Runbook</option>
                <option>IR Plan</option>
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 bg-white focus:outline-none">
                <option>All status</option>
                <option>Draft</option>
                <option>Under review</option>
                <option>Approved</option>
                <option>Effective</option>
              </select>
            </div>

            {/* Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Document</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Frameworks</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Classification</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{doc.title}</div>
                      {doc.docId && (
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{doc.docId}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {doc.frameworks?.slice(0, 2).map((fw: string) => (
                          <span key={fw} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {fw}
                          </span>
                        ))}
                        {doc.frameworks?.length > 2 && (
                          <span className="text-xs text-gray-400">+{doc.frameworks.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusColors[doc.status] || 'bg-gray-100 text-gray-600'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${confColors[doc.confidentiality] || 'bg-gray-100 text-gray-600'}`}>
                        {doc.confidentiality}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          View
                        </button>
                        <button className="text-xs text-gray-400 hover:text-gray-600">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}