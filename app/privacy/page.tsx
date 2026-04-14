import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | VaultDoc",
  description: "How VaultDoc collects, uses, and protects your personal data under GDPR.",
};

const LAST_UPDATED = "1 January 2025";
const CONTACT_EMAIL = "privacy@neuverk.com";
const COMPANY = "Neuverk UG (haftungsbeschränkt)";
const COMPANY_SHORT = "Neuverk";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
              <span className="text-sm font-semibold tracking-tight text-gray-900">V</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-gray-900">VaultDoc</span>
              <span className="text-xs font-medium text-gray-500">by Neuverk</span>
            </div>
          </Link>
          <nav className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
            <Link href="/dpa" className="hover:text-gray-900 transition-colors">DPA</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: <span className="text-gray-600">{LAST_UPDATED}</span></p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-7 mb-4">
          <p className="text-gray-600 leading-relaxed">
            {COMPANY} ("<strong className="text-gray-900">{COMPANY_SHORT}</strong>", "we", "us", "our") operates the VaultDoc platform at{" "}
            <span className="text-gray-900 font-medium">vaultdoc.neuverk.com</span>. This Privacy Policy explains how we collect, use, store, and share your personal data when you use our service, and what rights you have under the EU General Data Protection Regulation (GDPR).
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            If you have questions or want to exercise your rights, contact our privacy team at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <Section title="1. Data Controller">
          <p className="text-gray-600 leading-relaxed mb-5">The data controller responsible for your personal data is:</p>
          <address className="not-italic text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-5 leading-7">
            {COMPANY}<br />
            [Street Address]<br />
            [City, Postcode], Germany<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>
          </address>
        </Section>

        <Section title="2. Data We Collect">
          <p className="text-gray-600 leading-relaxed mb-5">We collect the following categories of personal data:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-6 text-gray-500 font-semibold">Category</th>
                  <th className="py-3 pr-6 text-gray-500 font-semibold">Examples</th>
                  <th className="py-3 text-gray-500 font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                <TableRow category="Account data" examples="Name, email address, profile picture" source="You (at sign-up), Google/Microsoft SSO" />
                <TableRow category="Authentication data" examples="Session tokens, login timestamps, IP address" source="Clerk (our auth provider)" />
                <TableRow category="Document content" examples="Text you enter into document generation forms and chat prompts" source="You" />
                <TableRow category="Usage data" examples="Pages visited, features used, document creation events" source="Automatically collected" />
                <TableRow category="Billing data" examples="Subscription plan, payment status, billing email" source="Stripe (we do not store card numbers)" />
                <TableRow category="Audit logs" examples="Document created/viewed/deleted, plan upgrades" source="Automatically generated" />
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="3. Why We Process Your Data">
          <p className="text-gray-600 leading-relaxed mb-5">We process your personal data on the following legal bases:</p>
          <div className="space-y-3">
            <LegalBasis basis="Performance of contract (Art. 6(1)(b) GDPR)" description="To create and manage your account, generate compliance documents, enforce subscription plan limits, and provide customer support." />
            <LegalBasis basis="Legitimate interests (Art. 6(1)(f) GDPR)" description="To maintain security and prevent fraud, improve our service, generate aggregated analytics, and maintain audit logs." />
            <LegalBasis basis="Legal obligation (Art. 6(1)(c) GDPR)" description="To comply with EU tax, accounting, and anti-money laundering obligations related to subscription billing." />
            <LegalBasis basis="Consent (Art. 6(1)(a) GDPR)" description="For non-essential cookies and analytics. You may withdraw consent at any time via our cookie banner." />
          </div>
        </Section>

        <Section title="4. AI Processing — Important Disclosure">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <p className="text-gray-900 font-semibold mb-3">Your document inputs are processed by Anthropic&apos;s AI.</p>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              When you use VaultDoc&apos;s document generation feature, the text you enter — including form responses and chat messages — is transmitted to{" "}
              <strong className="text-gray-900">Anthropic, PBC</strong> (San Francisco, USA) via their Claude API to generate compliance document content.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>We have requested Anthropic&apos;s Zero Data Retention (ZDR) option, under which Anthropic does not store API inputs or outputs beyond the duration of the API call.</span></li>
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>Data is transferred to the USA under Standard Contractual Clauses (SCCs) as the legal transfer mechanism.</span></li>
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span><strong className="text-gray-900">We strongly advise against entering passwords, unredacted personal data of third parties, or classified information</strong> into document generation fields.</span></li>
            </ul>
          </div>
        </Section>

        <Section title="5. Data Retention">
          <p className="text-gray-600 leading-relaxed mb-5">We retain your data only as long as necessary:</p>
          <div className="text-sm divide-y divide-gray-100">
            <RetentionRow label="Account data" period="For the duration of your account, plus 30 days after deletion" />
            <RetentionRow label="Documents" period="Until you delete them, or upon account deletion" />
            <RetentionRow label="Audit logs" period="12 months from the date of the event" />
            <RetentionRow label="Billing records" period="10 years (German commercial law / HGB §257)" />
            <RetentionRow label="Session data" period="As per Clerk's session expiry settings (typically 30 days)" />
          </div>
        </Section>

        <Section title="6. Sub-processors and Third-Party Recipients">
          <p className="text-gray-600 leading-relaxed mb-5">We use the following sub-processors to deliver the VaultDoc service:</p>
          <div className="space-y-3">
            <SubProcessor name="Anthropic, PBC" role="AI document generation" location="USA" mechanism="Standard Contractual Clauses (SCCs)" link="https://www.anthropic.com/privacy" />
            <SubProcessor name="Clerk, Inc." role="User authentication and session management" location="USA" mechanism="Standard Contractual Clauses (SCCs)" link="https://clerk.com/privacy" />
            <SubProcessor name="Stripe, Inc." role="Payment processing and subscription management" location="USA (EU processing where available)" mechanism="Standard Contractual Clauses (SCCs)" link="https://stripe.com/en-de/privacy" />
            <SubProcessor name="Neon, Inc." role="PostgreSQL database hosting" location="Germany (Frankfurt, EU) — AWS eu-central-1" mechanism="Data remains in EU" link="https://neon.tech/privacy" />
            <SubProcessor name="Vercel, Inc." role="Application hosting and edge network" location="USA / EU edge nodes" mechanism="Standard Contractual Clauses (SCCs)" link="https://vercel.com/legal/privacy-policy" />
          </div>
        </Section>

        <Section title="7. Your Rights Under GDPR (Articles 15–20)">
          <p className="text-gray-600 leading-relaxed mb-5">
            As a data subject in the EU/EEA, you have the following rights. Contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>. We will respond within 30 days.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Right article="Art. 15" title="Right of Access" description="Obtain a copy of all personal data we hold about you." />
            <Right article="Art. 16" title="Right to Rectification" description="Correct inaccurate or incomplete personal data." />
            <Right article="Art. 17" title="Right to Erasure" description="Request deletion of your account and all associated data. Available directly in your billing settings." />
            <Right article="Art. 18" title="Right to Restriction" description="Request that we restrict processing of your data in certain circumstances." />
            <Right article="Art. 19" title="Notification Obligation" description="We will inform sub-processors of corrections or erasure requests where feasible." />
            <Right article="Art. 20" title="Right to Portability" description="Receive your data in a structured, machine-readable format (JSON/CSV)." />
            <Right article="Art. 21" title="Right to Object" description="Object to processing based on legitimate interests." />
            <Right article="Art. 77" title="Right to Complain" description="Lodge a complaint with your supervisory authority. In Germany: Bundesbeauftragte für den Datenschutz (BfDI)." />
          </div>
        </Section>

        <Section title="8. Cookies">
          <p className="text-gray-600 leading-relaxed mb-5">We use the following categories of cookies:</p>
          <div className="text-sm divide-y divide-gray-100">
            <CookieRow type="Essential (strictly necessary)" purpose="Clerk authentication session cookies required to keep you logged in" consent="No consent required" />
            <CookieRow type="Functional" purpose="Remembering preferences such as cookie banner dismissal" consent="Stored in localStorage; no consent required" />
            <CookieRow type="Payment" purpose="Stripe cookies for secure payment form and fraud prevention" consent="Required for checkout flow" />
          </div>
          <p className="text-sm text-gray-500 mt-4">We do not currently use advertising or cross-site tracking cookies.</p>
        </Section>

        <Section title="9. International Data Transfers">
          <p className="text-gray-600 leading-relaxed">
            Several of our sub-processors are based in the United States. Transfers to these processors are made under Standard Contractual Clauses (SCCs) as adopted by the European Commission under Article 46 GDPR. Our database (Neon) is hosted in Frankfurt, Germany, and does not leave the EU.
          </p>
        </Section>

        <Section title="10. Security Measures">
          <p className="text-gray-600 leading-relaxed mb-4">We implement the following technical and organisational measures:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Encryption in transit via TLS 1.2+ for all connections",
              "Encryption at rest for database data (Neon managed encryption)",
              "Per-tenant data isolation — each user's documents are logically separated",
              "Clerk-managed authentication with session expiry and optional MFA",
              "Server-side processing of all AI and database operations",
              "Rate limiting on AI generation endpoints to prevent abuse",
              "Audit logging of key data events (creation, access, deletion, account changes)",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gray-300 mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="11. Changes to This Policy">
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email and display a notice in the VaultDoc dashboard. Your continued use of VaultDoc after a change constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p className="text-gray-600 leading-relaxed mb-5">For privacy-related questions, data subject requests, or to report a concern:</p>
          <address className="not-italic text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-5 leading-7">
            Data Protection Officer<br />
            {COMPANY}<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>
          </address>
          <p className="text-sm text-gray-500 mt-4">
            We aim to respond to all requests within <strong className="text-gray-700">30 calendar days</strong>.
          </p>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
          <Link href="/dpa" className="hover:text-gray-700 transition-colors">Data Processing Agreement</Link>
          <Link href="/" className="hover:text-gray-700 transition-colors">Back to VaultDoc</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-7 mb-4">
      {title && <h2 className="text-base font-semibold text-gray-900 mb-5 pb-4 border-b border-gray-100">{title}</h2>}
      {children}
    </div>
  );
}

function TableRow({ category, examples, source }: { category: string; examples: string; source: string }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-3 pr-6 text-gray-900 font-medium">{category}</td>
      <td className="py-3 pr-6 text-gray-600">{examples}</td>
      <td className="py-3 text-gray-600">{source}</td>
    </tr>
  );
}

function LegalBasis({ basis, description }: { basis: string; description: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">{basis}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function RetentionRow({ label, period }: { label: string; period: string }) {
  return (
    <div className="flex gap-4 py-3">
      <span className="text-gray-900 font-medium w-48 shrink-0">{label}</span>
      <span className="text-gray-600">{period}</span>
    </div>
  );
}

function SubProcessor({ name, role, location, mechanism, link }: {
  name: string; role: string; location: string; mechanism: string; link: string;
}) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          <p className="text-gray-500 mt-0.5">{role}</p>
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 text-xs shrink-0 underline">Privacy policy</a>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
        <span>Location: {location}</span>
        <span>Transfer: {mechanism}</span>
      </div>
    </div>
  );
}

function Right({ article, title, description }: { article: string; title: string; description: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm">
      <p className="text-xs font-semibold text-blue-600 mb-1">{article}</p>
      <p className="font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function CookieRow({ type, purpose, consent }: { type: string; purpose: string; consent: string }) {
  return (
    <div className="flex gap-4 py-3">
      <span className="text-gray-900 font-medium w-52 shrink-0">{type}</span>
      <div>
        <p className="text-gray-600">{purpose}</p>
        <p className="text-gray-400 text-xs mt-0.5">{consent}</p>
      </div>
    </div>
  );
}
