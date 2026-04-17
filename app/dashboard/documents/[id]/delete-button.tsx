'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteButton({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error ?? 'Failed to delete document.')
        setLoading(false)
        setConfirming(false)
        return
      }

      router.push('/dashboard/library')
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Delete this document?</span>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Confirm delete'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm transition hover:border-red-200 hover:text-red-600"
    >
      Delete
    </button>
  )
}
