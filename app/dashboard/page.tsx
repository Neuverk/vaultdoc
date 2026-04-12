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
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Welcome */}
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                VaultDoc workspace
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Your compliance documentation platform is ready. Create new
                policies, manage documentation, and monitor your workspace from
                one central dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Plan
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                  {plan}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Documents
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  {docCount}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 col-span-2 sm:col-span-1">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Status
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900">
                  Active workspace
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Upgrade banner */}
        {isAtLimit && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  You&apos;ve reached the Free plan limit
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {docCount}/3 documents used. Upgrade your workspace to create
                  more documents without Free plan restrictions.
                </p>
              </div>

              <Link
                href="/dashboard/billing"
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Upgrade plan →
              </Link>
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/dashboard/library"
            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <span className="text-xs font-medium text-gray-500 transition group-hover:text-gray-900">
                View library →
              </span>
            </div>

            <div className="text-3xl font-semibold tracking-tight text-gray-900">
              {docCount}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Documents {plan === 'free' ? `(${docCount}/3 free)` : ''}
            </div>
          </Link>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="text-3xl font-semibold tracking-tight text-gray-900">
              0
            </div>
            <div className="mt-2 text-sm text-gray-600">Pending approval</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="text-3xl font-semibold tracking-tight text-gray-900">
              —
            </div>
            <div className="mt-2 text-sm text-gray-600">Compliance gaps</div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>

            <div className="text-3xl font-semibold tracking-tight text-gray-900">
              —
            </div>
            <div className="mt-2 text-sm text-gray-600">Audit readiness</div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Access the main workflows for your VaultDoc workspace.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Link
              href={isAtLimit ? '/dashboard/billing' : '/dashboard/documents/new'}
              className={`group block rounded-2xl border p-6 transition ${
                isAtLimit
                  ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${
                  isAtLimit
                    ? 'border-amber-200 bg-white text-amber-700'
                    : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>

              <div className="text-sm font-semibold text-gray-900">
                {isAtLimit ? 'Upgrade to create more' : 'Create document'}
              </div>
              <div className="mt-1 text-sm leading-6 text-gray-600">
                {isAtLimit
                  ? 'Free limit reached. Upgrade your plan to continue creating documents.'
                  : 'Create a new SOP, policy, runbook, or other compliance document.'}
              </div>
            </Link>

            <Link
              href="/dashboard/library"
              className="group block rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-gray-300 hover:bg-white"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                  />
                </svg>
              </div>

              <div className="text-sm font-semibold text-gray-900">
                Document library
              </div>
              <div className="mt-1 text-sm leading-6 text-gray-600">
                {docCount} document{docCount !== 1 ? 's' : ''} saved in your
                workspace library.
              </div>
            </Link>

            <Link
              href="/dashboard"
              className="group block rounded-2xl border border-gray-200 bg-gray-50 p-6 transition hover:border-gray-300 hover:bg-white"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              <div className="text-sm font-semibold text-gray-900">
                Audit readiness
              </div>
              <div className="mt-1 text-sm leading-6 text-gray-600">
                Review ISO 27001, TISAX, GDPR, and related framework readiness
                indicators.
              </div>
            </Link>
          </div>
        </section>

        {/* Recent documents */}
        {docCount > 0 && (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent documents
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  You have {docCount} document{docCount !== 1 ? 's' : ''} in your
                  library.
                </p>
              </div>

              <Link
                href="/dashboard/library"
                className="text-sm font-medium text-gray-700 transition hover:text-gray-900"
              >
                View all →
              </Link>
            </div>

            <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm text-gray-600">
                Open your saved documents and continue working from the library.{' '}
                <Link
                  href="/dashboard/library"
                  className="font-medium text-gray-900 transition hover:underline"
                >
                  Open library →
                </Link>
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}