import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { BetaRequestsClient } from './beta-requests-client'

export const dynamic = 'force-dynamic'

export default async function BetaRequestsPage() {
  const requests = await db.query.betaRequests.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })

  const pending = requests.filter((r) => r.status === 'pending').length
  const approved = requests.filter((r) => r.status === 'approved').length
  const rejected = requests.filter((r) => r.status === 'rejected').length

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-[15px] font-semibold text-gray-900">Beta Requests</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Review and manage access requests. Approving sends a Clerk invitation and welcome email.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            {[
              { label: 'Pending', value: pending },
              { label: 'Approved', value: approved },
              { label: 'Rejected', value: rejected },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-semibold tabular-nums text-gray-900">{s.value}</div>
                <div className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mt-0.5">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-8 py-6">
        <BetaRequestsClient requests={requests} />
      </div>
    </div>
  )
}
