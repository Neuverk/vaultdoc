import Link from 'next/link'

export default function DpaPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                <span className="text-sm font-semibold text-gray-900">V</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-gray-900">VaultDoc</span>
                <span className="text-xs text-gray-500">Neuverk</span>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/#features" className="text-sm text-gray-500 transition hover:text-gray-900">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm text-gray-500 transition hover:text-gray-900">
              Pricing
            </Link>
            <a
              href="mailto:support@neuverk.com"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Support
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm font-medium text-gray-600 transition hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* DPA content */}
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-10 py-12 shadow-sm">
          <div className="mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Data Processing Agreement
            </h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: 17 April 2026</p>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the agreement between
              Neuverk (&ldquo;Processor&rdquo;) and the customer using VaultDoc (&ldquo;Controller&rdquo;). It sets
              out the terms on which Neuverk processes personal data on behalf of the Controller
              in connection with the VaultDoc service, in accordance with Article 28 of the
              General Data Protection Regulation (GDPR) (EU) 2016/679.
            </p>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              By using VaultDoc, the Controller agrees to the terms of this DPA. Enterprise
              customers requiring a countersigned DPA should contact{' '}
              <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">
                privacy@neuverk.com
              </a>
              .
            </p>
          </div>

          <Section title="1. Definitions">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Controller&rdquo;</span> — the natural or legal person
                who determines the purposes and means of processing personal data (the VaultDoc customer).
              </li>
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Processor&rdquo;</span> — Neuverk, which processes personal
                data on behalf of the Controller in connection with the VaultDoc service.
              </li>
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Personal data&rdquo;</span> — any information relating to an
                identified or identifiable natural person as defined in GDPR Article 4(1).
              </li>
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Processing&rdquo;</span> — any operation performed on personal
                data as defined in GDPR Article 4(2).
              </li>
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Sub-processor&rdquo;</span> — any third party engaged by the
                Processor to carry out processing activities on behalf of the Controller.
              </li>
              <li>
                <span className="font-semibold text-gray-800">&ldquo;Data breach&rdquo;</span> — a breach of security leading to
                accidental or unlawful destruction, loss, alteration, unauthorised disclosure of, or access to,
                personal data.
              </li>
            </ul>
          </Section>

          <Section title="2. Subject Matter and Nature of Processing">
            <p>
              Neuverk processes personal data on behalf of the Controller solely for the
              purpose of providing the VaultDoc service, which includes:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>— User authentication and account management</li>
              <li>— Storage and retrieval of compliance documents created by the Controller</li>
              <li>— AI-powered document generation using inputs provided by the Controller</li>
              <li>— Subscription billing and invoicing</li>
              <li>— Platform security, monitoring, and support</li>
            </ul>
          </Section>

          <Section title="3. Categories of Data Subjects and Personal Data">
            <SubSection title="Data subjects">
              <p>
                Employees, contractors, and authorised users of the Controller who are granted
                access to VaultDoc.
              </p>
            </SubSection>
            <SubSection title="Categories of personal data processed">
              <ul className="space-y-1 text-sm text-gray-600">
                <li>— Name and email address (account registration)</li>
                <li>— Authentication identifiers (SSO tokens)</li>
                <li>— Document content inputs provided by users</li>
                <li>— Usage and activity logs (timestamps, feature usage)</li>
                <li>— IP addresses and technical identifiers</li>
                <li>— Billing contact information and Stripe customer identifiers</li>
              </ul>
            </SubSection>
            <SubSection title="Special categories of data">
              <p>
                The Controller should not submit special category personal data (as defined
                in GDPR Article 9) to VaultDoc unless strictly necessary and appropriate
                safeguards are in place. Neuverk does not specifically process special
                category data as part of the core service.
              </p>
            </SubSection>
          </Section>

          <Section title="4. Processor Obligations">
            <p>Neuverk, as Processor, shall:</p>
            <ul className="mt-2 space-y-2 text-sm text-gray-600">
              <li>
                — Process personal data only on documented instructions from the Controller, which include
                these Terms and the DPA, unless required to do so by applicable law
              </li>
              <li>
                — Ensure that persons authorised to process personal data are subject to appropriate
                confidentiality obligations
              </li>
              <li>
                — Implement appropriate technical and organisational measures to ensure a level of security
                appropriate to the risk, in accordance with GDPR Article 32
              </li>
              <li>
                — Not engage sub-processors without prior general authorisation from the Controller
                (which is granted by acceptance of this DPA), subject to the conditions in Section 6
              </li>
              <li>
                — Assist the Controller in responding to requests from data subjects exercising their rights
                under GDPR Chapter III
              </li>
              <li>
                — Assist the Controller with its obligations under GDPR Articles 32-36
                (security, breach notification, DPIA)
              </li>
              <li>
                — Delete or return all personal data to the Controller at the end of the service relationship,
                at the Controller&apos;s choice
              </li>
              <li>
                — Make available all information necessary to demonstrate compliance with this DPA and
                allow for audits
              </li>
            </ul>
          </Section>

          <Section title="5. Technical and Organisational Measures">
            <p>Neuverk implements the following technical and organisational security measures:</p>
            <div className="mt-3 space-y-3">
              <MeasureRow title="Encryption in transit" value="All data encrypted via HTTPS/TLS 1.2 or higher" />
              <MeasureRow title="Encryption at rest" value="Database encrypted at rest via Neon Postgres (AES-256)" />
              <MeasureRow title="Access controls" value="Role-based access; users can only access their own tenant data" />
              <MeasureRow title="Authentication" value="Multi-factor authentication supported via Clerk; SSO available" />
              <MeasureRow title="Pseudonymisation" value="Internal user identifiers used; Clerk IDs not exposed in UI" />
              <MeasureRow title="Availability" value="Hosted on Vercel with automated failover; Neon with high availability" />
              <MeasureRow title="Incident response" value="Data breach notification procedure in place per GDPR Articles 33-34" />
              <MeasureRow title="Audit logging" value="Key user actions logged for security monitoring" />
              <MeasureRow title="Sub-processor review" value="Sub-processors assessed for GDPR compliance prior to engagement" />
            </div>
          </Section>

          <Section title="6. Sub-processors">
            <p>
              The Controller grants general authorisation for Neuverk to engage the following
              sub-processors. Neuverk will notify the Controller of any intended changes to
              sub-processors, giving the Controller the opportunity to object.
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Sub-processor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Purpose
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Transfer basis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Anthropic</td>
                    <td className="px-4 py-3 text-gray-600">AI document generation</td>
                    <td className="px-4 py-3 text-gray-600">United States</td>
                    <td className="px-4 py-3 text-gray-600">SCCs (in progress)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Clerk</td>
                    <td className="px-4 py-3 text-gray-600">Authentication</td>
                    <td className="px-4 py-3 text-gray-600">United States</td>
                    <td className="px-4 py-3 text-gray-600">SCCs / DPA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Stripe</td>
                    <td className="px-4 py-3 text-gray-600">Payment processing</td>
                    <td className="px-4 py-3 text-gray-600">United States / EU</td>
                    <td className="px-4 py-3 text-gray-600">SCCs / DPA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Neon</td>
                    <td className="px-4 py-3 text-gray-600">Database hosting</td>
                    <td className="px-4 py-3 text-gray-600">Germany (Frankfurt)</td>
                    <td className="px-4 py-3 text-gray-600">Within EU/EEA</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Vercel</td>
                    <td className="px-4 py-3 text-gray-600">Application hosting</td>
                    <td className="px-4 py-3 text-gray-600">United States / EU</td>
                    <td className="px-4 py-3 text-gray-600">SCCs / DPA</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="mb-1 font-semibold">Note regarding Anthropic</p>
              <p>
                Document inputs may be processed by Anthropic to generate outputs. Users should
                avoid submitting passwords, special category personal data, or highly confidential
                information unless and until an appropriate data processing and retention setup
                is confirmed. Neuverk is in the process of establishing Standard Contractual
                Clauses with Anthropic.
              </p>
            </div>
          </Section>

          <Section title="7. International Data Transfers">
            <p>
              Where personal data is transferred outside the European Economic Area (EEA),
              Neuverk ensures appropriate safeguards are in place in accordance with GDPR
              Chapter V. The primary mechanism used is the European Commission&apos;s Standard
              Contractual Clauses (SCCs) (Commission Decision 2021/914).
            </p>
            <p className="mt-3">
              The Controller acknowledges that some sub-processors (Anthropic, Clerk, Vercel)
              are based in the United States and that data may be transferred to the US in
              connection with the services they provide. Neuverk will maintain and update the
              appropriate transfer mechanisms as required by applicable law.
            </p>
          </Section>

          <Section title="8. Data Breach Notification">
            <p>
              In the event of a personal data breach affecting data processed under this DPA,
              Neuverk will:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>— Notify the Controller without undue delay and, where feasible, within 72 hours of becoming aware of the breach</li>
              <li>— Provide sufficient information to allow the Controller to meet its own notification obligations under GDPR Article 33</li>
              <li>— Cooperate with the Controller to investigate, mitigate, and remediate the breach</li>
              <li>— Document all breaches, including those that do not require notification</li>
            </ul>
            <p className="mt-3">
              Breach notifications should be sent to{' '}
              <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">
                privacy@neuverk.com
              </a>
              . The Controller is responsible for notifying the relevant supervisory authority
              and affected data subjects where required.
            </p>
          </Section>

          <Section title="9. Data Subject Rights">
            <p>
              Where the Controller receives a request from a data subject exercising their
              rights under GDPR Chapter III (access, rectification, erasure, portability,
              restriction, objection), Neuverk will assist the Controller in fulfilling such
              requests to the extent technically feasible and within a reasonable timeframe.
            </p>
            <p className="mt-3">
              Data subjects may exercise rights directly through the VaultDoc platform
              (e.g. account deletion, document deletion) or by contacting the Controller,
              who remains responsible as data controller.
            </p>
          </Section>

          <Section title="10. Audit Rights">
            <p>
              The Controller may conduct audits or inspections of Neuverk&apos;s data processing
              activities to verify compliance with this DPA, subject to reasonable advance
              notice of at least 30 days and at the Controller&apos;s expense. Neuverk may propose
              alternative audit mechanisms (such as third-party audit reports or security
              certifications) as a substitute for on-site audits.
            </p>
          </Section>

          <Section title="11. Term and Termination">
            <p>
              This DPA remains in effect for the duration of the service agreement between
              the Controller and Neuverk. Upon termination of the service agreement, Neuverk
              will, at the Controller&apos;s election, delete or return all personal data processed
              under this DPA within 30 days, unless retention is required by applicable law.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              This DPA is governed by the laws of the Federal Republic of Germany and is
              subject to the jurisdiction of the competent courts in Munich, Germany,
              unless superseded by mandatory provisions of applicable EU data protection law.
            </p>
          </Section>

          <Section title="13. Contact">
            <p>
              For enterprise DPA requests, data protection enquiries, or to request a
              countersigned version of this agreement, please contact:
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Neuverk — Data Protection</p>
              <p>Munich, Germany</p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">
                  privacy@neuverk.com
                </a>
              </p>
            </div>
          </Section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_0.7fr_0.7fr_0.8fr]">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
                  <span className="text-sm font-semibold text-gray-900">V</span>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-gray-900">VaultDoc</span>
                  <span className="text-xs text-gray-500">Neuverk</span>
                </div>
              </Link>

              <p className="mt-4 max-w-sm text-sm leading-6 text-gray-500">
                AI-powered compliance documentation platform built for enterprise teams
                with a GDPR-first, EU-focused approach.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">Product</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/#features" className="text-sm text-gray-500 hover:text-gray-900">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-sm text-gray-500 hover:text-gray-900">
                    Pricing
                  </Link>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-gray-600">{children}</div>
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="mb-1 text-sm font-semibold text-gray-800">{title}</h3>
      <div className="text-sm leading-7 text-gray-600">{children}</div>
    </div>
  )
}

function MeasureRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <span className="w-40 shrink-0 text-xs font-semibold text-gray-700">{title}</span>
      <span className="text-xs text-gray-600">{value}</span>
    </div>
  )
}