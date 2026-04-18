import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const REVISE_LIMIT = 10
const REVISE_WINDOW_MS = 60 * 60 * 1000
const MAX_FIELD_LENGTH = 2000

function sanitizeField(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/ignore\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/disregard\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/forget\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/system\s+prompt/gi, ' ')
    .replace(/jailbreak/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_FIELD_LENGTH)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rateLimit = await checkRateLimit(
    `documents:revise:${userId}`,
    REVISE_LIMIT,
    REVISE_WINDOW_MS,
  )

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. You can revise up to ${REVISE_LIMIT} documents per hour. Please try again later.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        },
      },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const documentId = typeof body.documentId === 'string' ? body.documentId.trim() : ''
  const requestedChanges = sanitizeField(body.requestedChanges)
  const newTitle = sanitizeField(body.newTitle)
  const newLanguage = sanitizeField(body.newLanguage)

  if (!documentId) {
    return new Response(
      JSON.stringify({ error: 'documentId is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!requestedChanges) {
    return new Response(
      JSON.stringify({ error: 'requestedChanges is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  })

  if (!dbUser || !dbUser.tenantId) {
    return new Response(
      JSON.stringify({ error: 'User not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const sourceDoc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  })

  if (!sourceDoc) {
    return new Response(
      JSON.stringify({ error: 'Document not found.' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (sourceDoc.tenantId !== dbUser.tenantId) {
    return new Response(
      JSON.stringify({ error: 'Forbidden.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!sourceDoc.content) {
    return new Response(
      JSON.stringify({ error: 'Source document has no content to revise.' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const language = newLanguage || sourceDoc.language || 'English'
  const frameworkList = (sourceDoc.frameworks ?? []).join(', ') || 'General'

  const systemPrompt = `You are a compliance document editor. Apply only the requested changes to the document. Copy all unaffected sections exactly as they appear in the original — do not rephrase, improve, or expand them. Output only the complete revised document in ${language}, with no commentary.`

  const userPrompt = `Revise the following compliance document by applying ONLY the changes listed. Copy every unaffected section verbatim.

METADATA: ${sourceDoc.title} | ${sourceDoc.type} | ${sourceDoc.department} | ${frameworkList} | ${sourceDoc.confidentiality}

ORIGINAL CONTENT:
${sourceDoc.content}

REQUESTED CHANGES:
${requestedChanges}

Output the complete revised document now.`

  let revisedContent: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    revisedContent = message.content[0]?.type === 'text' ? message.content[0].text : ''

    if (!revisedContent) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate revised content.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  } catch (error) {
    console.error('Anthropic revise error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to generate revised document.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const resolvedTitle = newTitle || `${sourceDoc.title} (Revised)`

  return new Response(
    JSON.stringify({
      success: true,
      content: revisedContent,
      title: resolvedTitle,
      language,
      sourceDocumentId: sourceDoc.id,
      type: sourceDoc.type,
      department: sourceDoc.department,
      frameworks: sourceDoc.frameworks ?? [],
      confidentiality: sourceDoc.confidentiality,
      scope: sourceDoc.scope,
      purpose: sourceDoc.purpose,
      owner: sourceDoc.owner,
      reviewer: sourceDoc.reviewer,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    },
  )
}
