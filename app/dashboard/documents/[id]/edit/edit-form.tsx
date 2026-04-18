'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  const [error, setError] = useState<string | null>(null)

  const isDirty = title !== initialTitle || content !== initialContent

  async function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Failed to save. Please try again.')
        return
      }
      router.push(`/dashboard/documents/${docId}`)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
              <Link href="/dashboard" className="transition hover:text-gray-600">Dashboard</Link>
              <span>/</span>
              <Link href="/dashboard/library" className="transition hover:text-gray-600">Library</Link>
              <span>/</span>
              <Link href={`/dashboard/documents/${docId}`} className="max-w-xs truncate transition hover:text-gray-600">
                {initialTitle}
              </Link>
              <span>/</span>
              <span className="text-gray-600">Edit</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Edit document</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/documents/${docId}`}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
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

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-3">
            <label htmlFor="doc-title" className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Title
            </label>
          </div>
          <div className="px-6 py-4">
            <input
              id="doc-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
            <label htmlFor="doc-content" className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Content
            </label>
            <span className="text-xs text-gray-400">Markdown supported</span>
          </div>
          <div className="px-6 py-4">
            <textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={saving}
              rows={30}
              className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 font-mono text-sm leading-6 text-gray-800 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
