'use client'

import { useState } from 'react'

type Status = 'idle' | 'saving' | 'saved' | 'error'

export function AdminPlanChanger({
  tenantId,
  currentPlan,
}: {
  tenantId: string
  currentPlan: string
}) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan)
  const [savedPlan, setSavedPlan] = useState(currentPlan)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSave() {
    setStatus('saving')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/update-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, newPlan: selectedPlan }),
      })

      const json = await res.json()

      if (!res.ok) {
        setErrorMsg(json.error ?? 'Something went wrong.')
        setStatus('error')
        return
      }

      setSavedPlan(selectedPlan)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setErrorMsg('Network error.')
      setStatus('error')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedPlan}
          onChange={(e) => {
            setSelectedPlan(e.target.value)
            setStatus('idle')
          }}
          disabled={status === 'saving'}
          className="min-w-35 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:border-gray-400 disabled:opacity-60"
        >
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <button
          type="button"
          onClick={handleSave}
          disabled={status === 'saving' || selectedPlan === savedPlan}
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>

      {status === 'saved' && (
        <p className="text-xs font-medium text-green-700">Plan updated.</p>
      )}
      {status === 'error' && (
        <p className="text-xs font-medium text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
