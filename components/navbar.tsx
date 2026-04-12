import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function Navbar() {
  const user = await currentUser()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <a
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              V
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              VaultDoc
            </span>
            <span className="text-xs font-medium text-gray-500">
              by Neuverk
            </span>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            <a
              href="/dashboard/library"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Library
            </a>

            <a
              href="/dashboard/billing"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Billing
            </a>
          </nav>

          <a
            href="/dashboard/documents/new"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
          >
            + New document
          </a>

          <div className="hidden h-6 w-px bg-gray-200 md:block" />

          <span className="hidden text-sm font-medium text-gray-600 md:block">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>

          <div className="rounded-full border border-gray-200 bg-white p-1 shadow-sm">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  )
}