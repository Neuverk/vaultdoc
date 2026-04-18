import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { extractTextFromFile } from '@/lib/extract-reference-text'

export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid form data.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return new Response(
      JSON.stringify({ error: 'No file provided.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(
      JSON.stringify({ error: 'Only .txt and .docx files are supported.' }),
      { status: 415, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: 'File must be under 10 MB.' }),
      { status: 413, headers: { 'Content-Type': 'application/json' } },
    )
  }

  try {
    const text = await extractTextFromFile(file)
    const safeText = text.slice(0, 15000).trim()

    if (!safeText) {
      return new Response(
        JSON.stringify({ error: 'No readable text found in the uploaded file.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, text: safeText }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Reference upload extraction error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to extract text from file.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}