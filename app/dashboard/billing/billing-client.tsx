'use client'

import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { PLANS, PlanType } from '@/lib/plans'

export function BillingClient({
  currentPlan,
}: {
  currentPlan: PlanType
  tenantId: string
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handlePlanAction = async (plan: PlanType) => {
    if (plan === 'free') return
    setLoading(plan)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(null)
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {(Object.entries(PLANS) as [PlanType, (typeof PLANS)[PlanType]][]).map(
          ([key, plan]) => (
            <div
              key={key}
              className={`rounded-3xl bg-white p-7 shadow-sm ${
                currentPlan === key
                  ? 'border-2 border-gray-900'
                  : 'border border-gray-200'
              }`}
            >
              {currentPlan === key && (
                <span className="mb-4 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Current plan
                </span>
              )}

              <p className="text-lg font-semibold text-gray-900">{plan.name}</p>

              <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900">
                €{plan.price}
                <span className="ml-1 text-base font-normal text-gray-500">/mo</span>
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <svg
                      className="h-4 w-4 shrink-0 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanAction(key)}
                disabled={currentPlan === key || loading === key || key === 'free'}
                className={`mt-7 w-full rounded-xl py-3 text-sm font-semibold transition ${
                  currentPlan === key
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : key === 'free'
                      ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {currentPlan === key
                  ? 'Current Plan'
                  : key === 'free'
                    ? 'Free'
                    : loading === key
                      ? 'Loading…'
                      : 'Upgrade'}
              </button>
            </div>
          ),
        )}
      </div>

      <DeleteAccountSection />
    </>
  )
}

function DeleteAccountSection() {
  const { signOut } = useClerk()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data?.error ?? 'Account deletion failed. Please try again.')
        setLoading(false)
        setConfirming(false)
        return
      }

      await signOut({ redirectUrl: '/' })
    } catch {
      alert('Something went wrong. Please try again.')
      setLoading(false)
      setConfirming(false)
    }
  }

  return (
    <section className="rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Delete account</h2>

      <p className="mt-2 max-w-prose text-sm leading-6 text-gray-500">
        Permanently deletes your account and all associated documents. Any
        active subscription will be cancelled. This action cannot be undone and
        satisfies your right to erasure under GDPR Article 17. Some data held
        by third-party processors may take additional time to be fully removed.
      </p>

      <div className="mt-6">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Delete account
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-semibold text-red-800">
              This action is permanent and cannot be reversed.
            </p>
            <p className="mt-1 text-sm text-red-700">
              All your documents, settings, and account data will be deleted
              immediately. You will be signed out.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Deleting…' : 'Yes, permanently delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
