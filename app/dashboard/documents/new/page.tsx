'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { downloadWord, downloadPDF, type DocExportMeta } from '@/lib/doc-export'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

const FRAMEWORKS = [
  'ISO 27001:2022',
  'TISAX',
  'ITIL v4',
  'SOC 2',
  'GDPR',
  'HIPAA',
  'PCI-DSS v4',
  'NIST CSF 2.0',
  'ISO 9001',
  'ISO 22301',
  'NIS2',
  'DORA',
]

const DOC_TYPES = [
  'SOP',
  'Policy',
  'Runbook',
  'IR Plan',
  'Risk Assessment',
  'Work Instruction',
  'BCP',
  'Data Classification',
  'DPIA',
  'Audit Checklist',
]

const AI_DISCLOSURE_KEY = 'vaultdoc_anthropic_notice_dismissed'

type Message = { role: 'user' | 'assistant'; content: string }
type Phase = 'form' | 'chat' | 'generating' | 'done'
type RefPhase = 'input' | 'analyzing' | 'analyzed' | 'generating' | 'done'
type Tab = 'scratch' | 'reference'
type RefAction = 'create-draft' | 'find-gaps' | 'improve-structure'

type AnalysisResult = {
  detectedType: string
  summary: string
  suggestedFrameworks: string[]
  likelyDepartment: string
  identifiedGaps: string[]
  recommendedNextAction: string
}

type DocMeta = {
  title: string
  type: string
  department: string
  frameworks: string[]
  confidentiality: string
  language: string
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function NewDocumentPage() {
  const router = useRouter()

  // ── Scratch flow state ──────────────────────────────────────────────────────
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
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showAiDisclosure, setShowAiDisclosure] = useState(false)
  const [pdfWatermark, setPdfWatermark] = useState(false)
  const [isAtLimit, setIsAtLimit] = useState(false)
  const [showQuotaModal, setShowQuotaModal] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Tab + reference flow state ──────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('scratch')
  const [refPhase, setRefPhase] = useState<RefPhase>('input')
  const [refText, setRefText] = useState('')
  const [refTitle, setRefTitle] = useState('')
  const [refPreferredType, setRefPreferredType] = useState('')
  const [refAnalysis, setRefAnalysis] = useState<AnalysisResult | null>(null)
  const [refContent, setRefContent] = useState('')
  const [refSaving, setRefSaving] = useState(false)
  const [refSaveForm, setRefSaveForm] = useState<DocMeta>({
    title: '',
    type: 'SOP',
    department: 'IT / Information Security',
    frameworks: [],
    confidentiality: 'Internal',
    language: 'English',
  })
  const [refUploading, setRefUploading] = useState(false)
  const [refUploadError, setRefUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(AI_DISCLOSURE_KEY)
      setShowAiDisclosure(dismissed !== 'true')
    } catch {
      setShowAiDisclosure(true)
    }
  }, [])

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await fetch('/api/account/plan', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setPdfWatermark(data?.plan === 'free')
        setIsAtLimit(data?.isAtLimit === true)
      } catch {
        setPdfWatermark(false)
      }
    }

    loadPlan()
  }, [])

  // ── Scratch flow ────────────────────────────────────────────────────────────

  const dismissAiDisclosure = () => {
    try {
      localStorage.setItem(AI_DISCLOSURE_KEY, 'true')
    } catch {
      // ignore
    }
    setShowAiDisclosure(false)
  }

  const toggleFramework = (fw: string) => {
    setForm((prev) => ({
      ...prev,
      frameworks: prev.frameworks.includes(fw)
        ? prev.frameworks.filter((f) => f !== fw)
        : [...prev.frameworks, fw],
    }))
  }

  const startChat = async () => {
    if (!form.title) return alert('Please enter a document title')
    if (form.frameworks.length === 0) {
      return alert('Select at least one framework')
    }

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
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ])
        setIsThinking(false)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
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
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '✅ I have everything I need. Generating your document now...',
          },
        ])
        setIsThinking(false)
        await generateDocument(data.meta, newMessages)
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply },
        ])
        setIsThinking(false)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
        },
      ])
      setIsThinking(false)
    }
  }

  const generateDocument = async (
    meta: Record<string, unknown>,
    conversationMessages: Message[],
  ) => {
    setPhase('generating')
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meta: { ...form, ...meta },
          messages: conversationMessages,
        }),
      })
      const data = await res.json()
      if (data.content) {
        setContent(data.content)
        setForm((prev) => ({ ...prev, ...(meta as Partial<typeof form>) }))
        setPhase('done')
      }
    } catch {
      setPhase('chat')
      setMessages((prev) => [
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

  const downloadWordFile = () =>
    downloadWord(content, form as DocExportMeta)

  const downloadPDFFile = () =>
    downloadPDF(content, form as DocExportMeta, pdfWatermark)

  const saveDocument = async () => {
    if (!content) return
    setSaving(true)
    try {
      const res = await fetch('/api/documents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, content }),
      })
      console.log('[saveDocument] status:', res.status)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        console.log('[saveDocument] error response:', json)
        if (json?.code === 'PLAN_LIMIT_REACHED') {
          setIsAtLimit(true)
          setShowQuotaModal(true)
          return
        }
        throw new Error('Save failed')
      }
      setShowSaveModal(true)
    } catch (err) {
      console.error('[saveDocument] caught error:', err)
      alert('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Reference flow ──────────────────────────────────────────────────────────

  const uploadFile = async (file: File) => {
    setRefUploading(true)
    setRefUploadError(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/documents/reference-upload', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        setRefUploadError(data?.error ?? 'Upload failed. Please try again.')
        return
      }
      setRefText(data.text)
    } catch {
      setRefUploadError('Something went wrong. Please try again.')
    } finally {
      setRefUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const analyzeReference = async () => {
    if (!refText.trim()) return

    setRefPhase('analyzing')

    try {
      const res = await fetch('/api/documents/reference-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceText: refText,
          title: refTitle || undefined,
          preferredType: refPreferredType || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data?.error ?? 'Analysis failed. Please try again.')
        setRefPhase('input')
        return
      }

      setRefAnalysis(data.analysis)
      setRefPhase('analyzed')
    } catch {
      alert('Something went wrong. Please try again.')
      setRefPhase('input')
    }
  }

  const generateFromReference = async (action: RefAction) => {
    if (!refAnalysis) return

    const meta: DocMeta = {
      title: refTitle || `${refAnalysis.detectedType} from Reference`,
      type: refAnalysis.detectedType || 'SOP',
      department: refAnalysis.likelyDepartment || 'IT / Information Security',
      frameworks: refAnalysis.suggestedFrameworks ?? [],
      confidentiality: 'Internal',
      language: 'English',
    }

    setRefSaveForm(meta)
    setRefPhase('generating')

    try {
      const res = await fetch('/api/documents/reference-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceText: refText,
          selectedAction: action,
          title: meta.title,
          type: meta.type,
          framework: meta.frameworks[0] ?? '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data?.error ?? 'Generation failed. Please try again.')
        setRefPhase('analyzed')
        return
      }

      setRefContent(data.content)
      setRefPhase('done')
    } catch {
      alert('Something went wrong. Please try again.')
      setRefPhase('analyzed')
    }
  }

  const saveReferenceDocument = async () => {
    if (!refContent) return
    setRefSaving(true)
    try {
      const res = await fetch('/api/documents/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...refSaveForm, content: refContent }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        if (json?.code === 'PLAN_LIMIT_REACHED') {
          setIsAtLimit(true)
          setShowQuotaModal(true)
          return
        }
        throw new Error('Save failed')
      }
      setShowSaveModal(true)
    } catch {
      alert('Save failed. Please try again.')
    } finally {
      setRefSaving(false)
    }
  }

  // ── Derived ─────────────────────────────────────────────────────────────────

  const scratchDone = tab === 'scratch' && phase === 'done'
  const refDone = tab === 'reference' && refPhase === 'done'
  const showTabBar =
    (tab === 'scratch' && phase === 'form') ||
    (tab === 'reference' && refPhase === 'input')

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <a
            href="/dashboard"
            className="text-sm text-gray-500 transition hover:text-gray-900"
          >
            Dashboard
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">New document</span>

          {(scratchDone || refDone) && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={scratchDone ? saveDocument : saveReferenceDocument}
                disabled={scratchDone ? saving : refSaving}
                className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-400"
              >
                {(scratchDone ? saving : refSaving) ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() =>
                  scratchDone
                    ? downloadWordFile()
                    : downloadWord(refContent, refSaveForm as DocExportMeta)
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Word
              </button>
              <button
                onClick={() =>
                  scratchDone
                    ? downloadPDFFile()
                    : downloadPDF(refContent, refSaveForm as DocExportMeta, pdfWatermark)
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                PDF
              </button>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(scratchDone ? content : refContent)
                }
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {showTabBar && (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl gap-1 px-6">
            {(['scratch', 'reference'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative px-5 py-3.5 text-sm font-medium transition ${
                  tab === t
                    ? 'text-gray-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'scratch' ? 'Start from scratch' : 'Create from reference'}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'scratch' && phase === 'form' && (
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
                Fill in the key details first. VaultDoc will ask follow-up questions
                only where needed, then generate a structured document for review.
              </p>
            </div>
          </div>

          {isAtLimit && (
            <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    Free plan limit reached
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    You&apos;ve used all 3 lifetime document saves on the Free plan. Deleting documents does not restore your quota. Upgrade to keep creating.
                  </p>
                </div>
                <a
                  href="/dashboard/billing"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Upgrade plan →
                </a>
              </div>
            </div>
          )}

          {showAiDisclosure && (
            <div className="mb-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-3xl">
                  <p className="text-sm font-semibold text-amber-950">
                    AI processing notice
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    Your inputs are processed by Anthropic&apos;s AI to generate
                    documents. Avoid including passwords, personal data, or
                    classified information.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissAiDisclosure}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="grid gap-8">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Document title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    {DOC_TYPES.map((t) => (
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, department: e.target.value }))
                    }
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
                    ].map((d) => (
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
                  {FRAMEWORKS.map((fw) => (
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tone: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, language: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        confidentiality: e.target.value,
                      }))
                    }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, scope: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tools: e.target.value }))
                    }
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
                  disabled={isAtLimit}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Generate with AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'scratch' && (phase === 'chat' || phase === 'generating') && (
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-8">
          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              AI document follow-up
            </h1>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Answer the follow-up questions below. The more precise your answers,
              the better the final document.
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
                      ? 'rounded-tr-md border border-emerald-200 bg-emerald-50 text-emerald-900'
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
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
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
                  onChange={(e) => setInput(e.target.value)}
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
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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

      {tab === 'scratch' && phase === 'done' && (
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
              onChange={(val) => setContent(val || '')}
              height="100%"
              preview="live"
              hideToolbar={false}
              visibleDragbar={false}
              style={{ borderRadius: '18px', overflow: 'hidden' }}
            />
          </div>
        </div>
      )}

      {tab === 'reference' && refPhase === 'input' && (
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <div className="mb-8 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Reference analysis
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                Create from reference
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Paste an existing document, draft, or raw notes. VaultDoc will
                analyse it first, then let you choose what to do with it.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="grid gap-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Reference text <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={refUploading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {refUploading ? (
                      <>
                        <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        Uploading…
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        Upload file
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file)
                    }}
                  />
                </div>
                <textarea
                  value={refText}
                  onChange={(e) => setRefText(e.target.value)}
                  rows={14}
                  placeholder="Paste your reference document, draft, or notes here…"
                  className="w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 font-mono text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-xs text-gray-400">
                    {refText.length.toLocaleString()} characters
                  </p>
                  {refUploadError && (
                    <p className="text-xs text-red-600">{refUploadError}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Desired title <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={refTitle}
                    onChange={(e) => setRefTitle(e.target.value)}
                    placeholder="Leave blank to auto-detect"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred document type <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <select
                    value={refPreferredType}
                    onChange={(e) => setRefPreferredType(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-400"
                  >
                    <option value="">Auto-detect</option>
                    {DOC_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isAtLimit && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-950">Free plan limit reached</p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    You&apos;ve used all 3 lifetime saves. Deleting documents does not restore quota.{' '}
                    <a href="/dashboard/billing" className="font-semibold underline underline-offset-2">
                      Upgrade to continue →
                    </a>
                  </p>
                </div>
              )}

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  onClick={analyzeReference}
                  disabled={!refText.trim() || isAtLimit}
                  className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                >
                  Analyze reference
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'reference' && refPhase === 'analyzing' && (
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              Analysing your reference document…
            </p>
            <p className="text-xs text-gray-400">This usually takes 5–10 seconds</p>
          </div>
        </div>
      )}

      {tab === 'reference' && refPhase === 'analyzed' && refAnalysis && (
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-12">
          <div className="mb-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Analysis complete
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Reference analysis
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Choose what you want to do with this reference material.
            </p>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {refAnalysis.summary}
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Detected type
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {refAnalysis.detectedType}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Likely department
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {refAnalysis.likelyDepartment}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Suggested frameworks
              </p>
              <div className="flex flex-wrap gap-2">
                {refAnalysis.suggestedFrameworks.length > 0 ? (
                  refAnalysis.suggestedFrameworks.map((fw) => (
                    <span
                      key={fw}
                      className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                      {fw}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">None detected</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
                Identified gaps
              </p>
              {refAnalysis.identifiedGaps.length > 0 ? (
                <ul className="space-y-1.5">
                  {refAnalysis.identifiedGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      {gap}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No major gaps identified</p>
              )}
            </div>
          </div>

          {refAnalysis.recommendedNextAction && (
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Recommended next action
              </p>
              <p className="mt-1 text-sm text-gray-700">
                {refAnalysis.recommendedNextAction}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="mb-4 text-sm font-medium text-gray-900">
              What would you like to do?
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                {
                  action: 'create-draft' as RefAction,
                  label: 'Create draft',
                  desc: 'Transform reference into a structured compliance document',
                },
                {
                  action: 'find-gaps' as RefAction,
                  label: 'Find gaps',
                  desc: 'Generate a gap analysis report against compliance standards',
                },
                {
                  action: 'improve-structure' as RefAction,
                  label: 'Improve structure',
                  desc: 'Reformat into a professional compliance document structure',
                },
              ] as const).map(({ action, label, desc }) => (
                <button
                  key={action}
                  onClick={() => generateFromReference(action)}
                  className="flex flex-col items-start rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:border-gray-400 hover:shadow-sm"
                >
                  <span className="text-sm font-semibold text-gray-900">
                    {label}
                  </span>
                  <span className="mt-1 text-xs leading-5 text-gray-500">
                    {desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
              <button
                onClick={() => {
                  setRefPhase('input')
                  setRefAnalysis(null)
                }}
                className="text-xs text-gray-400 transition hover:text-gray-600"
              >
                ← Back to input
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'reference' && refPhase === 'generating' && (
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              Generating your document…
            </p>
            <p className="text-xs text-gray-400">This usually takes 15–30 seconds</p>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="px-6 py-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 id="save-modal-title" className="text-base font-semibold text-gray-900">
                Document saved
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-gray-600">
                Your document has been successfully saved to your library.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowSaveModal(false)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Continue editing
              </button>
              <button
                onClick={() => router.push('/dashboard/library')}
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                View in library
              </button>
            </div>
          </div>
        </div>
      )}

      {showQuotaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quota-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowQuotaModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="px-6 py-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
                <svg
                  className="h-5 w-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 id="quota-modal-title" className="text-base font-semibold text-gray-900">
                Free plan limit reached
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                You&apos;ve used all 3 lifetime document saves included in the Free plan.
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Deleting documents does not restore your quota. Upgrade to Starter or Enterprise to save unlimited documents.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setShowQuotaModal(false)}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Close
              </button>
              <a
                href="/dashboard/billing"
                className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              >
                Upgrade plan →
              </a>
            </div>
          </div>
        </div>
      )}

      {tab === 'reference' && refPhase === 'done' && (
        <div className="mx-auto w-full max-w-7xl px-6 py-8">
          <div className="mb-5 flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Generated successfully
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {refSaveForm.title}
              </h2>
              <p className="mt-1 text-sm text-gray-600">Review and edit before saving.</p>
            </div>
            <button
              onClick={() => setRefPhase('analyzed')}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to analysis
            </button>
          </div>

          <div data-color-mode="light" style={{ height: 'calc(100vh - 220px)' }}>
            <MDEditor
              value={refContent}
              onChange={(val) => setRefContent(val || '')}
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