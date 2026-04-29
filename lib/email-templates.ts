const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'

export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

type LayoutOpts = {
  subject: string
  title: string
  greeting?: string | null
  body: string
  infoRows?: { key: string; value: string }[]
  ctaText: string
  ctaUrl: string
  footerNote?: string
}

function layout(opts: LayoutOpts): { subject: string; html: string } {
  const BG          = '#1f2024'
  const FOOTER_BG   = '#2a2b2f'
  const DIVIDER     = '#2e2e33'
  const ROW_BORDER  = '#3f3f46'
  const H           = '#f4f4f5'   // headings / logo
  const BODY        = '#e4e4e7'   // paragraph text
  const DIM         = '#71717a'   // labels / footer links

  const footerLinks: [string, string][] = [
    ['Datenschutz', `${APP_URL}/privacy`],
    ['AGB',         `${APP_URL}/terms`],
    ['AVV',         `${APP_URL}/dpa`],
    ['Support',     'mailto:support@neuverk.com'],
  ]
  const footerLinksHtml = footerLinks
    .map(([label, url]) => `<a href="${url}" style="color:${DIM};text-decoration:none">${label}</a>`)
    .join('&nbsp;&nbsp;·&nbsp;&nbsp;')

  const displayUrl = opts.ctaUrl.startsWith('mailto:')
    ? opts.ctaUrl.replace('mailto:', '')
    : opts.ctaUrl

  const greetingHtml = opts.greeting
    ? `<p style="margin:0 0 20px;font-size:15px;font-weight:500;color:${H};line-height:1.5">${esc(opts.greeting)}</p>`
    : ''

  const infoHtml = opts.infoRows?.length
    ? `<div style="margin:28px 0 0">
        ${opts.infoRows.map((r, i) => {
          const topBorder = i > 0 ? `border-top:1px solid ${ROW_BORDER};` : ''
          return `<div style="${topBorder}border-bottom:1px solid ${ROW_BORDER};padding:12px 0">
            <div style="font-size:11px;color:${DIM};letter-spacing:0.04em;
                        text-transform:uppercase;margin-bottom:4px">${esc(r.key)}</div>
            <div style="font-size:13.5px;color:${BODY};word-break:break-word">${esc(r.value)}</div>
          </div>`
        }).join('')}
      </div>`
    : ''

  const footerNoteHtml = opts.footerNote
    ? `<p style="font-size:11px;color:${DIM};margin:14px 0 0;line-height:1.6">${opts.footerNote}</p>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${esc(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};color:${BODY};
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
             -webkit-font-smoothing:antialiased">

  <div style="max-width:560px;width:100%;margin:0 auto;padding:40px 24px 64px;
              box-sizing:border-box;background:${BG}">

    <div style="margin-bottom:32px">
      <div style="font-size:15px;font-weight:700;color:${H};letter-spacing:-0.01em">VaultDoc</div>
      <div style="font-size:11px;color:${DIM};margin-top:2px">by Neuverk</div>
    </div>

    <div style="border-top:1px solid ${DIVIDER};margin-bottom:32px"></div>

    <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${H};
               letter-spacing:-0.02em;line-height:1.3">${esc(opts.title)}</h1>

    ${greetingHtml}

    <div style="font-size:15px;line-height:1.7;color:${BODY}">
      ${opts.body}
    </div>

    ${infoHtml}

    <div style="margin:32px 0 0">
      <a href="${opts.ctaUrl}"
         style="display:inline-block;background:#ffffff;color:#111111;
                font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;
                text-decoration:none;line-height:1">${esc(opts.ctaText)}</a>
    </div>
    <div style="margin:10px 0 0;font-size:12px;color:${DIM};word-break:break-all">
      ${esc(displayUrl)}
    </div>

    <div style="background:${FOOTER_BG};border-radius:10px;padding:24px 28px;
                text-align:center;margin-top:48px">
      <div style="font-size:13px;font-weight:600;color:${H};margin-bottom:2px">VaultDoc</div>
      <div style="font-size:12px;color:${DIM};margin-bottom:16px">
        Neuverk &nbsp;·&nbsp; Munich, Germany
      </div>
      <div style="font-size:12px;line-height:2">
        ${footerLinksHtml}
      </div>
      ${footerNoteHtml}
    </div>

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
  return layout({
    subject: 'VaultDoc Beta-Anfrage erhalten',
    title: 'Beta-Anfrage erhalten',
    greeting: `Hallo ${opts.firstName},`,
    body: `
      <p style="margin:0 0 16px">Vielen Dank für Ihr Interesse an VaultDoc.</p>
      <p style="margin:0">Wir haben Ihre Anfrage erhalten und werden sie innerhalb von 48 Stunden
      prüfen. Sobald eine Entscheidung getroffen wurde, erhalten Sie eine Benachrichtigung.</p>
    `,
    ctaText: 'VaultDoc öffnen',
    ctaUrl: 'https://vaultdoc.neuverk.com',
  })
}

export function betaApproved(opts: {
  to: string
  firstName: string
  inviteUrl: string
}): { subject: string; html: string } {
  return layout({
    subject: 'Ihre Einladung zu VaultDoc',
    title: 'Einladung genehmigt',
    greeting: `Hallo ${opts.firstName},`,
    body: `
      <p style="margin:0 0 16px">Ihre Beta-Anfrage wurde genehmigt. Klicken Sie auf den Button,
      um Ihr Konto zu erstellen und direkt loszulegen.</p>
      <p style="margin:0;font-size:13px;color:#71717a">
        Dieser Einladungslink ist einmalig und persönlich. Bitte leiten Sie ihn nicht weiter.
      </p>
    `,
    ctaText: 'Konto erstellen',
    ctaUrl: opts.inviteUrl,
  })
}

export function welcome(opts: {
  to: string
  firstName: string
  plan: string
  docsIncluded: number
}): { subject: string; html: string } {
  return layout({
    subject: 'Willkommen bei VaultDoc',
    title: 'Willkommen bei VaultDoc',
    greeting: `Hallo ${opts.firstName},`,
    body: `
      <p style="margin:0">Ihr Konto ist aktiv. Erstellen Sie jetzt Ihr erstes Compliance-Dokument
      für ISO 27001, TISAX, SOC 2, DSGVO und weitere Standards.</p>
    `,
    infoRows: [
      { key: 'Plan',                  value: opts.plan },
      { key: 'Enthaltene Dokumente',  value: String(opts.docsIncluded) },
      { key: 'Datenregion',           value: 'EU Frankfurt' },
    ],
    ctaText: 'Erstes Dokument erstellen',
    ctaUrl: `${APP_URL}/dashboard`,
  })
}

export function firstDocReminder(opts: {
  to: string
  firstName: string | null
}): { subject: string; html: string } {
  const greeting = opts.firstName ? `Hallo ${opts.firstName},` : null
  return layout({
    subject: 'Ihr erstes VaultDoc-Dokument wartet',
    title: 'Ihr erstes Dokument wartet',
    greeting,
    body: `
      <p style="margin:0 0 16px">Sie haben VaultDoc noch nicht genutzt. Es dauert weniger als
      2 Minuten, ein prüffähiges Compliance-Dokument zu erstellen.</p>
      <p style="margin:0">VaultDoc unterstützt ISO 27001, TISAX, SOC 2, DSGVO und weitere
      Standards.</p>
    `,
    ctaText: 'Dokument erstellen',
    ctaUrl: `${APP_URL}/dashboard/documents/new`,
    footerNote: `Um keine Erinnerungen mehr zu erhalten, können Sie Ihre <a href="${APP_URL}/dashboard/account" style="color:#a1a1aa;text-decoration:underline">Benachrichtigungseinstellungen</a> anpassen.`,
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
  const greeting = opts.firstName ? `Hallo ${opts.firstName},` : null
  return layout({
    subject: 'Ihr VaultDoc-Dokument ist bereit',
    title: 'Dokument erstellt',
    greeting,
    body: `
      <p style="margin:0">Das Dokument <strong style="color:#f4f4f5;font-weight:600">${esc(opts.docTitle)}</strong>
      wurde erfolgreich erstellt. Sie können es jetzt öffnen, bearbeiten und zur Genehmigung
      einreichen.</p>
    `,
    infoRows: [
      { key: 'Erstellt am', value: fmtDate(opts.createdAt) },
    ],
    ctaText: 'Dokument öffnen',
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
    subject: 'VaultDoc-Konto zur Löschung vorgemerkt',
    title: 'Konto zur Löschung vorgemerkt',
    greeting: null,
    body: `
      <p style="margin:0 0 16px">Der Zugang zu Ihrem VaultDoc-Konto wurde sofort deaktiviert.
      Ihre Daten werden 7 Tage lang aufbewahrt und anschließend dauerhaft gelöscht.</p>
      <p style="margin:0">Falls dies ein Fehler war, wenden Sie sich bitte
      <strong style="color:#f4f4f5;font-weight:600">umgehend</strong> an unseren Support unter
      <a href="mailto:support@neuverk.com" style="color:#a1a1aa;text-decoration:none">support@neuverk.com</a>.</p>
    `,
    infoRows: [
      { key: 'E-Mail-Adresse', value: opts.accountEmail },
      { key: 'Löschdatum',     value: fmtDate(opts.deletionDate) },
      { key: 'Anfrage-ID',     value: opts.requestId },
    ],
    ctaText: 'Support kontaktieren',
    ctaUrl: 'mailto:support@neuverk.com',
  })
}
