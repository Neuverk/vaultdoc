'use client'

import { useEffect, useState } from 'react'

const COOKIE_CONSENT_KEY = 'vaultdoc_cookie_consent'

type ConsentValue = 'accepted' | 'declined' | null

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentValue>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    try {
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue
      if (saved === 'accepted' || saved === 'declined') {
        setConsent(saved)
      }
    } catch {
      setConsent(null)
    }
  }, [])

  const handleConsent = (value: Exclude<ConsentValue, null>) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value)
    } catch {
      // ignore localStorage errors
    }
    setConsent(value)
  }

  if (!mounted || consent) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-gray-200 bg-white p-5 shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              Cookie notice
            </div>

            <h2 className="text-base font-semibold text-gray-900">
              We use essential service cookies
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              VaultDoc uses cookies and similar technologies to support secure sign-in
              and core platform functionality. This includes authentication-related
              cookies from Clerk and payment-related cookies or session technologies
              used during Stripe checkout. You can accept or decline this notice.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => handleConsent('declined')}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Decline
            </button>

            <button
              type="button"
              onClick={() => handleConsent('accepted')}
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}