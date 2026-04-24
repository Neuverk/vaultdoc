'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

// ─── Invitation flow (Clerk ticket) ───────────────────────────────────────────
function InvitationSignUpView() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          
          <div className="hidden lg:block">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              You&apos;re invited
            </div>

            <h1 className="text-4xl font-semibold text-gray-900">
              Create your VaultDoc account
            </h1>

            <p className="mt-4 text-gray-600">
              You&apos;ve been approved for VaultDoc beta access. Set up your account below.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
              <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/dashboard"
                forceRedirectUrl="/dashboard"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Beta request form ────────────────────────────────────────────────────────
function BetaRequestView() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/beta-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) setStatus('success')
    else setStatus('error')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm">

        {status === 'success' ? (
          <div className="text-center">
            <h2 className="text-lg font-semibold">Request received</h2>
            <p className="text-sm text-gray-600 mt-2">
              We’ll notify you when approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-lg font-semibold">Request beta access</h2>

            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border p-2 rounded"
            />

            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border p-2 rounded"
            />

            <input
              required
              placeholder="Company"
              value={form.company}
              onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))}
              className="w-full border p-2 rounded"
            />

            <button className="w-full bg-black text-white py-2 rounded">
              {status === 'loading' ? 'Submitting...' : 'Request access'}
            </button>
          </form>
        )}

      </div>
    </div>
  )
}

// ─── Router ───────────────────────────────────────────────────────────────────
function SignUpRouter() {
  const searchParams = useSearchParams()

  const hasInvitationTicket =
    searchParams.has('__clerk_ticket') ||
    searchParams.get('__clerk_status') === 'sign_up'

  return hasInvitationTicket
    ? <InvitationSignUpView />
    : <BetaRequestView />
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignUpRouter />
    </Suspense>
  )
}