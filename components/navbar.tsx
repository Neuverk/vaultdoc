import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function Navbar() {
  const user = await currentUser()

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <a href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">V</span>
        </div>
        <div>
          <span className="font-semibold text-gray-900">Vaultdoc</span>
          <span className="text-xs text-gray-500 ml-2">by Neuverk</span>
        </div>
      </a>
      <div className="flex items-center gap-4">
        <a href="/dashboard/documents/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New document
        </a>
        <a href="/dashboard/library" className="text-sm text-gray-600 hover:text-gray-900">
          Library
        </a>
        <a href="/dashboard/billing" className="text-sm text-gray-600 hover:text-gray-900">
          Billing
        </a>
        <span className="text-sm text-gray-600">
          {user?.firstName || user?.emailAddresses[0]?.emailAddress}
        </span>
        <UserButton />
      </div>
    </div>
  )
}