import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">V</span>
          </div>
          <span className="font-bold text-gray-900">Vaultdoc</span>
          <span className="text-xs text-gray-400 ml-1">by Neuverk</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span>✨</span>
          <span>AI-powered compliance documentation</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Compliance documentation,<br />
          <span className="text-blue-600">built by AI in seconds</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
          Generate audit-ready SOPs, Policies and Runbooks aligned to ISO 27001,
          TISAX, GDPR and 10+ frameworks. Trusted by IT teams and CISOs.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-xl text-base"
          >
            Start for free →
          </Link>
          <Link
            href="/sign-in"
            className="border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-xl text-base"
          >
            Sign in
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: '📄',
              title: 'AI document generation',
              desc: 'Generate complete SOPs, Policies, Runbooks and more in seconds. Just describe what you need.',
            },
            {
              icon: '✅',
              title: 'Multi-framework compliance',
              desc: 'ISO 27001:2022, TISAX, GDPR, ITIL v4, SOC 2, NIST and 8 more frameworks supported.',
            },
            {
              icon: '🔍',
              title: 'Gap analysis',
              desc: 'Upload your existing documents. AI finds what is missing for certification.',
            },
            {
              icon: '📊',
              title: 'Audit readiness score',
              desc: 'Know exactly how ready you are for ISO 27001 or TISAX audit at any time.',
            },
            {
              icon: '📚',
              title: 'Knowledge base',
              desc: 'Publish approved documents as a searchable internal portal like Confluence.',
            },
            {
              icon: '🔐',
              title: 'Enterprise security',
              desc: 'SSO with Microsoft Entra, role-based access, confidentiality levels, audit logs.',
            },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-gray-900 mb-2 text-sm">{f.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="bg-blue-600 rounded-2xl p-10 text-white">
          <h2 className="text-2xl font-bold mb-3">Ready to get audit-ready?</h2>
          <p className="text-blue-100 mb-6 text-sm">
            Join companies using Vaultdoc to automate their compliance documentation.
          </p>
          <Link
            href="/sign-up"
            className="bg-white text-blue-600 hover:bg-blue-50 font-medium px-8 py-3 rounded-xl text-sm inline-block"
          >
            Start for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6 text-center">
        <p className="text-xs text-gray-400">
          © 2026 Neuverk Innovations · Vaultdoc · All rights reserved
        </p>
      </footer>
    </div>
  )
}