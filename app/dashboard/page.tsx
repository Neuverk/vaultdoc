import { currentUser, auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { documents, users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { PLANS, PlanType } from '@/lib/plans'

export default async function DashboardPage() {
  const user = await currentUser()
  const { userId } = await auth()

  let docCount = 0
  let plan: PlanType = 'free'

  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId!),
    })
    if (dbUser) {
      const docs = await db.query.documents.findMany({
        where: eq(documents.tenantId, dbUser.tenantId!),
      })
      docCount = docs.length

      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, dbUser.tenantId!),
      })
      plan = (tenant?.plan ?? 'free') as PlanType
    }
  } catch (e) {
    console.error('Dashboard error:', e)
  }

  const isAtLimit = plan === 'free' && docCount >= 3

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Upgrade banner */}
        {isAtLimit && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-800">You've reached the Free plan limit</p>
              <p className="text-sm text-amber-700 mt-0.5">
                {docCount}/3 documents used. Upgrade to create unlimited documents.
              </p>
            </div>
            <Link
              href="/dashboard/billing"
              className="ml-4 shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
            >
              Upgrade →
            </Link>
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Your compliance documentation platform is ready.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Link href="/dashboard/library" className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs text-blue-600 font-medium">View all →</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{docCount}</div>
            <div className="text-sm text-gray-500 mt-1">
              Documents {plan === 'free' ? `(${docCount}/3 free)` : ''}
            </div>
          </Link>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-500 mt-1">Pending approval</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">—</div>
            <div className="text-sm text-gray-500 mt-1">Compliance gaps</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">—</div>
            <div className="text-sm text-gray-500 mt-1">Audit readiness</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <Link
              href={isAtLimit ? '/dashboard/billing' : '/dashboard/documents/new'}
              className={`border rounded-xl p-5 transition-all block group ${
                isAtLimit
                  ? 'border-amber-200 bg-amber-50 hover:border-amber-400'
                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition ${
                isAtLimit ? 'bg-amber-100 group-hover:bg-amber-200' : 'bg-blue-100 group-hover:bg-blue-200'
              }`}>
                <svg className={`w-5 h-5 ${isAtLimit ? 'text-amber-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="font-medium text-gray-900 text-sm">
                {isAtLimit ? 'Upgrade to create more' : 'Create document'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {isAtLimit ? 'Free limit reached — upgrade now' : 'SOP, Policy, Runbook and more'}
              </div>
            </Link>

            <Link href="/dashboard/library" className="border border-gray-200 rounded-xl p-5 hover:border-purple-400 hover:bg-purple-50 transition-all block group">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <div className="font-medium text-gray-900 text-sm">Document library</div>
              <div className="text-xs text-gray-500 mt-1">{docCount} document{docCount !== 1 ? 's' : ''} saved</div>
            </Link>

            <Link href="/dashboard" className="border border-gray-200 rounded-xl p-5 hover:border-green-400 hover:bg-green-50 transition-all block group">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="font-medium text-gray-900 text-sm">Audit readiness</div>
              <div className="text-xs text-gray-500 mt-1">ISO 27001, TISAX, GDPR score</div>
            </Link>
          </div>
        </div>

        {/* Recent documents */}
        {docCount > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Recent documents</h2>
              <Link href="/dashboard/library" className="text-sm text-blue-600 hover:text-blue-700">
                View all →
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              You have {docCount} document{docCount !== 1 ? 's' : ''} in your library.{' '}
              <Link href="/dashboard/library" className="text-blue-600 hover:underline">
                Open library →
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}