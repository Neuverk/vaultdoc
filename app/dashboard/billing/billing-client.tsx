'use client'

import { useState } from 'react'
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
  )
}