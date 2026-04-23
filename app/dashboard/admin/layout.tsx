import { auth, currentUser } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import { isPlatformAdmin } from '@/lib/admin'
import { db } from '@/lib/db'
import { betaRequests } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) return notFound()

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null
  if (!isPlatformAdmin(email)) return notFound()

  const [{ value: pendingCount }] = await db
    .select({ value: sql<number>`count(*)` })
    .from(betaRequests)
    .where(eq(betaRequests.status, 'pending'))

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="w-64 flex-none border-r border-gray-200 bg-white sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
        <AdminNav pendingBetaCount={Number(pendingCount)} />
      </aside>
      <div className="flex-1 min-w-0 bg-gray-50">
        {children}
      </div>
    </div>
  )
}
