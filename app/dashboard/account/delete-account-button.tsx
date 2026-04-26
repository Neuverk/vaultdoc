'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'

export function DeleteAccountButton() {
  const { signOut } = useClerk()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Something went wrong. Please try again.')
        return
      }
      await signOut({ redirectUrl: '/' })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition"
      >
        Delete account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-gray-900">Delete your account?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your account will be blocked immediately and all data will be permanently deleted in 7 days.
              This cannot be undone. If this was a mistake, contact{' '}
              <a href="mailto:support@vaultdoc.io" className="underline underline-offset-2 hover:opacity-70">
                VaultDoc support
              </a>{' '}
              before the 7-day window closes.
            </p>

            {error && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-3 justify-end">
              <button
                disabled={loading}
                onClick={() => { setOpen(false); setError(null) }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
