const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vaultdoc.neuverk.com'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function layout({
  bodyDE,
  bodyEN,
  cta,
}: {
  bodyDE: string
  bodyEN: string
  cta?: { text: string; url: string }
}): string {
  const ctaBlock = cta
    ? `<p style="margin:24px 0 0">
        <a href="${cta.url}"
           style="display:inline-block;background:#111111;color:#ffffff;padding:12px 24px;
                  border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;
                  line-height:1;letter-spacing:-0.1px">${cta.text}</a>
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f3f4f6;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px 48px">

    <div style="background:#111111;border-radius:12px 12px 0 0;padding:18px 28px">
      <span style="color:#ffffff;font-size:14px;font-weight:700;letter-spacing:-0.3px">VaultDoc</span>
      <span style="color:#6b7280;font-size:11px;margin-left:8px">von Neuverk</span>
    </div>

    <div style="background:#ffffff;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;
                padding:32px 28px">
      <div style="color:#111111;font-size:14px;line-height:1.75">
        ${bodyDE}
      </div>
      ${ctaBlock}

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0">

      <div style="color:#6b7280;font-size:12px;line-height:1.75">
        ${bodyEN}
      </div>
    </div>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;
                border-radius:0 0 12px 12px;padding:14px 28px;text-align:center">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        VaultDoc &middot; Neuverk &middot;
        <a href="mailto:support@neuverk.com"
           style="color:#6b7280;text-decoration:underline">support@neuverk.com</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

export function getBetaReceivedEmail(name: string): string {
  const n = esc(name)
  return layout({
    bodyDE: `
      <p>Hallo ${n},</p>
      <p>
        vielen Dank für Ihr Interesse an VaultDoc. Wir haben Ihre Anfrage erhalten
        und werden diese zeitnah prüfen. Sie erhalten eine separate E-Mail, sobald
        eine Entscheidung getroffen wurde.
      </p>
      <p>Mit freundlichen Grüßen<br>Ihr VaultDoc-Team</p>
    `,
    bodyEN: `
      <p>Hi ${n},</p>
      <p>
        thank you for your interest in VaultDoc. We have received your request
        and will review it shortly. You will hear from us once a decision has been made.
      </p>
      <p>
        Questions? Write to
        <a href="mailto:support@neuverk.com" style="color:#374151">support@neuverk.com</a>.
      </p>
    `,
  })
}

export function getBetaApprovedEmail(
  name: string,
  inviteUrl: string,
  isExistingUser: boolean,
): string {
  const n = esc(name)
  const ctaDE = isExistingUser ? 'Bei VaultDoc anmelden →' : 'Konto erstellen →'
  const noteDE = isExistingUser
    ? 'Ihr Konto ist bereit. Klicken Sie auf den Button, um sich anzumelden.'
    : 'Klicken Sie auf den Button, um Ihr Konto einzurichten. <strong>Dieser Link ist einmalig</strong> — bitte leiten Sie ihn nicht weiter.'
  const ctaEN = isExistingUser ? 'Sign in to VaultDoc →' : 'Create your account →'
  const noteEN = isExistingUser
    ? 'Your account is ready. Click below to sign in.'
    : 'Click the button to set up your account. <strong>This link is single-use</strong> — please keep it safe.'

  return layout({
    bodyDE: `
      <p>Hallo ${n},</p>
      <p>
        herzlichen Glückwunsch — Ihre Anfrage für den VaultDoc Beta-Zugang wurde genehmigt.
        VaultDoc unterstützt Enterprise-Teams bei der Erstellung prüffähiger Compliance-Dokumentation
        für ISO 27001, TISAX, SOC 2, DSGVO und weitere Standards.
      </p>
      <p>${noteDE}</p>
    `,
    cta: { text: ctaDE, url: inviteUrl },
    bodyEN: `
      <p>Hi ${n},</p>
      <p>
        great news — you have been approved for VaultDoc beta access.
        VaultDoc helps enterprise teams generate audit-ready compliance documentation
        aligned to ISO 27001, TISAX, SOC 2, GDPR, and more.
      </p>
      <p>${noteEN}</p>
      <p>
        <a href="${inviteUrl}" style="color:#374151">${ctaEN}</a>
      </p>
      <p style="word-break:break-all">
        If the link doesn't work, paste this URL into your browser:<br>
        <span style="color:#374151">${inviteUrl}</span>
      </p>
      <p>
        Questions? Reply to this email or write to
        <a href="mailto:support@neuverk.com" style="color:#374151">support@neuverk.com</a>.
      </p>
    `,
  })
}

export function getReminderEmail(name: string | null): string {
  const greeting = name ? `Hallo ${esc(name)}` : 'Hallo'
  const greetingEN = name ? `Hi ${esc(name)}` : 'Hi there'
  const newDocUrl = `${APP_URL}/dashboard/documents/new`

  return layout({
    bodyDE: `
      <p>${greeting},</p>
      <p>
        Sie haben kürzlich Zugang zu VaultDoc erhalten — haben Sie bereits Ihr
        erstes Dokument erstellt?
      </p>
      <p>
        VaultDoc erstellt in wenigen Minuten prüffähige Compliance-Dokumente für
        ISO 27001, TISAX, SOC 2, DSGVO und weitere Standards. Probieren Sie es jetzt aus:
      </p>
    `,
    cta: { text: 'Erstes Dokument erstellen →', url: newDocUrl },
    bodyEN: `
      <p>${greetingEN},</p>
      <p>
        you recently got access to VaultDoc — have you created your first document yet?
      </p>
      <p>
        VaultDoc generates audit-ready compliance documents for ISO 27001, TISAX, SOC 2,
        GDPR, and more in minutes.
      </p>
      <p>
        <a href="${newDocUrl}" style="color:#374151">Create your first document →</a>
      </p>
      <p>
        Questions? Write to
        <a href="mailto:support@neuverk.com" style="color:#374151">support@neuverk.com</a>.
      </p>
    `,
  })
}

export function getDocumentCreatedEmail(
  name: string | null,
  docId: string,
): string {
  const greeting = name ? `Hallo ${esc(name)}` : 'Hallo'
  const greetingEN = name ? `Hi ${esc(name)}` : 'Hi there'
  const libraryUrl = `${APP_URL}/dashboard/library`
  const docUrl = `${APP_URL}/dashboard/documents/${docId}`

  return layout({
    bodyDE: `
      <p>${greeting},</p>
      <p>
        Ihr Dokument wurde erfolgreich erstellt und steht Ihnen in der Bibliothek zur Verfügung.
        Sie können es jetzt überprüfen, bearbeiten und zur Genehmigung einreichen.
      </p>
    `,
    cta: { text: 'In der Bibliothek ansehen →', url: libraryUrl },
    bodyEN: `
      <p>${greetingEN},</p>
      <p>
        your document has been created successfully and is now available in your library.
        You can review it, make edits, and submit it for approval.
      </p>
      <p>
        <a href="${docUrl}" style="color:#374151">View document →</a>
        &nbsp;&middot;&nbsp;
        <a href="${libraryUrl}" style="color:#374151">Go to library →</a>
      </p>
      <p>
        Questions? Write to
        <a href="mailto:support@neuverk.com" style="color:#374151">support@neuverk.com</a>.
      </p>
    `,
  })
}
