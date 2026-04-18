'use client'

import { useState } from 'react'
import { downloadWord, downloadPDF, type DocExportMeta } from '@/lib/doc-export'

export function ExportActions({ meta, content }: { meta: DocExportMeta; content: string }) {
  const [wordLoading, setWordLoading] = useState(false)

  async function handleWord() {
    setWordLoading(true)
    try {
      await downloadWord(content, meta)
    } finally {
      setWordLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleWord}
        disabled={wordLoading}
        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        {wordLoading ? 'Exporting…' : 'Word'}
      </button>
      <button
        onClick={() => downloadPDF(content, meta)}
        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        PDF
      </button>
    </>
  )
}
