import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { documents, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'
import { createAuditLog } from '@/lib/audit'
import { canCreateDocument } from '@/lib/plan-limits'

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

  // Strict tenant ownership — no default-tenant fallback for writes
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

  const { allowed, reason, currentCount, limit } = await canCreateDocument(dbUser.tenantId)
  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: reason,
        code: 'PLAN_LIMIT_REACHED',
        currentCount,
        limit,
      }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const language = newLanguage || sourceDoc.language || 'English'
  const frameworkList = (sourceDoc.frameworks ?? []).join(', ') || 'General'

  const systemPrompt = `You are a senior compliance officer and technical writer. You revise existing compliance documents with precision and professionalism. Preserve the document structure, markdown formatting, and compliance framework references unless the requested changes explicitly affect them. Write in ${language}.`

  const userPrompt = `You are revising an existing compliance document. Apply ONLY the requested changes. Do not rewrite sections that are unaffected. Preserve all existing structure, section headers, tables, and compliance references unless a change explicitly requires otherwise.

--- ORIGINAL DOCUMENT METADATA ---
Title: ${sourceDoc.title}
Type: ${sourceDoc.type}
Department: ${sourceDoc.department}
Frameworks: ${frameworkList}
Confidentiality: ${sourceDoc.confidentiality}
Language: ${sourceDoc.language || 'English'}

--- ORIGINAL DOCUMENT CONTENT ---
${sourceDoc.content}

--- REQUESTED CHANGES ---
${requestedChanges}

--- INSTRUCTIONS ---
Produce the complete revised document below. Apply the requested changes carefully. Do not add commentary or explanations outside the document itself.`

  let revisedContent: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
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

  let newDoc: typeof sourceDoc
  try {
    const [inserted] = await db
      .insert(documents)
      .values({
        tenantId: sourceDoc.tenantId,
        createdBy: dbUser.id,
        title: resolvedTitle,
        type: sourceDoc.type,
        department: sourceDoc.department,
        frameworks: sourceDoc.frameworks,
        confidentiality: sourceDoc.confidentiality,
        scope: sourceDoc.scope,
        purpose: sourceDoc.purpose,
        owner: sourceDoc.owner,
        reviewer: sourceDoc.reviewer,
        language,
        content: revisedContent,
        status: 'draft',
        version: '1.0',
      })
      .returning()

    newDoc = inserted
  } catch (error) {
    console.error('Revise route: failed to save new document:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to save revised document.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  await createAuditLog({
    tenantId: sourceDoc.tenantId,
    userId: dbUser.id,
    action: 'document_revised',
    resourceType: 'document',
    resourceId: newDoc.id,
    metadata: {
      sourceDocumentId: sourceDoc.id,
      sourceTitle: sourceDoc.title,
      newTitle: resolvedTitle,
      requestedChanges,
      language,
    },
  })

  return new Response(
    JSON.stringify({ success: true, id: newDoc.id }),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    },
  )
}
