import { UserButton } from '@clerk/nextjs'
import { auth, currentUser } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const user = await currentUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
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

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Your compliance documentation platform is ready.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Documents', value: '0', color: 'blue' },
            { label: 'Pending approval', value: '0', color: 'amber' },
            { label: 'Compliance gaps', value: '—', color: 'red' },
            { label: 'Audit readiness', value: '—', color: 'green' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Create document', desc: 'SOP, Policy, Runbook and more', icon: '📄' },
              { title: 'Run gap analysis', desc: 'Upload docs, find what is missing', icon: '🔍' },
              { title: 'View audit score', desc: 'ISO 27001, TISAX, GDPR readiness', icon: '✅' },
            ].map((action) => (
              <div
                key={action.title}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="font-medium text-gray-900 text-sm">{action.title}</div>
                <div className="text-xs text-gray-500 mt-1">{action.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}