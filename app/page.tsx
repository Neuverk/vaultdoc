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
    title: 'Gap analysis',
    desc: 'Review existing documentation and identify missing controls, weak coverage, and audit preparation gaps.',
  },
  {
    key: '04',
    title: 'Audit readiness scoring',
    desc: 'Measure documentation maturity with clear visibility into readiness, missing areas, and next actions.',
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

const trustPoints = [
  'EU-focused product positioning',
  'GDPR-first platform design',
  'Built for IT, compliance, and security teams',
]

const stats = [
  { value: '13+', label: 'Frameworks supported' },
  { value: '< 30s', label: 'Typical generation time' },
  { value: 'EU', label: 'Data center strategy' },
  { value: '24/7', label: 'Platform availability vision' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-sm font-semibold tracking-tight text-gray-900">V</span>
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-gray-900">
                VaultDoc
              </span>
              <span className="text-xs font-medium text-gray-500">by Neuverk</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="hidden cursor-pointer text-sm font-medium text-gray-500 transition hover:text-gray-900 md:inline">
              Features
            </span>
            <span className="hidden cursor-pointer text-sm font-medium text-gray-500 transition hover:text-gray-900 md:inline">
              Pricing
            </span>
            <span className="hidden cursor-pointer text-sm font-medium text-gray-500 transition hover:text-gray-900 md:inline">
              Docs
            </span>

            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Sign in
            </Link>

            <Link
              href="/sign-up"
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              AI-powered compliance documentation platform
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-gray-900 sm:text-6xl">
              Compliance documentation
              <br />
              built for enterprise teams.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              VaultDoc helps organizations generate audit-ready SOPs, policies, and
              runbooks aligned to modern compliance frameworks. Designed for IT,
              security, and governance teams that need speed, structure, and
              credibility.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Start for free
              </Link>

              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">VaultDoc Platform</p>
                <p className="text-sm text-gray-500">Enterprise documentation workspace</p>
              </div>
              <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                Light mode
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Document generation</span>
                  <span className="text-xs font-medium text-gray-500">Active</span>
                </div>
                <p className="text-sm leading-6 text-gray-600">
                  Generate structured documentation for internal controls,
                  operational processes, and audit preparation.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Framework coverage</span>
                  <span className="text-xs font-medium text-gray-500">13+ standards</span>
                </div>
                <p className="text-sm leading-6 text-gray-600">
                  Support for ISO 27001, TISAX, GDPR, ITIL, SOC 2, NIST, NIS2, DORA,
                  and related enterprise controls.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">Data and trust posture</span>
                  <span className="text-xs font-medium text-gray-500">EU-first</span>
                </div>
                <p className="text-sm leading-6 text-gray-600">
                  GDPR-first product direction with enterprise-focused positioning,
                  compliance alignment, and trust-led documentation workflows.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-2 lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">Enterprise positioning</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Built for organizations that need professional documentation across
                compliance, IT operations, and security governance.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">GDPR-first direction</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Designed with European expectations in mind, including privacy-conscious
                architecture and trust-centered product strategy.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <p className="text-sm font-semibold text-gray-900">EU data center strategy</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Platform direction aligned to EU-hosted infrastructure expectations for
                modern compliance-driven teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            Core capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            A more professional way to create and manage compliance documentation
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-600">
            VaultDoc is designed to help enterprise teams standardize documentation
            workflows, improve audit readiness, and reduce manual effort across
            compliance programs.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700">
                {feature.key}
              </div>

              <h3 className="mb-2 text-base font-semibold text-gray-900">
                {feature.title}
              </h3>

              <p className="text-sm leading-6 text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-6"
            >
              <div className="text-2xl font-semibold tracking-tight text-gray-900">
                {item.value}
              </div>
              <div className="mt-1 text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
              Why teams choose VaultDoc
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Documentation that looks structured, credible, and ready for review
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              Move away from fragmented documents and inconsistent templates. VaultDoc
              gives teams a calmer, more standardized way to build documentation for
              audits, internal governance, and operational maturity.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-500">
              Product direction
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900">
              Enterprise-first, trust-led, and built for long-term compliance work
            </h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              VaultDoc is positioned as a professional platform for organizations that
              value strong governance, European trust expectations, and a more refined
              way to manage compliance documentation.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center lg:px-8">
        <div className="rounded-3xl border border-gray-200 bg-white px-8 py-14 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            Get started
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
            Build compliance documentation with more speed and more confidence
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-600">
            Start with VaultDoc and create professional documentation aligned to
            modern enterprise compliance needs.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Start for free
            </Link>

            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                  <span className="text-sm font-semibold text-gray-900">V</span>
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-gray-900">VaultDoc</span>
                  <span className="text-xs font-medium text-gray-500">by Neuverk</span>
                </div>
              </div>

              <p className="mt-4 max-w-md text-sm leading-6 text-gray-600">
                AI-powered compliance documentation platform built for enterprise teams,
                designed with a GDPR-first and EU-focused approach.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">Support</p>
              <p className="mt-3 text-sm text-gray-600">support@neuverk.com</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">Contact</p>
              <p className="mt-3 text-sm text-gray-600">contact@neuverk.com</p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-500">
            All rights reserved © Neuverk
          </div>
        </div>
      </footer>
    </div>
  )
}