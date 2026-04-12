'use client'

import { useState } from 'react'
import { PLANS, PlanType } from '@/lib/plans'

export function BillingClient({ currentPlan }: { currentPlan: PlanType; tenantId: string }) {
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
    <div className="grid gap-4 md:grid-cols-3">
      {(Object.entries(PLANS) as [PlanType, typeof PLANS[PlanType]][]).map(([key, plan]) => (
        <div
          key={key}
          className={`bg-white rounded-xl border p-6 ${
            currentPlan === key
              ? 'border-blue-500 ring-1 ring-blue-500'
              : 'border-gray-200'
          }`}
        >
          {currentPlan === key && (
            <span className="inline-block mb-3 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Current plan
            </span>
          )}
          <p className="font-semibold text-gray-900">{plan.name}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            €{plan.price}
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </p>
          <ul className="mt-4 space-y-2">
            {plan.features.map(f => (
              <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handlePlanAction(key)}
            disabled={currentPlan === key || loading === key || key === 'free'}
            className={`mt-5 w-full rounded-lg py-2 text-sm font-medium transition ${
              currentPlan === key
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : key === 'free'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
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
      ))}
    </div>
  )
}