const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

type BannerVariant = 'green' | 'amber' | 'blue'

const VARIANT: Record<BannerVariant, { bg: string; border: string; titleColor: string; ctaBg: string }> = {
  green: { bg: '#f0faf4', border: '#a8dfc0', titleColor: '#1a5c35', ctaBg: '#1a5c35' },
  amber: { bg: '#fffbf0', border: '#f5d9a0', titleColor: '#7a4f00', ctaBg: '#b45309' },
  blue:  { bg: '#f0f4ff', border: '#b0c4f5', titleColor: '#1a3a7a', ctaBg: '#1a3a7a' },
}

type LayoutOpts = {
  subject: string
  headerBg: string
  variant: BannerVariant
  bannerIcon: string
  bannerTitle: string
  bannerSubtitle: string
  greeting: string | null
  bodyDE: string
  bodyEN: string
  infoRows?: { key: string; value: string }[]
  ctaText: string
  ctaUrl: string
  footerNote?: string
}

function makeHeader(bg: string): string {
  return `
  <div style="background:${bg};border-radius:12px 12px 0 0;padding:20px 28px">
    <a href="https://vaultdoc.neuverk.com" style="text-decoration:none;display:inline-block">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="vertical-align:middle;padding-right:10px">
            <div style="width:40px;height:40px;background:#ffffff;border-radius:8px;text-align:center;
                        line-height:40px;font-size:17px;font-weight:700;color:#0f0e0c">V</div>
          </td>
          <td style="vertical-align:middle">
            <div style="color:#ffffff;font-size:15px;font-weight:600;line-height:1.3;margin:0">VaultDoc</div>
            <div style="color:rgba(255,255,255,0.38);font-size:11px;line-height:1.3;margin:2px 0 0">by Neuverk</div>
          </td>
        </tr>
      </table>
    </a>
  </div>`
}

function makeBanner(variant: BannerVariant, icon: string, title: string, subtitle: string): string {
  const v = VARIANT[variant]
  return `
  <div style="background:${v.bg};border-left:1px solid ${v.border};border-right:1px solid ${v.border};
              border-bottom:1px solid ${v.border};padding:14px 28px">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="vertical-align:middle;font-size:18px;padding-right:12px;line-height:1">${icon}</td>
        <td style="vertical-align:middle">
          <div style="font-size:13.5px;font-weight:600;color:${v.titleColor};line-height:1.3;margin:0">${title}</div>
          <div style="font-size:11.5px;color:#7a756e;line-height:1.3;margin:3px 0 0">${subtitle}</div>
        </td>
      </tr>
    </table>
  </div>`
}

function makeInfoTable(rows: { key: string; value: string }[]): string {
  const trs = rows.map((r, i) => {
    const border = i < rows.length - 1 ? 'border-bottom:1px solid #e4e0d9;' : ''
    return `
      <tr>
        <td style="${border}padding:9px 16px;font-size:11.5px;color:#7a756e;font-weight:500;
                   white-space:nowrap;vertical-align:top;width:42%">${esc(r.key)}</td>
        <td style="${border}padding:9px 16px;font-size:11.5px;
                   font-family:'Courier New',Courier,monospace;color:#0f0e0c;
                   word-break:break-all">${esc(r.value)}</td>
      </tr>`
  }).join('')
  return `
  <div style="background:#f7f5f2;border:1px solid #e4e0d9;border-radius:10px;
              margin:24px 0 0;overflow:hidden">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;border-collapse:collapse">
      ${trs}
    </table>
  </div>`
}

function makeFooter(extraNote?: string): string {
  const links: [string, string][] = [
    ['Datenschutz', `${APP_URL}/privacy`],
    ['Privacy Policy', `${APP_URL}/privacy`],
    ['AGB', `${APP_URL}/terms`],
    ['Terms', `${APP_URL}/terms`],
    ['AVV', `${APP_URL}/dpa`],
    ['DPA', `${APP_URL}/dpa`],
    ['Support', 'mailto:support@neuverk.com'],
  ]
  const linkHtml = links
    .map(([label, url]) => `<a href="${url}" style="color:#7a756e;text-decoration:none">${label}</a>`)
    .join(' &nbsp;&middot;&nbsp; ')
  const noteHtml = extraNote
    ? `<div style="font-size:11px;color:#b0a898;margin:8px 0 0;line-height:1.6">${extraNote}</div>`
    : ''
  return `
  <div style="background:#f7f5f2;border:1.5px solid #e8e3db;border-top:none;
              border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
    <div style="font-size:11px;color:#7a756e;line-height:2">${linkHtml}</div>
    ${noteHtml}
    <div style="font-size:10px;color:#b0a898;font-family:'Courier New',Courier,monospace;margin-top:10px">
      Neuverk UG (haftungsbeschränkt) &nbsp;&middot;&nbsp; Frankfurt am Main, Germany
    </div>
  </div>`
}

function layout(opts: LayoutOpts): { subject: string; html: string } {
  const v = VARIANT[opts.variant]
  const greetingHtml = opts.greeting
    ? `<p style="font-size:14px;font-weight:600;color:#0f0e0c;margin:0 0 20px;line-height:1.5">${esc(opts.greeting)}</p>`
    : ''
  const tableHtml = opts.infoRows?.length ? makeInfoTable(opts.infoRows) : ''
  const displayUrl = opts.ctaUrl.startsWith('mailto:')
    ? opts.ctaUrl.replace('mailto:', '')
    : opts.ctaUrl

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${esc(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f7f5f2;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
             -webkit-font-smoothing:antialiased">

  <div style="max-width:600px;width:100%;margin:0 auto;padding:32px 16px 48px;box-sizing:border-box">

    ${makeHeader(opts.headerBg)}
    ${makeBanner(opts.variant, opts.bannerIcon, opts.bannerTitle, opts.bannerSubtitle)}

    <div style="background:#ffffff;border-left:1.5px solid #e8e3db;border-right:1.5px solid #e8e3db;
                padding:36px">
      ${greetingHtml}

      <div style="font-size:14px;line-height:1.72;color:#5a5549">
        ${opts.bodyDE}
      </div>

      <hr style="border:none;border-top:1px solid #e8e3db;margin:22px 0">

      <div style="font-size:13px;line-height:1.72;color:#7a756e">
        ${opts.bodyEN}
      </div>

      ${tableHtml}

      <div style="margin:28px 0 0;text-align:left">
        <a href="${opts.ctaUrl}"
           style="display:inline-block;background:${v.ctaBg};color:#ffffff;
                  font-size:13.5px;font-weight:600;padding:13px 34px;border-radius:9px;
                  text-decoration:none;line-height:1">${esc(opts.ctaText)}</a>
      </div>
      <div style="margin:10px 0 0;font-size:11px;color:#b0a898;word-break:break-all">
        ${displayUrl}
      </div>
    </div>

    ${makeFooter(opts.footerNote)}

  </div>
</body>
</html>`

  return { subject: opts.subject, html }
}

// ─── Public template functions ────────────────────────────────────────────────

export function betaRequestReceived(opts: {
  to: string
  firstName: string
}): { subject: string; html: string } {
  const name = esc(opts.firstName)
  return layout({
    subject: 'Beta-Anfrage erhalten – wir melden uns bald',
    headerBg: '#0f2a1a',
    variant: 'green',
    bannerIcon: '★',
    bannerTitle: 'Anfrage eingegangen',
    bannerSubtitle: 'Wir melden uns innerhalb von 48 Stunden.',
    greeting: `Hallo ${name} / Hello ${name}`,
    bodyDE: `
      <p style="margin:0 0 14px">Vielen Dank für Ihre Beta-Anfrage. Wir haben Ihre Bewerbung
      erhalten und werden diese innerhalb von 48 Stunden prüfen.</p>
      <p style="margin:0">Sobald eine Entscheidung getroffen wurde, erhalten Sie eine
      E-Mail von uns.</p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">Thank you for your beta request. We have received your
      application and will review it within 48 hours.</p>
      <p style="margin:0">Once a decision has been made, you will receive an email
      with further details.</p>
    `,
    ctaText: 'VaultDoc besuchen / Visit VaultDoc',
    ctaUrl: 'https://vaultdoc.neuverk.com',
  })
}

export function betaApproved(opts: {
  to: string
  firstName: string
  inviteUrl: string
}): { subject: string; html: string } {
  const name = esc(opts.firstName)
  return layout({
    subject: "You're invited to VaultDoc",
    headerBg: '#0f2a1a',
    variant: 'green',
    bannerIcon: '✓',
    bannerTitle: 'Beta-Zugang genehmigt',
    bannerSubtitle: 'Erstellen Sie jetzt Ihr Konto.',
    greeting: `Hallo ${name} / Hello ${name}`,
    bodyDE: `
      <p style="margin:0 0 14px">Herzlichen Glückwunsch — Ihre Beta-Anfrage wurde genehmigt.
      Sie können jetzt Ihr VaultDoc-Konto erstellen und sofort mit der Erstellung
      prüffähiger Compliance-Dokumente beginnen.</p>
      <p style="margin:0;font-size:12.5px;color:#7a756e">
        Dieser Einladungslink ist einmalig. Bitte leiten Sie ihn nicht weiter.
      </p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">Congratulations — your beta request has been approved.
      You can now create your VaultDoc account and start generating audit-ready
      compliance documents right away.</p>
      <p style="margin:0;font-size:12px;color:#9a948c">
        This invite link is single-use. Do not forward it.
      </p>
    `,
    ctaText: 'Konto erstellen / Create your account',
    ctaUrl: opts.inviteUrl,
  })
}

export function welcome(opts: {
  to: string
  firstName: string
  plan: string
  docsIncluded: number
}): { subject: string; html: string } {
  const name = esc(opts.firstName)
  return layout({
    subject: 'Willkommen bei VaultDoc – Ihr Konto ist bereit',
    headerBg: '#0f0e0c',
    variant: 'green',
    bannerIcon: '✓',
    bannerTitle: 'Konto aktiviert',
    bannerSubtitle: 'Ihr VaultDoc-Konto ist einsatzbereit.',
    greeting: `Hallo ${name} / Hello ${name}`,
    bodyDE: `
      <p style="margin:0 0 14px">Ihr VaultDoc-Konto ist jetzt aktiv. Erstellen Sie sofort
      prüffähige Compliance-Dokumente für ISO 27001, TISAX, SOC 2, DSGVO und weitere
      Standards.</p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">Your VaultDoc account is now active. Start generating
      audit-ready compliance documents for ISO 27001, TISAX, SOC 2, GDPR, and more —
      right away.</p>
    `,
    infoRows: [
      { key: 'Plan', value: opts.plan },
      { key: 'Enthaltene Dokumente', value: String(opts.docsIncluded) },
      { key: 'Datenregion', value: 'EU Frankfurt' },
      { key: 'DSGVO-Konformität', value: '✓ Included' },
    ],
    ctaText: 'Erstes Dokument erstellen / Create your first document',
    ctaUrl: `${APP_URL}/dashboard`,
  })
}

export function firstDocReminder(opts: {
  to: string
  firstName: string | null
}): { subject: string; html: string } {
  const name = opts.firstName ? esc(opts.firstName) : null
  const greeting = name ? `Hallo ${name} / Hello ${name}` : 'Hallo / Hello'
  return layout({
    subject: 'Ihr erstes Dokument wartet / Create your first document',
    headerBg: '#1a3a1a',
    variant: 'amber',
    bannerIcon: '⏱',
    bannerTitle: 'Noch kein Dokument erstellt',
    bannerSubtitle: 'Es dauert weniger als 2 Minuten.',
    greeting,
    bodyDE: `
      <p style="margin:0 0 14px">Sie haben kürzlich Zugang zu VaultDoc erhalten, aber noch
      kein Dokument erstellt. Es dauert weniger als 2 Minuten, Ihr erstes Compliance-Dokument
      zu generieren.</p>
      <p style="margin:0">VaultDoc unterstützt ISO 27001, TISAX, SOC 2, DSGVO und weitere
      Standards.</p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">You recently got access to VaultDoc but haven't created a
      document yet. It takes under 2 minutes to generate your first compliance document.</p>
      <p style="margin:0">VaultDoc supports ISO 27001, TISAX, SOC 2, GDPR, and more.</p>
    `,
    ctaText: 'Erstes Dokument erstellen / Create your first document',
    ctaUrl: `${APP_URL}/dashboard/documents/new`,
    footerNote: `To stop receiving reminder emails, <a href="${APP_URL}/dashboard/account" style="color:#b0a898;text-decoration:underline">manage your preferences</a>.`,
  })
}

export function documentCreated(opts: {
  to: string
  firstName: string | null
  docTitle: string
  docId: string
  createdAt: Date
  documentUrl: string
}): { subject: string; html: string } {
  const name = opts.firstName ? esc(opts.firstName) : null
  const greeting = name ? `Hallo ${name} / Hello ${name}` : 'Hallo / Hello'
  const shortTitle = opts.docTitle.length > 58
    ? opts.docTitle.slice(0, 58) + '…'
    : opts.docTitle
  return layout({
    subject: 'Ihr Dokument wurde erstellt / Your document is ready',
    headerBg: '#0c1f3a',
    variant: 'blue',
    bannerIcon: '📄',
    bannerTitle: 'Dokument erstellt',
    bannerSubtitle: `„${shortTitle}“`,
    greeting,
    bodyDE: `
      <p style="margin:0 0 14px">Ihr Compliance-Dokument wurde erfolgreich erstellt.
      Sie können es jetzt überprüfen, bearbeiten und zur Genehmigung einreichen.</p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">Your compliance document has been created successfully.
      You can now review it, make edits, and submit it for approval.</p>
    `,
    infoRows: [
      { key: 'Titel / Title', value: opts.docTitle },
      { key: 'Erstellt / Created', value: fmtDate(opts.createdAt) },
      { key: 'Dokument-ID', value: opts.docId },
    ],
    ctaText: 'Dokument öffnen / Open document',
    ctaUrl: opts.documentUrl,
  })
}

export function accountDeletionScheduled(opts: {
  to: string
  accountEmail: string
  deletionDate: Date
  requestId: string
}): { subject: string; html: string } {
  return layout({
    subject: 'VaultDoc account deletion scheduled / VaultDoc-Konto zur Löschung vorgemerkt',
    headerBg: '#0f0e0c',
    variant: 'amber',
    bannerIcon: '⚠',
    bannerTitle: 'Konto zur Löschung vorgemerkt',
    bannerSubtitle: 'Der Zugang wurde sofort deaktiviert.',
    greeting: null,
    bodyDE: `
      <p style="margin:0 0 14px">Ihr VaultDoc-Konto wurde zur Löschung vorgemerkt.
      Der Zugang wurde sofort deaktiviert. Ihre Daten werden 7 Tage lang aufbewahrt
      und anschließend dauerhaft gelöscht.</p>
      <p style="margin:0">Falls dies ein Fehler war, wenden Sie sich bitte
      <strong>umgehend</strong> an den Support:
      <a href="mailto:support@neuverk.com" style="color:#5a5549">support@neuverk.com</a></p>
    `,
    bodyEN: `
      <p style="margin:0 0 14px">Your VaultDoc account has been scheduled for deletion.
      Access has been disabled immediately. Your data will be retained for 7 days before
      being permanently deleted.</p>
      <p style="margin:0">If this was a mistake, contact support <strong>immediately</strong>
      at <a href="mailto:support@neuverk.com" style="color:#7a756e">support@neuverk.com</a>.</p>
    `,
    infoRows: [
      { key: 'Account / Konto', value: opts.accountEmail },
      { key: 'Status', value: 'Scheduled for deletion' },
      { key: 'Datenspeicherung / Retention', value: '7 days' },
      { key: 'Löschdatum / Deletion date', value: fmtDate(opts.deletionDate) },
      { key: 'Anfrage-ID / Request ID', value: opts.requestId },
    ],
    ctaText: 'Support kontaktieren / Contact support',
    ctaUrl: 'mailto:support@neuverk.com',
    footerNote: 'Do not reply to this email. Contact <a href="mailto:support@neuverk.com" style="color:#b0a898;text-decoration:underline">support@neuverk.com</a> directly.',
  })
}
