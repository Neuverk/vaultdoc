import Link from "next/link";

export const metadata = {
  title: "Terms of Service | VaultDoc",
  description: "Terms and conditions governing use of the VaultDoc compliance documentation platform.",
};

const LAST_UPDATED = "1 January 2025";
const CONTACT_EMAIL = "legal@neuverk.com";
const COMPANY = "Neuverk UG (haftungsbeschränkt)";
const COMPANY_SHORT = "Neuverk";

export default function TermsOfServicePage() {
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
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
            <Link href="/dpa" className="hover:text-gray-900 transition-colors">DPA</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14">
        <div className="mb-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-400">Last updated: <span className="text-gray-600">{LAST_UPDATED}</span></p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-7 mb-4">
          <p className="text-gray-600 leading-relaxed">
            These Terms of Service ("<strong className="text-gray-900">Terms</strong>") govern your access to and use of the VaultDoc platform operated by{" "}
            <strong className="text-gray-900">{COMPANY}</strong> ("{COMPANY_SHORT}", "we", "us", "our") at vaultdoc.neuverk.com. By creating an account or using VaultDoc, you agree to these Terms. If you do not agree, do not use the service.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            For questions about these Terms, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </div>

        <Section title="1. The Service">
          <p className="text-gray-600 leading-relaxed">
            VaultDoc is a compliance documentation platform that uses artificial intelligence to help organisations generate, store, and manage compliance documents. The service is provided on a subscription basis with a free tier and paid plans as described on our pricing page.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            We reserve the right to modify, suspend, or discontinue any part of the service at any time with reasonable notice. We will not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
          </p>
        </Section>

        <Section title="2. Eligibility and Account Registration">
          <p className="text-gray-600 leading-relaxed mb-4">To use VaultDoc you must:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Be at least 18 years of age",
              "Have the legal capacity to enter into a binding contract",
              "If registering on behalf of an organisation, have authority to bind that organisation to these Terms",
              "Not be located in a country subject to EU or German trade sanctions",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gray-300 shrink-0 mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a> if you suspect unauthorised access.
          </p>
        </Section>

        <Section title="3. Acceptable Use">
          <p className="text-gray-600 leading-relaxed mb-4">You may use VaultDoc only for lawful purposes. You agree not to:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              "Use the service to generate documents intended to deceive, defraud, or mislead any person or authority",
              "Attempt to reverse-engineer, scrape, or extract data from the platform in an automated manner without prior written consent",
              "Upload or input content that infringes third-party intellectual property rights",
              "Input sensitive personal data of third parties (e.g. national ID numbers, health records, financial account details) into document generation fields",
              "Attempt to circumvent plan limits, rate limiting, or access controls",
              "Use the service to train or fine-tune competing AI models",
              "Resell, sublicense, or white-label the service without a separate written agreement with Neuverk",
              "Use the service in any way that violates applicable law or regulation",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="text-gray-300 shrink-0 mt-0.5">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-600 leading-relaxed mt-4">
            We reserve the right to suspend or terminate accounts that violate these provisions without prior notice.
          </p>
        </Section>

        <Section title="4. AI-Generated Content — Important Disclaimer">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <p className="text-gray-900 font-semibold mb-3">
              Documents generated by VaultDoc are produced by artificial intelligence and must be reviewed by a qualified professional before use.
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>AI-generated compliance documents do not constitute legal, regulatory, financial, or professional advice.</span></li>
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>VaultDoc does not guarantee that generated documents are accurate, complete, up-to-date, or suitable for any specific regulatory requirement.</span></li>
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>You are solely responsible for ensuring that any document you use or submit to a regulatory authority complies with applicable law.</span></li>
              <li className="flex gap-3"><span className="text-amber-600 font-bold shrink-0">—</span><span>We strongly recommend that all generated documents be reviewed by a qualified legal, compliance, or data protection professional before use.</span></li>
            </ul>
          </div>
        </Section>

        <Section title="5. Subscription Plans and Billing">
          <div className="space-y-3">
            <Clause title="5.1 Plans">VaultDoc offers a free tier and paid subscription plans (currently Starter at €49/month and Enterprise at €199/month). Plan features and limits are described on the pricing page and may be updated from time to time with reasonable notice.</Clause>
            <Clause title="5.2 Billing">Paid subscriptions are billed monthly in advance via Stripe. By subscribing, you authorise Neuverk to charge your payment method on a recurring basis until you cancel. All prices are exclusive of VAT where applicable. VAT will be added at the applicable rate based on your billing address.</Clause>
            <Clause title="5.3 Free Tier Limits">Free tier accounts are limited to 3 generated documents. Exceeding this limit requires upgrading to a paid plan. We reserve the right to modify free tier limits at any time with 30 days notice.</Clause>
            <Clause title="5.4 Cancellation">You may cancel your subscription at any time from the billing section of your dashboard. Cancellation takes effect at the end of the current billing period. You will retain access to paid features until that date.</Clause>
            <Clause title="5.5 Refund Policy">We offer a 14-day money-back guarantee for first-time paid subscriptions. If you are not satisfied within 14 days of your first payment, contact us at legal@neuverk.com for a full refund. After 14 days, payments are non-refundable except where required by applicable EU consumer law. Partial-month refunds are not provided.</Clause>
            <Clause title="5.6 Price Changes">We may change subscription prices with at least 30 days written notice by email. Continued use of the service after a price change constitutes acceptance of the new price.</Clause>
          </div>
        </Section>

        <Section title="6. Intellectual Property">
          <div className="space-y-3">
            <Clause title="6.1 Your Content">You retain all intellectual property rights in the inputs you provide to VaultDoc (form responses, chat messages, uploaded files). By using the service, you grant Neuverk a limited, non-exclusive licence to process your inputs solely for the purpose of providing the service to you.</Clause>
            <Clause title="6.2 Generated Documents">Documents generated by VaultDoc based on your inputs are provided to you for your use. To the extent that AI-generated output is capable of copyright protection, Neuverk assigns any such rights to you. You are responsible for ensuring that generated documents do not infringe third-party rights.</Clause>
            <Clause title="6.3 VaultDoc Platform">The VaultDoc platform, including its software, design, trademarks, and underlying AI prompts, remains the exclusive property of {COMPANY}. Nothing in these Terms transfers any rights in the platform to you.</Clause>
          </div>
        </Section>

        <Section title="7. Data Processing and Privacy">
          <p className="text-gray-600 leading-relaxed">
            Your use of VaultDoc is also governed by our{" "}
            <Link href="/privacy" className="text-gray-900 font-medium hover:underline">Privacy Policy</Link> and, where applicable, our{" "}
            <Link href="/dpa" className="text-gray-900 font-medium hover:underline">Data Processing Agreement</Link>. By using the service, you acknowledge that your document inputs are processed by Anthropic&apos;s AI (Claude API) to generate document content.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-sm text-gray-600 leading-relaxed space-y-3">
            <p><strong className="text-gray-900">To the maximum extent permitted by applicable law</strong>, {COMPANY} and its officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
            <ul className="space-y-1 ml-4">
              <li>— Loss of profits, revenue, or business opportunities</li>
              <li>— Regulatory fines or penalties resulting from use of AI-generated documents</li>
              <li>— Data loss or corruption</li>
              <li>— Service interruptions or downtime</li>
            </ul>
            <p>Our total aggregate liability shall not exceed the greater of (a) fees paid by you in the 3 months preceding the claim, or (b) €100.</p>
            <p className="text-gray-400 text-xs border-t border-gray-200 pt-3">Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded under German law (BGB §276).</p>
          </div>
        </Section>

        <Section title="9. Indemnification">
          <p className="text-gray-600 leading-relaxed">
            You agree to indemnify and hold harmless {COMPANY} and its officers, employees, and agents from any claims, damages, losses, or costs (including legal fees) arising from: (a) your violation of these Terms; (b) your use of AI-generated documents without appropriate professional review; (c) your infringement of any third-party rights; or (d) your violation of applicable law.
          </p>
        </Section>

        <Section title="10. Service Availability and Warranties">
          <p className="text-gray-600 leading-relaxed">
            VaultDoc is provided <strong className="text-gray-900">&quot;as is&quot;</strong> and <strong className="text-gray-900">&quot;as available&quot;</strong> without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or that generated documents will meet your specific regulatory requirements.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">We target 99.5% monthly uptime for paid plans. Scheduled maintenance will be communicated in advance where possible.</p>
        </Section>

        <Section title="11. Termination">
          <div className="space-y-3">
            <Clause title="11.1 By You">You may close your account at any time from the billing settings in your dashboard. Account deletion is permanent and will result in the deletion of all your documents and data as described in our Privacy Policy.</Clause>
            <Clause title="11.2 By Us">We may suspend or terminate your account immediately if you breach these Terms, engage in fraudulent activity, or if required to do so by law. For non-material breaches, we will provide 7 days written notice and an opportunity to remedy the breach before termination.</Clause>
            <Clause title="11.3 Effect of Termination">Upon termination, your right to access the service ceases immediately. Sections 4, 6, 8, 9, 12, and 13 survive termination.</Clause>
          </div>
        </Section>

        <Section title="12. Governing Law and Dispute Resolution">
          <p className="text-gray-600 leading-relaxed">
            These Terms are governed by the laws of the <strong className="text-gray-900">Federal Republic of Germany</strong>, excluding its conflict of law provisions. The UN Convention on Contracts for the International Sale of Goods (CISG) does not apply.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">Any disputes shall be subject to the exclusive jurisdiction of the courts of Germany. EU consumers may also bring proceedings in the courts of their country of residence.</p>
          <p className="text-gray-600 leading-relaxed mt-4">
            The EU online dispute resolution platform is available at{" "}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-gray-900 font-medium hover:underline">ec.europa.eu/consumers/odr</a>. ODR contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="13. General Provisions">
          <div className="space-y-3">
            <Clause title="Entire Agreement">These Terms, together with the Privacy Policy and DPA (where applicable), constitute the entire agreement between you and Neuverk regarding VaultDoc.</Clause>
            <Clause title="Severability">If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.</Clause>
            <Clause title="Waiver">Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.</Clause>
            <Clause title="Assignment">You may not assign your rights under these Terms without our prior written consent. We may assign our rights in connection with a merger, acquisition, or sale of assets.</Clause>
            <Clause title="Changes to Terms">We will notify you by email and in-app notice at least 14 days before material changes take effect. Continued use after changes constitutes acceptance.</Clause>
          </div>
        </Section>

        <Section title="14. Contact">
          <p className="text-gray-600 leading-relaxed mb-5">For questions about these Terms, please contact:</p>
          <address className="not-italic text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-5 leading-7">
            {COMPANY}<br />
            [Street Address]<br />
            [City, Postcode], Germany<br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gray-900 font-medium hover:underline">{CONTACT_EMAIL}</a>
          </address>
        </Section>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
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

function Clause({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}
