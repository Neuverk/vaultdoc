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
      if (inTable) { html += '</table>'; inTable = false }
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
      if (!inTable) { html += '<table style="width:100%;border-collapse:collapse;margin:16px 0">'; inTable = true }
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
      const isHeader = cells.some(c => c.includes('**'))
      html += `<tr>${cells.map(cell => {
        const tag = isHeader ? 'th' : 'td'
        const style = isHeader ? 'background:#0a1628;color:white;font-weight:600;padding:8px 12px;text-align:left;font-size:12px' : 'border:1px solid #e5e7eb;padding:8px 12px;font-size:12px'
        return `<${tag} style="${style}">${cell.replace(/\*\*/g, '').trim()}</${tag}>`
      }).join('')}</tr>`
    } else {
      if (inTable) { html += '</table>'; inTable = false }
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
${form.tools ? `Tools/Systems: ${form.tools}` : ''}`
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ I have everything I need. Generating your document now...'
        }])
        setIsThinking(false)
        await generateDocument(data.meta, newMessages)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
        setIsThinking(false)
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
      setIsThinking(false)
    }
  }

  const generateDocument = async (meta: any, conversationMessages: Message[]) => {
    setPhase('generating')
    try {
      const res = await fetch('/api/documents/generate-from-chat', {
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Document generation failed. Please try again.'
      }])
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
      new Paragraph({ text: form.title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      new Paragraph({
        children: [new TextRun({ text: `${form.type} · ${form.department} · ${form.frameworks.join(', ')}`, size: 20, color: '666666' })],
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
        children.push(new Paragraph({
          children: cells.map(cell => new TextRun({ text: cell.replace(/\*\*/g, '').trim() + '  ', bold: cell.includes('**') }))
        }))
      } else {
        const parts = line.split(/(\*\*.*?\*\*)/)
        children.push(new Paragraph({
          children: parts.map(part =>
            part.startsWith('**') && part.endsWith('**')
              ? new TextRun({ text: part.replace(/\*\*/g, ''), bold: true })
              : new TextRun({ text: part })
          ),
        }))
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
      h1{font-size:26px;color:#0a1628;border-bottom:3px solid #0071e3;padding-bottom:10px;margin-top:32px}
      h2{font-size:18px;color:#0a1628;border-bottom:1px solid #e5e7eb;padding-bottom:6px;margin-top:28px}
      h3{font-size:15px;color:#374151;margin-top:20px}
      p{font-size:13px;line-height:1.8;color:#374151;margin-bottom:8px}
      li{font-size:13px;line-height:1.8;color:#374151}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
      th{background:#0a1628;color:white;padding:8px 12px;text-align:left}
      td{border:1px solid #e5e7eb;padding:8px 12px}
      tr:nth-child(even) td{background:#f9fafb}
      .cover{text-align:center;margin-bottom:48px;padding:40px;background:#0a1628;border-radius:12px;color:white}
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <a href="/dashboard" className="text-gray-500 hover:text-gray-900 text-sm">Dashboard</a>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">New document</span>
        {phase === 'done' && (
          <div className="ml-auto flex items-center gap-2">
            <button onClick={saveDocument} disabled={saving} className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-medium px-4 py-1.5 rounded-lg">
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            <button onClick={downloadWord} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg">📄 Word</button>
            <button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg">📕 PDF</button>
            <button onClick={() => navigator.clipboard.writeText(content)} className="border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-1.5 rounded-lg">Copy</button>
          </div>
        )}
      </div>

      {/* PHASE 1 — FORM */}
      {phase === 'form' && (
        <div className="flex-1 flex items-start justify-center px-6 py-8">
          <div className="w-full max-w-2xl space-y-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Create document</h1>
              <p className="text-xs text-gray-500 mt-0.5">Fill in the details then click Generate — AI will ask any follow-up questions needed.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Document title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. SOP for Veeam Backup & Recovery"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                <select value={form.department} onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {['IT / Information Security', 'HR', 'Finance', 'Legal', 'Operations', 'Engineering', 'Management'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Frameworks</label>
              <div className="flex flex-wrap gap-1.5">
                {FRAMEWORKS.map(fw => (
                  <button key={fw} onClick={() => toggleFramework(fw)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${form.frameworks.includes(fw) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                    {fw}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tone</label>
                <select value={form.tone} onChange={e => setForm(prev => ({ ...prev, tone: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Technical (detailed)</option>
                  <option>Standard</option>
                  <option>Simple</option>
                  <option>Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                <select value={form.language} onChange={e => setForm(prev => ({ ...prev, language: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Classification</label>
                <select value={form.confidentiality} onChange={e => setForm(prev => ({ ...prev, confidentiality: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Public</option>
                  <option>Internal</option>
                  <option>Confidential</option>
                  <option>Restricted</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scope (optional)</label>
                <textarea value={form.scope} onChange={e => setForm(prev => ({ ...prev, scope: e.target.value }))} placeholder="Who and what does this apply to?" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tools / systems</label>
                <textarea value={form.tools} onChange={e => setForm(prev => ({ ...prev, tools: e.target.value }))} placeholder="e.g. Veeam, Windows Server" rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <button onClick={startChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-all">
              ✨ Generate with AI
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2 — CHAT */}
      {(phase === 'chat' || phase === 'generating') && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <span className="text-white text-xs font-bold">V</span>
                  </div>
                )}
                <div className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <span className="text-white text-xs font-bold">V</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {phase === 'generating' && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5">
                  <span className="text-white text-xs font-bold">V</span>
                </div>
                <div className="bg-white border border-blue-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Writing your document... this takes 15–30 seconds
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {phase === 'chat' && (
            <div className="bg-white border border-gray-300 rounded-2xl p-3 flex items-end gap-3 shadow-sm">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer the question above..."
                rows={2}
                className="flex-1 resize-none text-sm text-gray-900 focus:outline-none placeholder-gray-400"
                disabled={isThinking}
                autoFocus
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isThinking}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl p-2.5 transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-xs text-gray-400 text-center mt-2">Press Enter to send · Shift+Enter for new line</p>
        </div>
      )}

      {/* PHASE 3 — DONE */}
      {phase === 'done' && (
        <div className={`mx-auto px-6 py-6 w-full ${fullscreen ? 'max-w-full' : 'max-w-8xl'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">Document editor</h2>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Generated</span>
              <span className="text-xs text-gray-400">— edit directly below</span>
            </div>
            <button onClick={() => setFullscreen(!fullscreen)} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded">
              {fullscreen ? '⊠ Normal' : '⊞ Wide'}
            </button>
          </div>
          <div data-color-mode="light" style={{ height: 'calc(100vh - 120px)' }}>
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              height="100%"
              preview="live"
              hideToolbar={false}
              visibleDragbar={false}
              style={{ borderRadius: '12px', overflow: 'hidden' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}