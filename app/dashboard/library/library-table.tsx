'use client'

import { useState, useMemo } from 'react'
import { DocActions } from './doc-actions'

interface Doc {
  id: string
  title: string
  type: string
  status: string
  confidentiality: string
  department?: string | null
  frameworks?: string[] | null
  createdAt: string | Date
  updatedAt?: string | Date | null
}

const PAGE_SIZE = 25

const STATUS_STYLES: Record<string, string> = {
  draft:     'border-gray-200 bg-gray-50 text-gray-600',
  review:    'border-amber-200 bg-amber-50 text-amber-700',
  approved:  'border-blue-200 bg-blue-50 text-blue-700',
  effective: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function statusClass(status: string) {
  return STATUS_STYLES[status] ?? 'border-gray-200 bg-gray-50 text-gray-600'
}

export function LibraryTable({ docs }: { docs: Doc[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    setVisible(PAGE_SIZE) // reset pagination on filter change
    return docs.filter((doc) => {
      if (q && !doc.title.toLowerCase().includes(q) && !doc.type.toLowerCase().includes(q)) return false
      if (typeFilter && doc.type !== typeFilter) return false
      if (statusFilter && doc.status !== statusFilter) return false
      return true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docs, search, typeFilter, statusFilter])

  const page = filtered.slice(0, visible)
  const hasMore = visible < filtered.length

  function fmt(d: string | Date | null | undefined) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Toolbar */}
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
            placeholder="Search by title or type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white sm:w-56"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400"
          >
            <option value="">All types</option>
            <option value="SOP">SOP</option>
            <option value="Policy">Policy</option>
            <option value="Runbook">Runbook</option>
            <option value="IR Plan">IR Plan</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="BCP">BCP</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400"
          >
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="review">Review</option>
            <option value="approved">Approved</option>
            <option value="effective">Effective</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Document</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Frameworks</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Classification</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {page.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                  No documents match your filters.
                </td>
              </tr>
            ) : (
              page.map((doc) => (
                <tr key={doc.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <a href={`/dashboard/documents/${doc.id}`} className="text-sm font-medium text-gray-900 hover:underline underline-offset-2">
                      {doc.title}
                    </a>
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
                      {doc.frameworks?.slice(0, 2).map((fw) => (
                        <span key={fw} className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {fw}
                        </span>
                      ))}
                      {(doc.frameworks?.length ?? 0) > 2 && (
                        <span className="inline-flex items-center text-xs text-gray-400">
                          +{doc.frameworks!.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${statusClass(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {doc.confidentiality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {fmt(doc.updatedAt ?? doc.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <DocActions docId={doc.id} docTitle={doc.title} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
        <p className="text-xs text-gray-400">
          Showing {page.length} of {filtered.length} document{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== docs.length && ` (filtered from ${docs.length})`}
        </p>
        {hasMore && (
          <button
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Load more ({filtered.length - visible} remaining)
          </button>
        )}
      </div>
    </div>
  )
}
