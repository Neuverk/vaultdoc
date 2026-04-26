import Navbar from '@/components/navbar'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
    columns: { deletedAt: true, firstName: true },
  })

  if (dbUser?.deletedAt) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-6">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-red-200 bg-red-50">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Account scheduled for deletion</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              This account has been scheduled for deletion. Access has been disabled. Your data will be retained for 7 days before permanent deletion.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              If this was a mistake, contact{' '}
              <a href="mailto:support@vaultdoc.io" className="text-gray-900 underline underline-offset-2 hover:opacity-70">
                VaultDoc support
              </a>{' '}
              immediately.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  )
}
