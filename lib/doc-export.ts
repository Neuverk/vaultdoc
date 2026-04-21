import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx'
import { saveAs } from 'file-saver'

export interface DocExportMeta {
  title: string
  type: string
  department: string
  frameworks: string[]
  confidentiality: string
  language: string
}

export function buildHtmlContent(content: string): string {
  const lines = content.split('\n')
  let inTable = false
  let html = ''

  for (const line of lines) {
    if (!line.trim()) {
      if (inTable) {
        html += '</table>'
        inTable = false
      }
      html += '<br>'
    } else if (line.startsWith('# ')) {
      html += `<h1>${line.replace('# ', '')}</h1>`
    } else if (line.startsWith('## ')) {
      html += `<h2>${line.replace('## ', '')}</h2>`
    } else if (line.startsWith('### ')) {
      html += `<h3>${line.replace('### ', '')}</h3>`
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      html += `<li>${line.replace(/^[-*] /, '')}</li>`
    } else if (line.startsWith('|')) {
      if (line.includes('---')) continue
      if (!inTable) {
        html += '<table style="width:100%;border-collapse:collapse;margin:16px 0">'
        inTable = true
      }
      const cells = line
        .split('|')
        .filter((_, i, a) => i > 0 && i < a.length - 1)
      const isHeader = cells.some((c) => c.includes('**'))
      html += `<tr>${cells
        .map((cell) => {
          const tag = isHeader ? 'th' : 'td'
          const style = isHeader
            ? 'background:#0f172a;color:white;font-weight:600;padding:8px 12px;text-align:left;font-size:12px'
            : 'border:1px solid #e5e7eb;padding:8px 12px;font-size:12px'
          return `<${tag} style="${style}">${cell
            .replace(/\*\*/g, '')
            .trim()}</${tag}>`
        })
        .join('')}</tr>`
    } else {
      if (inTable) {
        html += '</table>'
        inTable = false
      }
      html += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
    }
  }

  if (inTable) html += '</table>'
  return html
}

export async function downloadWord(
  content: string,
  meta: DocExportMeta,
): Promise<void> {
  const lines = content.split('\n')
  const children: Paragraph[] = []

  children.push(
    new Paragraph({
      text: meta.title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${meta.type} · ${meta.department} · ${meta.frameworks.join(', ')}`,
          size: 20,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  )

  lines.forEach((line) => {
    if (!line.trim()) {
      children.push(new Paragraph({ text: '' }))
    } else if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
        }),
      )
    } else if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
        }),
      )
    } else if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
        }),
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^[-*] /, ''),
          bullet: { level: 0 },
        }),
      )
    } else if (line.startsWith('|') && !line.includes('---')) {
      const cells = line
        .split('|')
        .filter((_, i, a) => i > 0 && i < a.length - 1)
      children.push(
        new Paragraph({
          children: cells.map(
            (cell) =>
              new TextRun({
                text: cell.replace(/\*\*/g, '').trim() + '  ',
                bold: cell.includes('**'),
              }),
          ),
        }),
      )
    } else {
      const parts = line.split(/(\*\*.*?\*\*)/)
      children.push(
        new Paragraph({
          children: parts.map((part) =>
            part.startsWith('**') && part.endsWith('**')
              ? new TextRun({
                  text: part.replace(/\*\*/g, ''),
                  bold: true,
                })
              : new TextRun({ text: part }),
          ),
        }),
      )
    }
  })

  const doc = new Document({ sections: [{ properties: {}, children }] })
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${meta.title.replace(/\s+/g, '_')}.docx`)
}

export function downloadPDF(
  content: string,
  meta: DocExportMeta,
  watermark = false,
): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const htmlContent = buildHtmlContent(content)

  const watermarkHtml = watermark
    ? `<div style="
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        pointer-events:none;
        z-index:9999;
      ">
        <span style="
          display:block;
          transform:rotate(-45deg);
          font-size:88px;
          font-weight:900;
          letter-spacing:0.08em;
          color:#c8c8c8;
          white-space:nowrap;
          font-family:Arial,sans-serif;
          -webkit-print-color-adjust:exact;
          print-color-adjust:exact;
        ">FREE PLAN — VAULTDOC</span>
      </div>`
    : ''

  const html = `<!DOCTYPE html><html><head><title>${meta.title}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 40px;color:#1a1a1a;line-height:1.6}
    h1{font-size:26px;color:#0f172a;border-bottom:3px solid #475569;padding-bottom:10px;margin-top:32px}
    h2{font-size:18px;color:#0f172a;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px}
    h3{font-size:15px;color:#374151;margin-top:20px}
    p{font-size:13px;line-height:1.8;color:#374151;margin-bottom:8px}
    li{font-size:13px;line-height:1.8;color:#374151}
    table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
    th{background:#0f172a;color:white;padding:8px 12px;text-align:left}
    td{border:1px solid #e5e7eb;padding:8px 12px}
    tr:nth-child(even) td{background:#f9fafb}
    .cover{text-align:center;margin-bottom:48px;padding:40px;background:#0f172a;border-radius:12px;color:white}
    .cover h1{color:white;border:none;font-size:28px;margin:0 0 12px}
    .cover .meta{font-size:13px;opacity:0.8;margin-top:6px}
    .conf-badge{display:inline-block;padding:4px 16px;border-radius:100px;font-size:11px;font-weight:bold;background:rgba(255,255,255,0.2);color:white;margin-top:12px;border:1px solid rgba(255,255,255,0.3)}
    .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}
    @media print{body{margin:0}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  ${watermarkHtml}
  <div class="cover">
    <h1>${meta.title}</h1>
    <div class="meta">${meta.type} · ${meta.department}</div>
    <div class="meta">Frameworks: ${meta.frameworks.join(', ')}</div>
    <div class="meta">Language: ${meta.language} · Version: 1.0 · Generated by Vaultdoc</div>
    <div class="conf-badge">${meta.confidentiality.toUpperCase()}</div>
  </div>
  ${htmlContent}
  <div class="footer">Generated by Vaultdoc by Neuverk · ${new Date().toLocaleDateString()} · ${meta.confidentiality}</div>
  </body></html>`

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => printWindow.print(), 500)
}