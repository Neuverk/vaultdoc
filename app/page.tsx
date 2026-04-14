import Link from 'next/link'

const features = [
  {
    key: '01',
    title: 'AI document generation',
    desc: 'Generate structured SOPs, policies, and runbooks in seconds with a guided enterprise-ready workflow.',
  },
  {
    key: '02',
    title: 'Framework-aligned content',
    desc: 'Build documentation aligned to ISO 27001, TISAX, GDPR, ITIL, SOC 2, NIST, NIS2, DORA, and more.',
  },
  {
    key: '03',
    title: 'Audit-ready exports',
    desc: 'Export professional PDF and Word documents ready for auditor review, internal approval, and version control.',
  },
  {
    key: '04',
    title: 'Guided AI interviews',
    desc: 'Answer structured questions and let VaultDoc build the right document for your environment and scope.',
  },
  {
    key: '05',
    title: 'Centralized document library',
    desc: 'Maintain approved compliance content in a structured internal workspace for review and reuse.',
  },
  {
    key: '06',
    title: 'Enterprise access and governance',
    desc: 'Support role-based workflows, controlled access, and professional documentation management at scale.',
  },
]

const plans = [
  {
    name: 'Free',
    price: '€0',
    period: 'forever',
    description: 'Try VaultDoc with no commitment.',
    features: [
      '3 documents',
      'AI document generation',
      'PDF and Word export',
      'Watermarked exports',
    ],
    cta: 'Get started free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '€49',
    period: 'per month',
    description: 'For teams building out their compliance program.',
    features: [
      'Unlimited documents',
      'AI document generation',
      'PDF and Word export',
      'No watermark',
      'All frameworks',
    ],
    cta: 'Start Starter',
    href: '/sign-up',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '€199',
    period: 'per month',
    description: 'For organizations with mature compliance needs.',
    features: [
      'Everything in Starter',
      'No watermark',
      'Priority support',
      'Advanced frameworks',
      'Audit-ready exports',
    ],
    cta: 'Start Enterprise',
    href: '/sign-up',
    highlight: false,
  },
]

const stats = [
  { value: '13+', label: 'Frameworks supported' },
  { value: '< 30s', label: 'Document generation' },
  { value: 'EU', label: 'Data infrastructure' },
  { value: 'GDPR', label: 'Privacy-first design' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-sm font-semibold text-gray-900">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">VaultDoc test Website </span>
              <span className="text-xs text-gray-500">by Neuverk</span>
            </div>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-500 transition hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-500 transition hover:text-gray-900">Pricing</a>
            <a href="mailto:support@neuverk.com" className="text-sm text-gray-500 transition hover:text-gray-900">Support</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
              Sign in
            </Link>
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-20 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            AI-powered compliance documentation
          </div>

          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl lg:text-[4rem] lg:leading-[1.05]">
            Compliance documentation built for enterprise teams
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Generate audit-ready SOPs, policies, and runbooks aligned to ISO 27001, TISAX, GDPR, and more. Built for IT, security, and governance teams that need speed, structure, and credibility.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
              Start for free
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
              Sign in to your account
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Free plan available. No credit card required.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-semibold tracking-tight text-gray-900">{item.value}</div>
                <div className="mt-1 text-sm text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Core capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Everything your team needs to build audit-ready documentation
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            VaultDoc combines AI generation, framework alignment, and professional exports into a single platform designed for compliance teams.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600">
                  {feature.key}
                </div>
                <div className="h-px flex-1 bg-gray-100" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm leading-6 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
          <div className="mb-10 max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
              How it works
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
              From blank page to audit-ready document in under a minute
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', title: 'Describe your needs', desc: 'Select the document type, compliance framework, and your environment. VaultDoc asks the right questions.' },
              { step: '02', title: 'AI builds the document', desc: 'Our AI generates a structured, framework-aligned document tailored to your answers in seconds.' },
              { step: '03', title: 'Export and use', desc: 'Download a professional PDF or Word document ready for auditor review, team approval, or version control.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-100 bg-gray-50 p-6">
                <div className="mb-4 text-2xl font-semibold text-gray-200">{item.step}</div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm leading-6 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-12 max-w-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Pricing
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Start free and upgrade when you need more. No hidden fees, no contracts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-8 shadow-sm ${
                plan.highlight
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <p className={`text-sm font-semibold ${plan.highlight ? 'text-gray-300' : 'text-gray-500'}`}>
                {plan.name}
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className={`text-4xl font-semibold tracking-tight ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                </span>
                <span className={`mb-1 text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                  /{plan.period}
                </span>
              </div>
              <p className={`mt-2 text-sm ${plan.highlight ? 'text-gray-400' : 'text-gray-500'}`}>
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-gray-300' : 'text-gray-600'}`}>
                    <svg className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition ${
                  plan.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Why VaultDoc</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">
              Documentation that looks structured, credible, and ready for review
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              Move away from fragmented documents and inconsistent templates. VaultDoc gives teams a structured, standardized way to build documentation for audits, internal governance, and operational maturity.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Built for Europe</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-gray-900">
              GDPR-first, EU-focused, and designed for enterprise trust expectations
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              VaultDoc is built with European compliance expectations in mind. Privacy-conscious architecture, EU data infrastructure strategy, and a trust-led product approach for organizations that take governance seriously.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-16 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Get started</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            Start building compliance documentation today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
            Join teams using VaultDoc to generate professional, audit-ready documentation in seconds. Free plan available, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800">
              Start for free
            </Link>
            <Link href="/sign-in" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                <span className="text-sm font-semibold text-gray-900">V</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-gray-900">VaultDoc</span>
                <span className="text-xs text-gray-500">by Neuverk</span>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
              AI-powered compliance documentation platform built for enterprise teams
              with a GDPR-first, EU-focused approach.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Product</p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="#features" className="text-sm text-gray-500 hover:text-gray-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Account</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900">
                  Get started
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Legal</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/dpa" className="text-sm text-gray-500 hover:text-gray-900">
                  DPA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 Neuverk. All rights reserved.</p>
          <p>GDPR-first · EU-focused · Enterprise-ready</p>
        </div>
      </div>
    </footer>
    </div>
  )
}