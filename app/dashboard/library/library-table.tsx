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
}

export function LibraryTable({ docs }: { docs: Doc[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return docs.filter((doc) => {
      if (q && !doc.title.toLowerCase().includes(q)) return false
      if (typeFilter && doc.type !== typeFilter) return false
      if (statusFilter && doc.status !== statusFilter) return false
      return true
    })
  }, [docs, search, typeFilter, statusFilter])

  return (
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
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400"
          >
            <option value="">All status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="effective">Effective</option>
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">
                  No documents match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((doc) => (
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
                      {(doc.frameworks?.length ?? 0) > 2 && (
                        <span className="inline-flex items-center text-xs text-gray-400">
                          +{doc.frameworks!.length - 2} more
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
                    <DocActions docId={doc.id} docTitle={doc.title} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-gray-100 px-6 py-3">
        <p className="text-xs text-gray-400">
          Showing {filtered.length} of {docs.length} documents
        </p>
      </div>
    </div>
  )
}
