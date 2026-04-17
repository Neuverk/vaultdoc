export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-10 py-12 shadow-sm">

          <div className="mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: 17 April 2026</p>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              This Privacy Policy explains how Neuverk (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, and protects
              personal data when you use VaultDoc at vaultdoc.neuverk.com. We are committed to
              protecting your privacy in accordance with the General Data Protection Regulation (GDPR)
              and applicable European data protection law.
            </p>
          </div>

          <Section title="1. Data Controller">
            <p>
              The data controller responsible for your personal data is:
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Neuverk</p>
              <p>Munich, Germany</p>
              <p>Email: <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">privacy@neuverk.com</a></p>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Note: Neuverk is currently in the process of formal registration. Registered office
              details will be updated upon completion of incorporation.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <p>We collect the following categories of personal data:</p>
            <SubSection title="Account data">
              <p>
                When you register or sign in via Clerk, we collect your name, email address,
                and authentication identifiers (such as Google or Microsoft account identifiers).
                This data is necessary to provide you with access to VaultDoc.
              </p>
            </SubSection>
            <SubSection title="Document content">
              <p>
                When you generate documents, we collect the inputs you provide — including document
                title, type, department, compliance frameworks, and answers to guided questions.
                This content is used to generate your compliance documentation and is stored in
                your personal document library.
              </p>
            </SubSection>
            <SubSection title="Billing data">
              <p>
                If you subscribe to a paid plan, Stripe processes your payment information on our
                behalf. We store only your Stripe customer ID, subscription status, and plan level.
                We do not store full card numbers or payment credentials.
              </p>
            </SubSection>
            <SubSection title="Usage data">
              <p>
                We collect basic usage information such as pages visited, features used, and
                timestamps of key actions (document creation, exports, logins). This is used to
                improve the platform and monitor for security incidents.
              </p>
            </SubSection>
            <SubSection title="Technical data">
              <p>
                We collect IP addresses, browser type, and device information as part of standard
                web server logging and security monitoring via Vercel.
              </p>
            </SubSection>
          </Section>

          <Section title="3. Legal Basis for Processing">
            <p>We process your personal data on the following legal bases under GDPR Article 6:</p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="font-semibold text-gray-800 shrink-0">Contract (Art. 6.1.b):</span> To provide the VaultDoc service you have subscribed to, including document generation, storage, and export.</li>
              <li className="flex gap-2"><span className="font-semibold text-gray-800 shrink-0">Legitimate interest (Art. 6.1.f):</span> To improve the platform, monitor security, prevent fraud, and maintain service reliability.</li>
              <li className="flex gap-2"><span className="font-semibold text-gray-800 shrink-0">Legal obligation (Art. 6.1.c):</span> To comply with applicable tax, financial, and regulatory requirements.</li>
              <li className="flex gap-2"><span className="font-semibold text-gray-800 shrink-0">Consent (Art. 6.1.a):</span> For optional cookies and analytics where consent is obtained via our cookie banner.</li>
            </ul>
          </Section>

          <Section title="4. AI Processing — Anthropic">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Important notice regarding AI processing</p>
              <p>
                Document inputs you provide — including titles, department names, compliance
                framework selections, and answers to guided questions — may be transmitted to
                Anthropic&apos;s API to generate document outputs. Users should avoid submitting
                passwords, special category personal data, or highly confidential information
                unless and until an appropriate data processing and retention setup is confirmed.
              </p>
            </div>
            <p className="mt-3">
              Anthropic is a third-party AI provider based in the United States. Data transmitted
              to Anthropic is subject to Anthropic&apos;s own privacy policy and terms of service,
              available at anthropic.com. We are in the process of establishing appropriate
              contractual safeguards for international data transfers to Anthropic in accordance
              with GDPR Chapter V.
            </p>
            <p className="mt-3">
              We do not transmit your name, email address, payment information, or account
              credentials to Anthropic. Only the document content inputs described above are
              transmitted for the purpose of AI generation.
            </p>
          </Section>

          <Section title="5. Sub-processors">
            <p>
              We use the following sub-processors to deliver the VaultDoc service. Each has been
              assessed for GDPR compliance and appropriate data transfer mechanisms where required:
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Sub-processor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Purpose</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Anthropic</td>
                    <td className="px-4 py-3 text-gray-600">AI document generation</td>
                    <td className="px-4 py-3 text-gray-600">United States</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Clerk</td>
                    <td className="px-4 py-3 text-gray-600">Authentication and user management</td>
                    <td className="px-4 py-3 text-gray-600">United States</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Stripe</td>
                    <td className="px-4 py-3 text-gray-600">Payment processing</td>
                    <td className="px-4 py-3 text-gray-600">United States / EU</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Neon</td>
                    <td className="px-4 py-3 text-gray-600">Database hosting</td>
                    <td className="px-4 py-3 text-gray-600">Germany (Frankfurt)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">Vercel</td>
                    <td className="px-4 py-3 text-gray-600">Application hosting and delivery</td>
                    <td className="px-4 py-3 text-gray-600">United States / EU</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              For sub-processors located outside the EU/EEA, we rely on Standard Contractual
              Clauses (SCCs) or other appropriate transfer mechanisms under GDPR Chapter V.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <ul className="space-y-2 text-sm text-gray-600">
              <li><span className="font-semibold text-gray-800">Account data:</span> Retained for the duration of your account. Deleted within 30 days of account deletion request.</li>
              <li><span className="font-semibold text-gray-800">Document content:</span> Retained until you delete the document or your account. You can delete individual documents from your library at any time.</li>
              <li><span className="font-semibold text-gray-800">Billing records:</span> Retained for 10 years to comply with German commercial law (HGB § 257).</li>
              <li><span className="font-semibold text-gray-800">Usage and audit logs:</span> Retained for 12 months for security and operational purposes.</li>
              <li><span className="font-semibold text-gray-800">Stripe customer data:</span> Retained per Stripe&apos;s retention policy; billing identifiers retained for the duration required by law.</li>
            </ul>
          </Section>

          <Section title="7. Your Rights Under GDPR">
            <p>
              Under the GDPR, you have the following rights regarding your personal data. To
              exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">
                privacy@neuverk.com
              </a>.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><span className="font-semibold text-gray-800">Right of access (Art. 15):</span> Request a copy of the personal data we hold about you.</li>
              <li><span className="font-semibold text-gray-800">Right to rectification (Art. 16):</span> Request correction of inaccurate personal data.</li>
              <li><span className="font-semibold text-gray-800">Right to erasure (Art. 17):</span> Request deletion of your personal data. You can delete your account directly from your billing settings.</li>
              <li><span className="font-semibold text-gray-800">Right to restriction (Art. 18):</span> Request that we restrict processing of your data in certain circumstances.</li>
              <li><span className="font-semibold text-gray-800">Right to portability (Art. 20):</span> Request your data in a structured, machine-readable format.</li>
              <li><span className="font-semibold text-gray-800">Right to object (Art. 21):</span> Object to processing based on legitimate interests.</li>
              <li><span className="font-semibold text-gray-800">Right to withdraw consent (Art. 7.3):</span> Withdraw consent for optional processing at any time.</li>
            </ul>
            <p className="mt-3">
              You also have the right to lodge a complaint with your local data protection
              authority. In Germany, the supervisory authority is the{' '}
              <span className="font-medium text-gray-800">
                Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)
              </span>
              .
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              VaultDoc uses cookies for authentication (Clerk) and payment processing (Stripe).
              These are technically necessary cookies required for the service to function. We
              do not use advertising or tracking cookies. You will be asked for consent via our
              cookie banner when you first visit the platform.
            </p>
          </Section>

          <Section title="9. Security">
            <p>
              We implement appropriate technical and organisational measures to protect your
              personal data, including:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>— All data in transit encrypted via HTTPS/TLS</li>
              <li>— Database encrypted at rest (Neon Postgres)</li>
              <li>— Authentication managed by Clerk with industry-standard security</li>
              <li>— Access controls — each user can only access their own documents</li>
              <li>— API rate limiting to prevent abuse</li>
              <li>— Regular review of sub-processor security posture</li>
            </ul>
            <p className="mt-3">
              No system is completely secure. In the event of a personal data breach that poses
              a risk to your rights and freedoms, we will notify you and the relevant supervisory
              authority in accordance with GDPR Articles 33 and 34.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or by posting a notice in the platform. The date of the most recent
              revision appears at the top of this page. Continued use of VaultDoc after changes
              are posted constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact">
            <p>
              For any questions, requests, or concerns regarding this Privacy Policy or your
              personal data, please contact:
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Neuverk — Data Privacy</p>
              <p>Munich, Germany</p>
              <p>
                Email:{' '}
                <a href="mailto:privacy@neuverk.com" className="text-blue-600 hover:underline">
                  privacy@neuverk.com
                </a>
              </p>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              We aim to respond to all privacy requests within 30 days.
            </p>
          </Section>

        </div>
      </div>
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