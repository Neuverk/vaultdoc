import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { extractTextFromFile } from '@/lib/extract-reference-text'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 30

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_TEXT_LENGTH = 15_000
const ALLOWED_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rl = await checkRateLimit(`reference:upload:${userId}`, 20, 60 * 60 * 1000)
  if (!rl.success) {
    return new Response(
      JSON.stringify({ error: 'Too many uploads. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    )
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

  let text: string
  try {
    text = await extractTextFromFile(file)
  } catch (error) {
    console.error('Reference upload extraction error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to extract text from file.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Trim whitespace before capping so the character budget is spent on content.
  const safeText = text.trim().slice(0, MAX_TEXT_LENGTH)

  if (!safeText) {
    return new Response(
      JSON.stringify({ error: 'No readable text found in the uploaded file.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ text: safeText }),
    { headers: { 'Content-Type': 'application/json' } },
  )
}
