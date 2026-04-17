export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white px-10 py-12 shadow-sm">

          <div className="mb-10 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: 17 April 2026</p>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of VaultDoc,
              operated by Neuverk (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an account or using
              VaultDoc, you agree to these Terms. If you do not agree, you must not use the service.
            </p>
          </div>

          <Section title="1. About VaultDoc">
            <p>
              VaultDoc is an AI-powered compliance documentation platform that helps organisations
              generate, manage, and export compliance-related documents including policies, standard
              operating procedures, and runbooks. The service is provided by Neuverk, a company
              based in Munich, Germany.
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Neuverk</p>
              <p>Munich, Germany</p>
              <p>
                Email:{' '}
                <a href="mailto:contact@neuverk.com" className="text-blue-600 hover:underline">
                  contact@neuverk.com
                </a>
              </p>
            </div>
          </Section>

          <Section title="2. Eligibility">
            <p>
              You must be at least 18 years of age and have the legal authority to enter into
              binding contracts to use VaultDoc. If you are using VaultDoc on behalf of an
              organisation, you represent that you have authority to bind that organisation to
              these Terms.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <p>
              To access VaultDoc, you must create an account using a valid email address or
              an approved SSO provider (Google, Microsoft). You are responsible for:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>— Maintaining the confidentiality of your account credentials</li>
              <li>— All activity that occurs under your account</li>
              <li>— Notifying us immediately of any unauthorised use of your account</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these Terms
              or are used for fraudulent or abusive activity.
            </p>
          </Section>

          <Section title="4. Subscription Plans and Billing">
            <p>
              VaultDoc is offered on a subscription basis. Current plans and pricing are
              displayed on our pricing page. By subscribing to a paid plan, you authorise
              us to charge the applicable fees to your payment method via Stripe.
            </p>
            <SubSection title="Free plan">
              <p>
                The free plan includes limited document generation with watermarked exports.
                No payment method is required for the free plan.
              </p>
            </SubSection>
            <SubSection title="Paid plans">
              <p>
                Paid subscriptions are billed monthly in advance. Subscription fees are
                non-refundable except where required by applicable law or as set out in
                Section 5 below.
              </p>
            </SubSection>
            <SubSection title="Plan changes">
              <p>
                You may upgrade or downgrade your plan at any time from your billing settings.
                Upgrades take effect immediately. Downgrades take effect at the start of the
                next billing period.
              </p>
            </SubSection>
            <SubSection title="Failed payments">
              <p>
                If payment fails, we will retry the charge. If payment continues to fail,
                your account may be downgraded to the free plan until payment is resolved.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Cancellation and Refunds">
            <p>
              You may cancel your subscription at any time from your billing settings. Upon
              cancellation, your subscription will remain active until the end of the current
              billing period. You will not be charged again after cancellation.
            </p>
            <p className="mt-3">
              We do not provide refunds for partial months or unused periods except where
              required by applicable consumer protection law. If you believe you are entitled
              to a refund, contact us at{' '}
              <a href="mailto:contact@neuverk.com" className="text-blue-600 hover:underline">
                contact@neuverk.com
              </a>{' '}
              within 14 days of the charge.
            </p>
            <p className="mt-3">
              EU/EEA consumers have a statutory right of withdrawal for digital services
              within 14 days of purchase, unless the service has already been performed with
              your consent and acknowledgement that you lose this right upon full performance.
            </p>
          </Section>

          <Section title="6. Acceptable Use">
            <p>You agree not to use VaultDoc to:</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              <li>— Violate any applicable law or regulation</li>
              <li>— Generate documents intended to deceive, defraud, or mislead any person or organisation</li>
              <li>— Submit content that infringes any third-party intellectual property rights</li>
              <li>— Attempt to reverse engineer, scrape, or extract data from the platform</li>
              <li>— Circumvent plan limits or access controls</li>
              <li>— Transmit malware, viruses, or other harmful code</li>
              <li>— Use the service in a manner that could damage, disable, or impair our infrastructure</li>
              <li>— Resell or redistribute the service without our written permission</li>
            </ul>
          </Section>

          <Section title="7. AI-Generated Content Disclaimer">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold mb-1">Important — please read carefully</p>
              <p>
                VaultDoc uses artificial intelligence to generate compliance documentation. All
                AI-generated documents are provided as a starting point and drafting aid only.
                They do not constitute legal, compliance, or professional advice. Documents
                generated by VaultDoc should be reviewed, validated, and approved by qualified
                compliance professionals, legal counsel, or subject matter experts before use
                in any formal compliance programme, audit, regulatory submission, or
                certification process.
              </p>
            </div>
            <p className="mt-3">
              We do not warrant that AI-generated documents are accurate, complete, current,
              or fit for any particular purpose. Framework control references, regulatory
              citations, and procedural guidance in generated documents must be independently
              verified against the current version of the applicable standard or regulation.
            </p>
          </Section>

          <Section title="8. Intellectual Property">
            <SubSection title="Your content">
              <p>
                You retain full ownership of all inputs you provide and documents you generate
                using VaultDoc. By using the service, you grant us a limited, non-exclusive
                licence to process your content solely for the purpose of providing the service
                to you.
              </p>
            </SubSection>
            <SubSection title="Our platform">
              <p>
                VaultDoc, including its software, design, branding, and underlying technology,
                is owned by Neuverk and protected by applicable intellectual property laws.
                You may not copy, modify, or create derivative works of the platform without
                our express written consent.
              </p>
            </SubSection>
          </Section>

          <Section title="9. Data Protection">
            <p>
              Our collection and use of personal data is governed by our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>{' '}
              and, where applicable, our{' '}
              <a href="/dpa" className="text-blue-600 hover:underline">
                Data Processing Agreement
              </a>
              . By using VaultDoc, you acknowledge that you have read and understood our
              Privacy Policy.
            </p>
          </Section>

          <Section title="10. Availability and Service Levels">
            <p>
              We aim to provide a reliable and available service but do not guarantee
              uninterrupted access. VaultDoc is provided &ldquo;as is&rdquo; during the current beta
              period. We reserve the right to perform maintenance, updates, or modifications
              to the platform at any time, with reasonable notice where possible.
            </p>
            <p className="mt-3">
              We are not liable for any losses or damages arising from service downtime,
              data loss, or interruptions to AI generation services.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              To the fullest extent permitted by applicable law, Neuverk shall not be liable
              for any indirect, incidental, consequential, special, or punitive damages arising
              from your use of or inability to use VaultDoc, including but not limited to loss
              of data, loss of revenue, or loss of business opportunity.
            </p>
            <p className="mt-3">
              Our total liability to you for any claim arising under these Terms shall not
              exceed the total amount you paid to us in the 12 months preceding the claim.
            </p>
            <p className="mt-3 text-sm text-gray-500">
              Some jurisdictions do not allow the exclusion of certain warranties or
              limitations on liability. In such cases, the above limitations apply to the
              fullest extent permitted by law.
            </p>
          </Section>

          <Section title="12. Termination">
            <p>
              We may suspend or terminate your account and access to VaultDoc at any time
              for violation of these Terms, fraudulent activity, or non-payment, with or
              without prior notice depending on the severity of the breach.
            </p>
            <p className="mt-3">
              Upon termination, your right to use VaultDoc ceases immediately. You may
              request an export of your documents before termination where technically
              feasible. Account data will be deleted in accordance with our Privacy Policy.
            </p>
          </Section>

          <Section title="13. Governing Law and Disputes">
            <p>
              These Terms are governed by the laws of the Federal Republic of Germany,
              without regard to conflict of law principles. The UN Convention on Contracts
              for the International Sale of Goods (CISG) does not apply.
            </p>
            <p className="mt-3">
              Any disputes arising from these Terms or your use of VaultDoc shall be subject
              to the exclusive jurisdiction of the competent courts in Munich, Germany,
              subject to any mandatory consumer protection rights you may have under
              applicable law in your country of residence.
            </p>
            <p className="mt-3">
              If you are a consumer resident in the EU, you may also submit a complaint to
              the EU Online Dispute Resolution platform at{' '}
              <a
                href="https://ec.europa.eu/consumers/odr"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </Section>

          <Section title="14. Changes to These Terms">
            <p>
              We may update these Terms from time to time to reflect changes in the law,
              our business, or our services. We will notify you of material changes by
              email or via an in-platform notice at least 14 days before the changes
              take effect. Continued use of VaultDoc after the effective date constitutes
              acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="15. Contact">
            <p>
              For any questions regarding these Terms, please contact:
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-900">Neuverk</p>
              <p>Munich, Germany</p>
              <p>
                Email:{' '}
                <a href="mailto:contact@neuverk.com" className="text-blue-600 hover:underline">
                  contact@neuverk.com
                </a>
              </p>
            </div>
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