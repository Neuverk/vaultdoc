import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { isPlatformAdmin } from '@/lib/admin'
import { notFound } from 'next/navigation'
import { BetaRequestsClient } from './beta-requests-client'

export const dynamic = 'force-dynamic'

export default async function BetaRequestsPage() {
  const { userId } = await auth()
  if (!userId) return notFound()

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null
  if (!isPlatformAdmin(email)) return notFound()

  const requests = await db.query.betaRequests.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Beta access
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Beta requests
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Review, approve, or reject incoming beta access requests. Approving
                sends a Clerk invitation and a welcome email automatically.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Total',
                  value: requests.length,
                },
                {
                  label: 'Pending',
                  value: requests.filter((r) => r.status === 'pending').length,
                },
                {
                  label: 'Approved',
                  value: requests.filter((r) => r.status === 'approved').length,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-center"
                >
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <BetaRequestsClient requests={requests} />
      </div>
    </div>
  )
}
