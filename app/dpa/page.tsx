import Link from 'next/link'

export const metadata = {
  title: 'Data Processing Agreement | VaultDoc',
  description:
    'Data Processing Agreement for the VaultDoc compliance documentation platform.',
}

const LAST_UPDATED = '1 January 2025'
const CONTACT_EMAIL = 'privacy@neuverk.com'
const COMPANY = 'Neuverk UG (haftungsbeschränkt)'
const COMPANY_SHORT = 'Neuverk'

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-sm font-semibold text-gray-900">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-gray-900">VaultDoc</span>
              <span className="text-xs text-gray-500">by Neuverk</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Terms
            </Link>
            <Link
              href="/"
              className="text-sm text-gray-500 transition hover:text-gray-900"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 lg:py-20">
        <div className="mb-10 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
            Legal
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            Data Processing Agreement
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            Last updated:{' '}
            <span className="font-medium text-gray-700">{LAST_UPDATED}</span>
          </p>
        </div>

        <div className="space-y-8">
          <Section>
            <p className="leading-7 text-gray-700">
              This Data Processing Agreement (
              <strong className="font-semibold text-gray-900">&quot;DPA&quot;</strong>
              ) forms part of the agreement between{' '}
              <strong className="font-semibold text-gray-900">{COMPANY}</strong> (
              &quot;{COMPANY_SHORT}&quot;, &quot;Processor&quot;, &quot;we&quot;,
              &quot;us&quot;) and the customer using VaultDoc (
              &quot;Controller&quot;, &quot;Customer&quot;, &quot;you&quot;),
              insofar as Neuverk processes personal data on behalf of the Customer
              in connection with the VaultDoc service.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              This DPA is intended to satisfy the requirements of Article 28 of
              Regulation (EU) 2016/679 (
              <strong className="font-semibold text-gray-900">GDPR</strong>).
            </p>
          </Section>

          <Section title="1. Scope and Order of Precedence">
            <p className="leading-7 text-gray-700">
              This DPA applies where the Customer acts as data controller and
              Neuverk acts as data processor in relation to personal data processed
              through VaultDoc.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              This DPA supplements the Terms of Service and Privacy Policy. In the
              event of conflict between this DPA and the Terms of Service, this DPA
              governs with respect to processing of personal data on behalf of the
              Customer.
            </p>
          </Section>

          <Section title="2. Roles of the Parties">
            <div className="space-y-4">
              <Clause title="Customer as Controller">
                The Customer determines the purposes and means of processing
                personal data submitted to VaultDoc and is therefore the controller
                for such personal data.
              </Clause>

              <Clause title="Neuverk as Processor">
                Neuverk processes personal data solely on behalf of the Customer
                for the purpose of providing the VaultDoc service and is therefore
                the processor with respect to such data.
              </Clause>

              <Clause title="Independent Processing">
                Where Neuverk processes limited account, billing, fraud prevention,
                or service administration data for its own legitimate business
                purposes, Neuverk may act as an independent controller for that
                processing.
              </Clause>
            </div>
          </Section>

          <Section title="3. Subject Matter and Duration of Processing">
            <div className="space-y-4">
              <Clause title="Subject Matter">
                The subject matter of the processing is the provision of the
                VaultDoc platform, including user authentication, document
                generation, storage, billing support, and related service
                operations.
              </Clause>

              <Clause title="Duration">
                Processing continues for the duration of the Customer&apos;s use of
                VaultDoc and until deletion or return of personal data in
                accordance with Section 13 of this DPA, unless applicable law
                requires longer retention.
              </Clause>
            </div>
          </Section>

          <Section title="4. Nature and Purpose of Processing">
            <p className="mb-4 leading-7 text-gray-700">
              Neuverk may process personal data as necessary to provide VaultDoc,
              including:
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Authentication and account management',
                'Generation of compliance documents based on customer inputs',
                'Storage and retrieval of generated documents',
                'Subscription billing and payment administration',
                'Service security, logging, support, and reliability operations',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 text-gray-400">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="leading-7 text-amber-950">
                <strong>
                  Customer document inputs may be processed by Anthropic&apos;s AI
                  services for document generation.
                </strong>
              </p>
              <p className="mt-3 text-sm leading-7 text-amber-900">
                Customers should avoid entering passwords, special categories of
                personal data, or other information that is not necessary for the
                intended document generation purpose.
              </p>
            </div>
          </Section>

          <Section title="5. Categories of Data Subjects and Personal Data">
            <div className="space-y-4">
              <Clause title="Categories of Data Subjects">
                Data subjects may include Customer users, employees, contractors,
                business contacts, and any other persons whose personal data the
                Customer includes in VaultDoc inputs or stored documents.
              </Clause>

              <Clause title="Categories of Personal Data">
                Categories of personal data may include account identifiers, names,
                business email addresses, organisation details, document content,
                operational process information, and any other personal data
                intentionally submitted by the Customer.
              </Clause>

              <Clause title="Special Categories of Data">
                The Customer must not use VaultDoc to process special categories of
                personal data under Article 9 GDPR, criminal conviction data, or
                highly sensitive regulated information unless explicitly agreed in
                writing with Neuverk.
              </Clause>
            </div>
          </Section>

          <Section title="6. Customer Instructions">
            <p className="leading-7 text-gray-700">
              Neuverk shall process personal data only on documented instructions
              from the Customer, unless required to do so by Union or Member State
              law. The Terms of Service, this DPA, and the Customer&apos;s use of
              service settings and features constitute the Customer&apos;s
              documented instructions.
            </p>

            <p className="mt-4 leading-7 text-gray-700">
              If Neuverk believes an instruction infringes the GDPR or other
              applicable data protection law, Neuverk will inform the Customer
              without undue delay.
            </p>
          </Section>

          <Section title="7. Confidentiality and Personnel">
            <p className="leading-7 text-gray-700">
              Neuverk ensures that persons authorised to process personal data are
              subject to appropriate confidentiality obligations and receive access
              only to the extent necessary for their role.
            </p>
          </Section>

          <Section title="8. Technical and Organisational Measures">
            <p className="mb-4 leading-7 text-gray-700">
              Neuverk implements appropriate technical and organisational measures
              designed to protect personal data, taking into account the nature,
              scope, context, and purposes of processing, as well as the risk to
              individuals. These measures include, where applicable:
            </p>

            <ul className="space-y-2 text-sm text-gray-700">
              {[
                'Access control through authenticated user accounts and role-based access limitations',
                'Encryption in transit using HTTPS/TLS',
                'Logical separation of customer data through tenant isolation and application-level access controls',
                'Secure hosting and database infrastructure in the EU where configured',
                'Audit logging, service monitoring, and security event review',
                'Least-privilege principles for administrative access',
                'Backup, recovery, and service resilience measures appropriate to the platform',
                'Procedures for vulnerability remediation and incident handling',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 text-gray-400">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="9. Sub-processors">
            <p className="mb-4 leading-7 text-gray-700">
              The Customer authorises Neuverk to engage the following
              sub-processors to deliver the VaultDoc service:
            </p>

            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Sub-processor
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Purpose
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                      Data Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      Anthropic
                    </td>
                    <td className="px-4 py-3">AI document generation</td>
                    <td className="px-4 py-3">
                      Document inputs and prompts submitted by Customer users
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Clerk</td>
                    <td className="px-4 py-3">
                      Authentication and account identity management
                    </td>
                    <td className="px-4 py-3">
                      User account and login data
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Stripe</td>
                    <td className="px-4 py-3">
                      Payment processing and subscription billing
                    </td>
                    <td className="px-4 py-3">
                      Billing and payment-related data
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Neon</td>
                    <td className="px-4 py-3">
                      Managed PostgreSQL database hosting
                    </td>
                    <td className="px-4 py-3">
                      Stored application and document data
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Vercel</td>
                    <td className="px-4 py-3">
                      Application hosting and delivery infrastructure
                    </td>
                    <td className="px-4 py-3">
                      Application traffic, logs, and hosted service data
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4 leading-7 text-gray-700">
              Neuverk will impose data protection obligations on sub-processors
              that are no less protective than those set out in this DPA, as
              required by Article 28 GDPR.
            </p>
          </Section>

          <Section title="10. Assistance to the Customer">
            <p className="leading-7 text-gray-700">
              Taking into account the nature of the processing and the information
              available to Neuverk, we will provide reasonable assistance to the
              Customer in fulfilling its obligations regarding:
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {[
                'Responses to data subject rights requests',
                'Security of processing under Article 32 GDPR',
                'Personal data breach notifications under Articles 33 and 34 GDPR',
                'Data protection impact assessments where relevant',
                'Consultation with supervisory authorities where required',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-0.5 text-gray-400">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="11. International Transfers">
            <p className="leading-7 text-gray-700">
              Where personal data is transferred outside the European Economic Area
              in connection with authorised sub-processors, Neuverk will ensure an
              appropriate transfer mechanism is in place as required by applicable
              data protection law, such as the European Commission&apos;s Standard
              Contractual Clauses or another valid legal basis.
            </p>
          </Section>

          <Section title="12. Personal Data Breach Notification">
            <p className="leading-7 text-gray-700">
              Neuverk will notify the Customer without undue delay after becoming
              aware of a personal data breach affecting Customer personal data
              processed under this DPA. Neuverk will provide available information
              reasonably necessary for the Customer to assess the breach and meet
              its notification obligations under the GDPR.
            </p>
          </Section>

          <Section title="13. Deletion and Return of Data">
            <p className="leading-7 text-gray-700">
              Upon termination of the service, Neuverk will delete or return
              Customer personal data, at the Customer&apos;s choice where
              technically feasible, unless Union or Member State law requires
              further retention. Certain limited records may be retained for legal,
              accounting, security, or fraud-prevention purposes where permitted by
              law.
            </p>
          </Section>

          <Section title="14. Audit and Information Rights">
            <p className="leading-7 text-gray-700">
              Neuverk will make available to the Customer information reasonably
              necessary to demonstrate compliance with Article 28 GDPR and this
              DPA. Where justified and proportionate, the Customer may request
              further information or an audit, subject to reasonable notice,
              confidentiality safeguards, and protection of Neuverk&apos;s other
              customers, systems, and trade secrets.
            </p>
          </Section>

          <Section title="15. Governing Law">
            <p className="leading-7 text-gray-700">
              This DPA is governed by the laws of the Federal Republic of Germany,
              unless mandatory data protection law requires otherwise.
            </p>
          </Section>

          <Section title="16. Contact">
            <p className="leading-7 text-gray-700">
              For questions regarding this DPA or data protection matters, please
              contact:
            </p>

            <address className="mt-4 not-italic rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-7 text-gray-700 shadow-sm">
              {COMPANY}
              <br />
              [Street Address]
              <br />
              [City, Postcode], Germany
              <br />
              Email:{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-gray-900 underline-offset-4 transition hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </address>
          </Section>
        </div>

        <div className="mt-16 flex flex-wrap gap-6 border-t border-gray-200 pt-8 text-sm text-gray-500">
          <Link href="/privacy" className="transition hover:text-gray-900">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition hover:text-gray-900">
            Terms of Service
          </Link>
          <Link href="/" className="transition hover:text-gray-900">
            ← Back to VaultDoc
          </Link>
        </div>
      </main>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
      {title && (
        <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-semibold text-gray-900">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function Clause({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <p className="mb-2 text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-sm leading-7 text-gray-700">{children}</p>
    </div>
  )
}