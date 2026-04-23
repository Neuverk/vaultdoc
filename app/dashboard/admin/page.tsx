import { db } from '@/lib/db'
import { tenants, users, documents, betaRequests } from '@/lib/db/schema'
import { desc, eq, gte, ne, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string | number
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
      <div className="text-2xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</div>
      <div className="mt-1 text-xs font-medium text-gray-500">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-400">{sub}</div>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    [{ totalUsers }],
    [{ totalTenants }],
    [{ totalDocs }],
    [{ paidTenants }],
    [{ docs7d }],
    [{ docs30d }],
    betaStats,
    recentUsers,
    recentApprovedBeta,
    recentDocs,
  ] = await Promise.all([
    db.select({ totalUsers: sql<number>`count(*)` }).from(users),
    db.select({ totalTenants: sql<number>`count(*)` }).from(tenants),
    db.select({ totalDocs: sql<number>`count(*)` }).from(documents),
    db.select({ paidTenants: sql<number>`count(*)` }).from(tenants).where(ne(tenants.plan, 'free')),
    db.select({ docs7d: sql<number>`count(*)` }).from(documents).where(gte(documents.createdAt, sevenDaysAgo)),
    db.select({ docs30d: sql<number>`count(*)` }).from(documents).where(gte(documents.createdAt, thirtyDaysAgo)),
    db.select({ status: betaRequests.status, count: sql<number>`count(*)` })
      .from(betaRequests)
      .groupBy(betaRequests.status),
    db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      createdAt: users.createdAt,
    })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5),
    db.select({
      id: betaRequests.id,
      name: betaRequests.name,
      email: betaRequests.email,
      company: betaRequests.company,
      reviewedAt: betaRequests.reviewedAt,
    })
      .from(betaRequests)
      .where(eq(betaRequests.status, 'approved'))
      .orderBy(desc(betaRequests.reviewedAt))
      .limit(5),
    db.select({
      id: documents.id,
      title: documents.title,
      type: documents.type,
      createdAt: documents.createdAt,
    })
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(5),
  ])

  const betaMap = Object.fromEntries(betaStats.map((b) => [b.status, Number(b.count)]))
  const pendingBeta = betaMap['pending'] ?? 0
  const approvedBeta = betaMap['approved'] ?? 0
  const rejectedBeta = betaMap['rejected'] ?? 0
  const totalBeta = pendingBeta + approvedBeta + rejectedBeta

  return (
    <div className="max-w-300">
      {/* Page header */}
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-[15px] font-semibold text-gray-900">Overview</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Platform health at a glance — users, documents, and beta requests.
        </p>
      </div>

      <div className="px-8 py-6 space-y-8">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/dashboard/admin/beta-requests', label: 'Review beta requests' },
            { href: '/dashboard/admin/users', label: 'View all users' },
            { href: '/dashboard/admin/documents', label: 'Recent documents' },
            { href: '/dashboard/admin/billing', label: 'Manage plans' },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
            >
              {a.label}
            </Link>
          ))}
        </div>

        {/* Platform metrics */}
        <div>
          <SectionLabel>Platform</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Total users" value={Number(totalUsers)} />
            <MetricCard label="Organizations" value={Number(totalTenants)} />
            <MetricCard
              label="Paid orgs"
              value={Number(paidTenants)}
              sub={`${Number(totalTenants) - Number(paidTenants)} on free`}
            />
            <MetricCard label="Total documents" value={Number(totalDocs)} />
          </div>
        </div>

        {/* Document activity */}
        <div>
          <SectionLabel>Document generation</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Last 7 days" value={Number(docs7d)} />
            <MetricCard label="Last 30 days" value={Number(docs30d)} />
            <MetricCard label="All time" value={Number(totalDocs)} />
          </div>
        </div>

        {/* Beta metrics */}
        <div>
          <SectionLabel>Beta requests</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="Total" value={totalBeta} />
            <MetricCard label="Pending" value={pendingBeta} />
            <MetricCard label="Approved" value={approvedBeta} />
            <MetricCard label="Rejected" value={rejectedBeta} />
          </div>
        </div>

        {/* Recent activity panels */}
        <div>
          <SectionLabel>Recent activity</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-3">
            <RecentPanel title="Signups" href="/dashboard/admin/users">
              {recentUsers.length === 0 ? (
                <EmptyRow>No users yet.</EmptyRow>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 truncate">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                          : u.email}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    </div>
                    <div className="shrink-0 text-[11px] text-gray-400 ml-3">
                      {u.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </RecentPanel>

            <RecentPanel title="Approved beta" href="/dashboard/admin/beta-requests">
              {recentApprovedBeta.length === 0 ? (
                <EmptyRow>None approved yet.</EmptyRow>
              ) : (
                recentApprovedBeta.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 truncate">{r.name}</div>
                      <div className="text-xs text-gray-400 truncate">{r.company}</div>
                    </div>
                    <div className="shrink-0 text-[11px] text-gray-400 ml-3">
                      {r.reviewedAt
                        ? r.reviewedAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                        : '—'}
                    </div>
                  </div>
                ))
              )}
            </RecentPanel>

            <RecentPanel title="Documents" href="/dashboard/admin/documents">
              {recentDocs.length === 0 ? (
                <EmptyRow>No documents yet.</EmptyRow>
              ) : (
                recentDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-gray-900 truncate">{d.title}</div>
                      <div className="text-xs text-gray-400">{d.type}</div>
                    </div>
                    <div className="shrink-0 text-[11px] text-gray-400 ml-3">
                      {d.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                ))
              )}
            </RecentPanel>
          </div>
        </div>

        {/* Pending beta alert */}
        {pendingBeta > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-amber-900">
                {pendingBeta} pending beta {pendingBeta === 1 ? 'request' : 'requests'}
              </span>
              <span className="ml-2 text-sm text-amber-700">awaiting review.</span>
            </div>
            <Link
              href="/dashboard/admin/beta-requests"
              className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50 transition"
            >
              Review →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
      {children}
    </div>
  )
}

function RecentPanel({
  title,
  href,
  children,
}: {
  title: string
  href: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-[13px] font-semibold text-gray-900">{title}</span>
        <Link href={href} className="text-[11px] font-medium text-gray-400 hover:text-gray-700 transition">
          View all →
        </Link>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-6 text-center text-sm text-gray-400">{children}</div>
  )
}
