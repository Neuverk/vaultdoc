'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'
import { saveAs } from 'file-saver'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const FRAMEWORKS = [
  'ISO 27001:2022', 'TISAX', 'ITIL v4', 'SOC 2',
  'GDPR', 'HIPAA', 'PCI-DSS v4', 'NIST CSF 2.0',
  'ISO 9001', 'ISO 22301', 'NIS2', 'DORA',
]

const DOC_TYPES = [
  'SOP', 'Policy', 'Runbook', 'IR Plan',
  'Risk Assessment', 'Work Instruction', 'BCP',
  'Data Classification', 'DPIA', 'Audit Checklist',
]

type Message = { role: 'user' | 'assistant'; content: string }
type Phase = 'form' | 'chat' | 'generating' | 'done'

function buildHtmlContent(content: string) {
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
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
      const isHeader = cells.some(c => c.includes('**'))
      html += `<tr>${cells
        .map(cell => {
          const tag = isHeader ? 'th' : 'td'
          const style = isHeader
            ? 'background:#0f172a;color:white;font-weight:600;padding:8px 12px;text-align:left;font-size:12px'
            : 'border:1px solid #e5e7eb;padding:8px 12px;font-size:12px'
          return `<${tag} style="${style}">${cell.replace(/\*\*/g, '').trim()}</${tag}>`
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

export default function NewDocumentPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('form')
  const [form, setForm] = useState({
    title: '',
    type: 'SOP',
    department: 'IT / Information Security',
    frameworks: ['ISO 27001:2022'],
    scope: '',
    tools: '',
    tone: 'Technical (detailed)',
    language: 'English',
    confidentiality: 'Internal',
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  const toggleFramework = (fw: string) => {
    setForm(prev => ({
      ...prev,
      frameworks: prev.frameworks.includes(fw)
        ? prev.frameworks.filter(f => f !== fw)
        : [...prev.frameworks, fw],
    }))
  }

  const startChat = async () => {
    if (!form.title) return alert('Please enter a document title')
    if (form.frameworks.length === 0) return alert('Select at least one framework')

    const firstMessage: Message = {
      role: 'user',
      content: `I need to create: ${form.title}
Type: ${form.type}
Department: ${form.department}
Frameworks: ${form.frameworks.join(', ')}
Language: ${form.language}
Classification: ${form.confidentiality}
${form.scope ? `Scope: ${form.scope}` : ''}
${form.tools ? `Tools/Systems: ${form.tools}` : ''}`,
    }

    setMessages([firstMessage])
    setPhase('chat')
    setIsThinking(true)

    try {
      const res = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [firstMessage] }),
      })
      const data = await res.json()

      if (data.ready) {
        setIsThinking(false)
        await generateDocument(data.meta, [firstMessage])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        setIsThinking(false)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
      setIsThinking(false)
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isThinking) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsThinking(true)

    try {
      const res = await fetch('/api/documents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()

      if (data.ready) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '✅ I have everything I need. Generating your document now...',
          },
        ])
        setIsThinking(false)
        await generateDocument(data.meta, newMessages)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        setIsThinking(false)
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
      setIsThinking(false)
    }
  }

  const generateDocument = async (meta: any, conversationMessages: Message[]) => {
    setPhase('generating')
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta: { ...form, ...meta }, messages: conversationMessages }),
      })
      const data = await res.json()
      if (data.content) {
        setContent(data.content)
        setForm(prev => ({ ...prev, ...meta }))
        setPhase('done')
      }
    } catch {
      setPhase('chat')
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Document generation failed. Please try again.',
        },
      ])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const downloadWord = async () => {
    const lines = content.split('\n')
    const children: Paragraph[] = []
    children.push(
      new Paragraph({
        text: form.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `${form.type} · ${form.department} · ${form.frameworks.join(', ')}`,
            size: 20,
            color: '666666',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    )
    lines.forEach(line => {
      if (!line.trim()) {
        children.push(new Paragraph({ text: '' }))
      } else if (line.startsWith('# ')) {
        children.push(new Paragraph({ text: line.replace('# ', ''), heading: HeadingLevel.HEADING_1 }))
      } else if (line.startsWith('## ')) {
        children.push(new Paragraph({ text: line.replace('## ', ''), heading: HeadingLevel.HEADING_2 }))
      } else if (line.startsWith('### ')) {
        children.push(new Paragraph({ text: line.replace('### ', ''), heading: HeadingLevel.HEADING_3 }))
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        children.push(new Paragraph({ text: line.replace(/^[-*] /, ''), bullet: { level: 0 } }))
      } else if (line.startsWith('|') && !line.includes('---')) {
        const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
        children.push(
          new Paragraph({
            children: cells.map(
              cell =>
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
            children: parts.map(part =>
              part.startsWith('**') && part.endsWith('**')
                ? new TextRun({ text: part.replace(/\*\*/g, ''), bold: true })
                : new TextRun({ text: part }),
            ),
          }),
        )
      }
    })
    const doc = new Document({ sections: [{ properties: {}, children }] })
    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${form.title.replace(/\s+/g, '_')}.docx`)
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const htmlContent = buildHtmlContent(content)
    const html = `<!DOCTYPE html><html><head><title>${form.title}</title>
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
    <div class="cover">
      <h1>${form.title}</h1>
      <div class="meta">${form.type} · ${form.department}</div>
      <div class="meta">Frameworks: ${form.frameworks.join(', ')}</div>
      <div class="meta">Language: ${form.language} · Version: 1.0 · Generated by Vaultdoc</div>
      <div class="conf-badge">${form.confidentiality.toUpperCase()}</div>
    </div>
    ${htmlContent}
    <div class="footer">Generated by Vaultdoc by Neuverk · ${new Date().toLocaleDateString()} · ${form.confidentiality}</div>
    </body></html>`
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 500)
  }

  const saveDocument = async () => {
    if (!content) return
    setSaving(true)
    try {
      const res = await fetch('/api/documents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content }),
      })
      if (!res.ok) throw new Error('Save failed')
      alert('✅ Document saved to library!')
    } catch {
      alert('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <a href="/dashboard" className="text-sm text-gray-500 transition hover:text-gray-900">
            Dashboard
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">New document</span>

          {phase === 'done' && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={saveDocument}
                disabled={saving}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={downloadWord}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Word
              </button>
              <button
                onClick={downloadPDF}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                PDF
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(content)}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {phase === 'form' && (
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                AI document workflow
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Create new document
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Fill in the key details first. VaultDoc will ask follow-up questions only where needed, then generate a structured document for review.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Document title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. SOP for Veeam Backup & Recovery"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    {DOC_TYPES.map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    {[
                      'IT / Information Security',
                      'HR',
                      'Finance',
                      'Legal',
                      'Operations',
                      'Engineering',
                      'Management',
                    ].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Frameworks
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {FRAMEWORKS.map(fw => (
                    <button
                      key={fw}
                      onClick={() => toggleFramework(fw)}
                      className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                        form.frameworks.includes(fw)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tone
                  </label>
                  <select
                    value={form.tone}
                    onChange={e => setForm(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    <option>Technical (detailed)</option>
                    <option>Standard</option>
                    <option>Simple</option>
                    <option>Executive</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    value={form.language}
                    onChange={e => setForm(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    <option>English</option>
                    <option>German</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Classification
                  </label>
                  <select
                    value={form.confidentiality}
                    onChange={e => setForm(prev => ({ ...prev, confidentiality: e.target.value }))}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    <option>Public</option>
                    <option>Internal</option>
                    <option>Confidential</option>
                    <option>Restricted</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Scope (optional)
                  </label>
                  <textarea
                    value={form.scope}
                    onChange={e => setForm(prev => ({ ...prev, scope: e.target.value }))}
                    placeholder="Who and what does this apply to?"
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tools / systems
                  </label>
                  <textarea
                    value={form.tools}
                    onChange={e => setForm(prev => ({ ...prev, tools: e.target.value }))}
                    placeholder="e.g. Veeam, Windows Server"
                    rows={4}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-500">
                  VaultDoc will guide the next step through a short AI follow-up flow.
                </p>
                <button
                  onClick={startChat}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Generate with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(phase === 'chat' || phase === 'generating') && (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              AI document follow-up
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Answer the follow-up questions below. The more precise your answers, the better the final document structure and quality.
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="mr-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-900">
                    <span className="text-xs font-semibold text-white">V</span>
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl px-5 py-4 text-sm leading-7 whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'rounded-tr-md bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'rounded-tl-md border border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="mr-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-900">
                  <span className="text-xs font-semibold text-white">V</span>
                </div>
                <div className="rounded-2xl rounded-tl-md border border-gray-200 bg-gray-50 px-5 py-4">
                  <div className="flex gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {phase === 'generating' && (
              <div className="flex justify-start">
                <div className="mr-3 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-900">
                  <span className="text-xs font-semibold text-white">V</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
                  <div className="h-4 w-4 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                  Writing your document. This usually takes 15–30 seconds.
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {phase === 'chat' && (
            <div className="mt-5 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-end gap-4">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Answer the question above..."
                  rows={3}
                  className="flex-1 resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  disabled={isThinking}
                  autoFocus
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isThinking}
                  className="shrink-0 rounded-2xl bg-gray-900 p-3 text-white transition hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <p className="mt-3 text-center text-xs text-gray-400">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}

      {phase === 'done' && (
        <div className={`mx-auto w-full px-6 py-8 ${fullscreen ? 'max-w-full' : 'max-w-7xl'}`}>
          <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Generated successfully
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Document editor</h2>
              <p className="mt-1 text-sm text-gray-600">
                Review, edit, save, and export your generated document.
              </p>
            </div>

            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              {fullscreen ? 'Normal width' : 'Wide editor'}
            </button>
          </div>

          <div data-color-mode="light" style={{ height: 'calc(100vh - 220px)' }}>
            <MDEditor
              value={content}
              onChange={val => setContent(val || '')}
              height="100%"
              preview="live"
              hideToolbar={false}
              visibleDragbar={false}
              style={{ borderRadius: '18px', overflow: 'hidden' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}