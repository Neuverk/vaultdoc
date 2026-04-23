export const dynamic = 'force-dynamic'

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-gray-100 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function TogglePlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">{label}</span>
      <div
        title="Feature toggle — not yet wired"
        className="relative h-5 w-9 rounded-full bg-gray-200 cursor-not-allowed"
      >
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" />
      </div>
    </div>
  )
}

export default function AdminSettingsPage() {
  return (
    <div className="max-w-225">
      <div className="border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-[15px] font-semibold text-gray-900">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Internal admin configuration. Most toggles are placeholders for future runtime controls.
        </p>
      </div>

      <div className="px-8 py-6 space-y-6">

      {/* Beta system */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Beta Access</h2>
          <p className="text-xs text-gray-500 mt-0.5">Control the public beta waitlist behavior.</p>
        </div>
        <div className="px-5">
          <SettingRow
            label="Beta system enabled"
            description="When enabled, /beta is public and requests are accepted."
          >
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
          <SettingRow
            label="Auto-approve beta requests"
            description="Automatically send invites without manual review."
          >
            <TogglePlaceholder label="Off" />
          </SettingRow>
          <SettingRow
            label="Notify admin on new request"
            description={`Sends an email to the ADMIN_EMAIL address on each new submission.`}
          >
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
        </div>
      </section>

      {/* Invitations */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Invitations</h2>
          <p className="text-xs text-gray-500 mt-0.5">Clerk invitation and onboarding behavior.</p>
        </div>
        <div className="px-5">
          <SettingRow
            label="Default invitation redirect"
            description="Where Clerk sends approved users after they click the invite link."
          >
            <code className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">/sign-up</code>
          </SettingRow>
          <SettingRow
            label="Welcome email on approval"
            description="Sends a branded welcome email when a beta request is approved."
          >
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
        </div>
      </section>

      {/* Feature flags */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Feature Flags</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Runtime feature toggles. Currently managed via environment variables — UI control coming soon.
          </p>
        </div>
        <div className="px-5">
          <SettingRow label="Document generation" description="Enable/disable AI document generation globally.">
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
          <SettingRow label="Stripe billing" description="Enable/disable the Stripe billing flow.">
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
          <SettingRow label="Reference document upload" description="Allow users to upload reference documents for generation.">
            <TogglePlaceholder label="Enabled" />
          </SettingRow>
        </div>
      </section>

      {/* Support */}
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Support & Contact</h2>
        </div>
        <div className="px-5">
          <SettingRow label="Admin email" description="Used for internal notifications and beta alerts.">
            <code className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">ADMIN_EMAIL env var</code>
          </SettingRow>
          <SettingRow label="Platform admin emails" description="Comma-separated list of emails with admin access.">
            <code className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">PLATFORM_ADMIN_EMAILS env var</code>
          </SettingRow>
          <SettingRow label="Email sender" description="From address used for all outgoing product emails.">
            <code className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">noreply@neuverk.com</code>
          </SettingRow>
        </div>
      </section>

      <p className="text-xs text-gray-400">
        Feature toggles shown above are placeholders. To wire them at runtime, add a settings table or use environment variables.
      </p>
      </div>
    </div>
  )
}
