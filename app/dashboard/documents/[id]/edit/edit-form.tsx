'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface Props {
  docId: string
  initialTitle: string
  initialContent: string
}

export function EditForm({ docId, initialTitle, initialContent }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = title !== initialTitle || content !== initialContent

  async function handleSave() {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) { setError('Title is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle, content }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      setSaved(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <Link href="/dashboard" className="text-sm text-gray-500 transition hover:text-gray-900">
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/library" className="text-sm text-gray-500 transition hover:text-gray-900">
            Library
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/dashboard/documents/${docId}`}
            className="max-w-xs truncate text-sm text-gray-500 transition hover:text-gray-900"
          >
            {initialTitle}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Edit</span>

          <div className="ml-auto flex items-center gap-2">
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
            <Link
              href={`/dashboard/documents/${docId}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
            >
              {saving && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Title input */}
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null) }}
          disabled={saving}
          placeholder="Document title"
          className="mb-5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 disabled:opacity-50"
        />

        {/* Markdown editor */}
        <div data-color-mode="light" style={{ height: 'calc(100vh - 220px)' }}>
          <MDEditor
            value={content}
            onChange={(val) => setContent(val ?? '')}
            height="100%"
            preview="live"
            hideToolbar={false}
            visibleDragbar={false}
            style={{ borderRadius: '18px', overflow: 'hidden' }}
          />
        </div>
      </div>

      {/* Success modal */}
      {saved && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-saved-title"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSaved(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="px-6 py-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
                <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 id="edit-saved-title" className="text-base font-semibold text-gray-900">
                Changes saved
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-gray-600">
                Your document has been updated successfully.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setSaved(false)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Continue editing
              </button>
              <button
                onClick={() => router.push(`/dashboard/documents/${docId}`)}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                View document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
