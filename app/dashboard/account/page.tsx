import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users, tenants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { DeleteAccountButton } from './delete-account-button'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    columns: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
      tenantId: true,
    },
  })

  if (!dbUser) redirect('/sign-in')

  const tenant = dbUser.tenantId
    ? await db.query.tenants.findFirst({
        where: eq(tenants.id, dbUser.tenantId),
        columns: { name: true, plan: true },
      })
    : null

  const displayName = [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ') || dbUser.email
  const joined = dbUser.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-[15px] font-semibold text-gray-900">Account</h1>
      <p className="mt-0.5 text-sm text-gray-500">Manage your account settings.</p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
        <div className="px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Profile</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Name</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{displayName}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Email</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{dbUser.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Role</dt>
              <dd className="mt-0.5 text-sm text-gray-800 capitalize">{dbUser.role}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Joined</dt>
              <dd className="mt-0.5 text-sm text-gray-800">{joined}</dd>
            </div>
          </dl>
        </div>

        {tenant && (
          <div className="px-6 py-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Workspace</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Name</dt>
                <dd className="mt-0.5 text-sm text-gray-800">{tenant.name}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Plan</dt>
                <dd className="mt-0.5 text-sm text-gray-800 capitalize">{tenant.plan ?? 'Free'}</dd>
              </div>
            </dl>
          </div>
        )}

        <div className="px-6 py-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-2">Danger zone</h2>
          <p className="text-sm text-gray-600 mb-4">
            Deleting your account is permanent. Your data will be retained for 7 days then permanently removed.
          </p>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  )
}
