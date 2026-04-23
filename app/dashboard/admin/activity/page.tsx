import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, string> = {
  beta_approved: 'Beta request approved',
  beta_rejected: 'Beta request rejected',
  plan_updated: 'Plan updated',
  user_blocked: 'User blocked',
  user_unblocked: 'User unblocked',
  note_added: 'Internal note added',
  invite_sent: 'Invite sent',
}

const ACTION_COLORS: Record<string, string> = {
  beta_approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  beta_rejected: 'bg-red-50 text-red-700 border-red-200',
  plan_updated: 'bg-blue-50 text-blue-700 border-blue-200',
  user_blocked: 'bg-red-50 text-red-700 border-red-200',
  user_unblocked: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  note_added: 'bg-gray-50 text-gray-700 border-gray-200',
  invite_sent: 'bg-blue-50 text-blue-700 border-blue-200',
}

export default async function AdminActivityPage() {
  const logs = await db.query.adminActivityLogs.findMany({
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 200,
  })

  return (
    <div className="max-w-300">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-[15px] font-semibold text-gray-900">Activity</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Internal admin action log — approvals, plan changes, and user management.
        </p>
      </div>

      <div className="px-8 py-6">
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-3">
            <span className="text-[13px] font-semibold text-gray-700">Admin actions</span>
            <span className="text-[11px] text-gray-400 tabular-nums">
              {logs.length} log{logs.length !== 1 ? 's' : ''}
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="text-sm font-medium text-gray-500">No activity logged yet.</div>
              <div className="mt-1 text-xs text-gray-400">
                Actions like beta approvals, plan changes, and user management will appear here.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const label = ACTION_LABELS[log.action] ?? log.action.replace(/_/g, ' ')
                const colorCls = ACTION_COLORS[log.action] ?? 'bg-gray-50 text-gray-700 border-gray-200'
                let meta: Record<string, unknown> = {}
                try {
                  meta = JSON.parse(log.metadata ?? '{}')
                } catch {
                  // ignore malformed JSON
                }

                return (
                  <div key={log.id} className="flex items-start gap-4 px-5 py-3.5">
                    <div className="shrink-0 pt-0.5">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${colorCls}`}>
                        {label}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        {log.targetEmail && (
                          <span className="text-[13px] font-medium text-gray-900 truncate">
                            {log.targetEmail}
                          </span>
                        )}
                        {log.targetType && (
                          <span className="text-[11px] text-gray-400 capitalize">
                            {log.targetType.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {log.note && (
                        <p className="mt-0.5 text-xs text-gray-600">{log.note}</p>
                      )}
                      {Object.keys(meta).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {Object.entries(meta).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 text-[11px] text-gray-400">
                        {log.adminEmail && <span>by {log.adminEmail} · </span>}
                        {log.createdAt.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}{' '}
                        {log.createdAt.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
