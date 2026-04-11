import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="font-semibold text-white tracking-tight">Vaultdoc</span>
          <span className="text-xs text-white/30 ml-0.5">by Neuverk</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-white/50 hover:text-white cursor-pointer transition">Features</span>
          <span className="text-sm text-white/50 hover:text-white cursor-pointer transition">Pricing</span>
          <span className="text-sm text-white/50 hover:text-white cursor-pointer transition">Docs</span>
          <Link href="/sign-in" className="text-sm text-white/70 hover:text-white transition">
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/60 text-xs px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
          AI-powered compliance documentation platform
        </div>
        <h1 className="text-6xl font-bold leading-tight tracking-tight mb-6">
          Compliance docs,
          <br />
          <span className="text-blue-400">built in seconds.</span>
        </h1>
        <p className="text-lg text-white/50 mb-10 max-w-xl mx-auto leading-relaxed">
          Generate audit-ready SOPs, Policies and Runbooks aligned to
          ISO 27001, TISAX, GDPR and 10+ frameworks. Trusted by IT teams and CISOs.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-7 py-3 rounded-xl text-sm transition"
          >
            Start for free →
          </Link>
          <Link
            href="/sign-in"
            className="border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium px-7 py-3 rounded-xl text-sm transition"
          >
            Sign in
          </Link>
        </div>
        <p className="text-xs text-white/25 mt-5">No credit card required · Free plan available</p>
      </div>

      {/* Feature grid */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '📄', title: 'AI document generation', desc: 'Type what you need. Get a complete SOP, Policy or Runbook in seconds.' },
            { icon: '🔗', title: '13+ frameworks', desc: 'ISO 27001:2022, TISAX, GDPR, ITIL v4, SOC 2, NIST, NIS2, DORA and more.' },
            { icon: '🔍', title: 'Gap analysis', desc: 'Upload your docs. AI finds every missing control for your certification.' },
            { icon: '📊', title: 'Audit readiness score', desc: 'Real-time score per framework. Know exactly what your auditor will find.' },
            { icon: '📚', title: 'Knowledge base', desc: 'Publish approved documents as a searchable internal portal.' },
            { icon: '🔐', title: 'Enterprise-grade security', desc: 'Microsoft Entra SSO, role-based access, confidentiality levels, audit logs.' },
          ].map(f => (
            <div
              key={f.title}
              className="border border-white/8 bg-white/3 rounded-xl p-5 hover:border-white/15 hover:bg-white/5 transition"
            >
              <div className="text-xl mb-3">{f.icon}</div>
              <div className="font-medium text-white text-sm mb-1.5">{f.title}</div>
              <div className="text-xs text-white/40 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="border border-white/8 bg-white/3 rounded-2xl p-8 grid grid-cols-4 gap-6 text-center">
          {[
            { val: '13+', lbl: 'Frameworks supported' },
            { val: '< 30s', lbl: 'Document generation' },
            { val: '100%', lbl: 'Audit-ready output' },
            { val: 'EU', lbl: 'GDPR-compliant hosting' },
          ].map(s => (
            <div key={s.lbl}>
              <div className="text-2xl font-bold text-blue-400 mb-1">{s.val}</div>
              <div className="text-xs text-white/40">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4 tracking-tight">Ready to get audit-ready?</h2>
        <p className="text-white/40 mb-8 text-sm">
          Join IT teams and CISOs using Vaultdoc to automate compliance documentation.
        </p>
        <Link
          href="/sign-up"
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl text-sm transition inline-block"
        >
          Start for free →
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6 max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">V</span>
          </div>
          <span className="text-xs text-white/30">Vaultdoc by Neuverk · © 2026</span>
        </div>
        <div className="flex gap-6">
          <span className="text-xs text-white/25 hover:text-white/50 cursor-pointer transition">Privacy</span>
          <span className="text-xs text-white/25 hover:text-white/50 cursor-pointer transition">Terms</span>
          <span className="text-xs text-white/25 hover:text-white/50 cursor-pointer transition">Contact</span>
        </div>
      </footer>
    </div>
  )
}