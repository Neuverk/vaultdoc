'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const LANGUAGES = [
  'English',
  'German',
  'French',
  'Spanish',
  'Italian',
  'Dutch',
  'Portuguese',
  'Polish',
]

type Props = {
  documentId: string
  originalLanguage: string
}

export function ReviseButton({ documentId, originalLanguage }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        <svg
          className="h-3.5 w-3.5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Revise with AI
      </button>

      {open && (
        <ReviseModal
          documentId={documentId}
          originalLanguage={originalLanguage}
          onClose={() => setOpen(false)}
          onSuccess={(newId) => router.push(`/dashboard/documents/${newId}`)}
        />
      )}
    </>
  )
}

function ReviseModal({
  documentId,
  originalLanguage,
  onClose,
  onSuccess,
}: {
  documentId: string
  originalLanguage: string
  onClose: () => void
  onSuccess: (newId: string) => void
}) {
  const [requestedChanges, setRequestedChanges] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newLanguage, setNewLanguage] = useState(originalLanguage || 'English')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requestedChanges.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/documents/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          requestedChanges: requestedChanges.trim(),
          newTitle: newTitle.trim() || undefined,
          newLanguage: newLanguage !== originalLanguage ? newLanguage : undefined,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      onSuccess(data.id)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revise-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2
              id="revise-dialog-title"
              className="text-sm font-semibold text-gray-900"
            >
              Revise with AI
              <span className="ml-2 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Beta
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              The original document will not be changed. A new draft will be saved.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label
              htmlFor="requestedChanges"
              className="block text-xs font-medium text-gray-700"
            >
              Requested changes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="requestedChanges"
              value={requestedChanges}
              onChange={(e) => setRequestedChanges(e.target.value)}
              rows={4}
              placeholder="e.g. Update Section 5 to reflect the new BYOD policy. Add a clause about remote access via VPN. Strengthen the incident escalation steps."
              disabled={loading}
              className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="newTitle"
              className="block text-xs font-medium text-gray-700"
            >
              New title{' '}
              <span className="font-normal text-gray-400">(optional — defaults to original title + &ldquo;Revised&rdquo;)</span>
            </label>
            <input
              id="newTitle"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Leave blank to auto-generate"
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="newLanguage"
              className="block text-xs font-medium text-gray-700"
            >
              Language <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <select
              id="newLanguage"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              disabled={loading}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                  {lang === originalLanguage ? ' (current)' : ''}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !requestedChanges.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading && (
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
              )}
              {loading ? 'Revising…' : 'Revise document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
