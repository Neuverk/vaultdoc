'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function BetaPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    position: '',
    useCase: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-sm font-semibold tracking-tight text-gray-900">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-gray-900">VaultDoc</span>
              <span className="text-xs font-medium text-gray-500">Neuverk</span>
            </div>
          </Link>
          <Link
            href="/sign-in"
            className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              Limited beta
            </div>

            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 lg:text-5xl">
              VaultDoc Beta —{' '}
              <span className="text-gray-500">Join the waitlist</span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              VaultDoc is an AI-powered compliance documentation platform built
              for enterprise teams. Generate audit-ready SOPs, policies, and
              runbooks aligned to ISO 27001, TISAX, SOC 2, GDPR, and more — in
              minutes, not weeks.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                'AI document generation with guided interviews',
                'Framework-aligned content (ISO, TISAX, SOC 2, GDPR)',
                'Audit-ready PDF and Word exports',
                'Centralized compliance document library',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              {status === 'success' ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
                    <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Request received
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    We&apos;ll review your request and be in touch soon.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Request beta access
                  </h2>
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
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
