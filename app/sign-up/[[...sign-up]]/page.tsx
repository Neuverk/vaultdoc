'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SignUpPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
    useCase: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/beta-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (res.status === 409) {
        setErrorMessage('This email has already been submitted.')
        setStatus('error')
        return
      }

      if (!res.ok) {
        setErrorMessage('Something went wrong. Please try again.')
        setStatus('error')
        return
      }

      setStatus('success')
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Private beta
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
              Request access to VaultDoc
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-gray-600">
              VaultDoc is currently in private beta. Request access and we&apos;ll
              notify you when your workspace is approved.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Structured document creation
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Generate SOPs, policies, runbooks, and control documentation faster
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Framework-aligned compliance
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  ISO 27001, TISAX, SOC 2, GDPR — audit-ready output in minutes, not weeks
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-900">
                  Enterprise-ready platform
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  GDPR-first product direction with a calm, professional workspace
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500">
              Already have access?{' '}
              <Link href="/sign-in" className="font-medium text-gray-900 hover:underline">
                Sign in →
              </Link>
            </p>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              {status === 'success' ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Request received</h2>
                  <p className="mt-2 text-sm text-gray-600">
                    We&apos;ll review your request and notify you when your workspace is approved.
                  </p>
                  <Link
                    href="/sign-in"
                    className="mt-6 inline-block text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    Already approved? Sign in →
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">Request beta access</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Tell us a bit about yourself and we&apos;ll be in touch.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Full name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Jane Smith"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Work email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="jane@company.com"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Company name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.company}
                        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                        placeholder="Acme GmbH"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Job title{' '}
                        <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                        placeholder="CISO, Head of IT, Compliance Manager…"
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700">
                        Use case{' '}
                        <span className="font-normal text-gray-500">(optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={form.useCase}
                        onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}
                        placeholder="We need to build ISO 27001 documentation for our upcoming audit..."
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                      />
                    </div>

                    {status === 'error' && (
                      <p className="text-sm text-red-600">{errorMessage}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'loading'}
                      className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                    >
                      {status === 'loading' ? 'Submitting…' : 'Request access →'}
                    </button>

                    <p className="text-center text-xs text-gray-500">
                      Already have access?{' '}
                      <Link href="/sign-in" className="font-medium text-gray-700 hover:text-gray-900">
                        Sign in
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
