'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STORAGE_KEY = 'vaultdoc:revise_preview'

type PreviewData = {
  content: string
  title: string
  language: string
  sourceDocumentId: string
  type: string
  department: string
  frameworks: string[]
  confidentiality: string
  scope: string | null
  purpose: string | null
  owner: string | null
  reviewer: string | null
}

export default function RevisePreviewPage() {
  const router = useRouter()
  const [data, setData] = useState<PreviewData | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) {
        router.replace('/dashboard/library')
        return
      }
      const parsed: PreviewData = JSON.parse(raw)
      setData(parsed)
      setTitle(parsed.title)
      setContent(parsed.content)
      setReady(true)
    } catch {
      router.replace('/dashboard/library')
    }
  }, [router])

  function handleDiscard() {
    sessionStorage.removeItem(STORAGE_KEY)
    if (data?.sourceDocumentId) {
      router.push(`/dashboard/documents/${data.sourceDocumentId}`)
    } else {
      router.push('/dashboard/library')
    }
  }

  async function handleSave() {
    if (!data) return
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/documents/revise/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || data.title,
          content,
          language: data.language,
          sourceDocumentId: data.sourceDocumentId,
          type: data.type,
          department: data.department,
          frameworks: data.frameworks,
          confidentiality: data.confidentiality,
          scope: data.scope,
          purpose: data.purpose,
          owner: data.owner,
          reviewer: data.reviewer,
        }),
      })

      const result = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(result?.error ?? 'Failed to save document. Please try again.')
        setSaving(false)
        return
      }

      sessionStorage.removeItem(STORAGE_KEY)
      router.push(`/dashboard/documents/${result.id}`)
    } catch {
      setError('Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-400">Loading preview…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
            <Link href="/dashboard" className="transition hover:text-gray-600">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/library" className="transition hover:text-gray-600">
              Library
            </Link>
            {data?.sourceDocumentId && (
              <>
                <span>/</span>
                <Link
                  href={`/dashboard/documents/${data.sourceDocumentId}`}
                  className="transition hover:text-gray-600"
                >
                  Original
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-gray-600">Revised draft</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Review revised document
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and edit the AI-generated revision. The original document is unchanged.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
          >
            {saving && (
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            {saving ? 'Saving…' : 'Save as new document'}
          </button>
        </div>
      </div>

      {/* Metadata strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Type</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{data?.type}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Language</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{data?.language}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Department</p>
          <p className="mt-1 text-sm font-medium text-gray-900">{data?.department || '—'}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Status</p>
          <p className="mt-1 text-sm font-medium text-gray-900">Draft</p>
        </div>
      </div>

      {/* Title editor */}
      <div className="mb-4">
        <label
          htmlFor="doc-title"
          className="mb-1.5 block text-xs font-medium text-gray-500"
        >
          Document title
        </label>
        <input
          id="doc-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
        />
      </div>

      {/* Content editor */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <p className="text-sm font-medium text-gray-900">Document content</p>
          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            AI draft — review before saving
          </span>
        </div>
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={saving}
            rows={40}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm leading-relaxed text-gray-800 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
          />
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Bottom actions */}
      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={handleDiscard}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !content.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save as new document'}
        </button>
      </div>
    </div>
  )
}
