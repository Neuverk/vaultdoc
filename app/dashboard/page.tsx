import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900">Vaultdoc</span>
            <span className="text-xs text-gray-500 ml-2">by Neuverk</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.firstName || user?.emailAddresses[0]?.emailAddress}
          </span>
          <UserButton />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Your compliance documentation platform is ready.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Documents', value: '0' },
            { label: 'Pending approval', value: '0' },
            { label: 'Compliance gaps', value: '—' },
            { label: 'Audit readiness', value: '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <a href="/dashboard/documents/new" className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all block">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium text-gray-900 text-sm">Create document</div>
              <div className="text-xs text-gray-500 mt-1">SOP, Policy, Runbook and more</div>
            </a>
            <a href="/dashboard" className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all block">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-medium text-gray-900 text-sm">Run gap analysis</div>
              <div className="text-xs text-gray-500 mt-1">Upload docs, find what is missing</div>
            </a>
            <a href="/dashboard" className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-all block">
              <div className="text-2xl mb-2">✅</div>
              <div className="font-medium text-gray-900 text-sm">View audit score</div>
              <div className="text-xs text-gray-500 mt-1">ISO 27001, TISAX, GDPR readiness</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}