'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function DeleteModal({
  docTitle,
  onCancel,
  onConfirm,
  deleting,
}: {
  docTitle: string
  onCancel: () => void
  onConfirm: () => void
  deleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
        <h2 className="text-base font-semibold text-gray-900">Delete document</h2>
        <p className="mt-2 text-sm text-gray-500">
          Are you sure you want to delete{' '}
          <span className="font-medium text-gray-700">&ldquo;{docTitle}&rdquo;</span>?
          {' '}This action cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            {deleting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DocActions({ docId, docTitle }: { docId: string; docTitle: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.error(json.error ?? 'Failed to delete document.')
        return
      }

      setShowModal(false)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {showModal && (
        <DeleteModal
          docTitle={docTitle}
          onCancel={() => setShowModal(false)}
          onConfirm={handleConfirmDelete}
          deleting={deleting}
        />
      )}
      <div className="flex items-center gap-3">
        <a
          href={'/dashboard/documents/' + docId}
          className="text-xs font-medium text-gray-900 transition hover:text-gray-600"
        >
          View
        </a>
        <span className="text-gray-200">·</span>
        <a
          href={'/dashboard/documents/' + docId + '/edit'}
          className="text-xs font-medium text-gray-900 transition hover:text-gray-600"
        >
          Edit
        </a>
        <span className="text-gray-200">·</span>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-medium text-red-400 transition hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </>
  )
}
