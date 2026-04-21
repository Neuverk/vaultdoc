import Anthropic from '@anthropic-ai/sdk'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

import { bootstrapUser } from '@/lib/bootstrap-user'
import { canCreateDocument } from '@/lib/plan-limits'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MAX_FIELD_LENGTH = 2000
const MAX_ARRAY_ITEMS = 20
const MAX_MESSAGES = 12
const GENERATE_LIMIT = 10
const GENERATE_WINDOW_MS = 60 * 60 * 1000

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function jsonResponse(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders ?? {}),
    },
  })
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ')
}

function removePromptInjectionPatterns(input: string): string {
  return input
    .replace(/ignore\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/disregard\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/forget\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/system\s+prompt/gi, ' ')
    .replace(/developer\s+message/gi, ' ')
    .replace(/assistant\s+instructions?/gi, ' ')
    .replace(/reveal\s+(your|the)\s+(prompt|instructions?|system message)/gi, ' ')
    .replace(/act\s+as\s+/gi, ' ')
    .replace(/jailbreak/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim()
}

function sanitizeField(value: unknown): string {
  if (typeof value !== 'string') return ''

  const stripped = stripHtml(value)
  const cleaned = removePromptInjectionPatterns(stripped)
  const normalized = normalizeWhitespace(cleaned)

  return normalized.slice(0, MAX_FIELD_LENGTH)
}

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => sanitizeField(item))
    .filter(Boolean)
    .slice(0, MAX_ARRAY_ITEMS)
}

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): ChatMessage => {
      const role: 'user' | 'assistant' =
        item &&
        typeof item === 'object' &&
        'role' in item &&
        item.role === 'assistant'
          ? 'assistant'
          : 'user'

      const rawContent =
        item &&
        typeof item === 'object' &&
        'content' in item
          ? item.content
          : ''

      return {
        role,
        content: sanitizeField(rawContent),
      }
    })
    .filter((message) => message.content.length > 0)
    .slice(0, MAX_MESSAGES)
}

function isValidGeneratedDocument(content: string): boolean {
  if (!content || content.trim().length < 300) return false
  if (!content.includes('##')) return false
  if (!content.includes('## 1. Purpose') && !content.includes('## 1.')) return false
  return true
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const rateLimit = await checkRateLimit(
    `documents:generate:${userId}`,
    GENERATE_LIMIT,
    GENERATE_WINDOW_MS,
  )

  if (!rateLimit.success) {
    return jsonResponse(
      {
        error:
          'Rate limit exceeded. You can generate up to 10 documents per hour. Please try again later.',
      },
      429,
      {
        'Retry-After': String(
          Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        ),
      },
    )
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body.' }, 400)
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  const bootstrapped = await bootstrapUser({
    clerkUserId: userId,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
  })

  if (!bootstrapped) {
    return jsonResponse({ error: 'Unable to verify plan limits.' }, 403)
  }

  const quota = await canCreateDocument(bootstrapped.tenant.id)
  if (!quota.allowed) {
    return jsonResponse(
      {
        error:
          quota.limit != null
            ? `You’ve reached your current plan limit (${quota.limit} documents). Upgrade to continue.`
            : "You’ve reached your current plan limit. Upgrade to continue.",
        code: 'PLAN_LIMIT_REACHED',
        limit: quota.limit,
      },
      403,
    )
  }

  const rawMeta = body?.meta ?? body ?? {}
  const messages = sanitizeMessages(body?.messages)

  const title = sanitizeField(rawMeta.title)
  const type = sanitizeField(rawMeta.type)
  const department = sanitizeField(rawMeta.department)
  const frameworks = sanitizeStringArray(rawMeta.frameworks)
  const scope = sanitizeField(rawMeta.scope)
  const purpose = sanitizeField(rawMeta.purpose)
  const tools = sanitizeField(rawMeta.tools)
  const tone = sanitizeField(rawMeta.tone)
  const language = sanitizeField(rawMeta.language)
  const confidentiality = sanitizeField(rawMeta.confidentiality)

  if (!title) {
    return jsonResponse({ error: 'Document title is required.' }, 400)
  }

  if (!type) {
    return jsonResponse({ error: 'Document type is required.' }, 400)
  }

  if (frameworks.length === 0) {
    return jsonResponse({ error: 'At least one framework is required.' }, 400)
  }

  const frameworkList = frameworks.join(', ')

  const chatContext =
    messages.length > 0
      ? `\n\nAdditional context gathered through interview:\n${messages
          .filter((message) => message.role === 'user')
          .map((message) => `Answer: ${message.content}`)
          .join('\n')}`
      : ''

  const systemPrompt = `You are a senior compliance documentation writer.

Write in ${language || 'English'} using clear, practical, professional language.

Rules:
- Always produce structured, audit-ready markdown
- Use ## sections and ### subsections
- Use **bold** only for important terms
- Use - for bullet points
- Do not mention AI, uncertainty, or speculation
- Do not include filler text
- Do not invent assumptions beyond the provided details
- Keep the document practical, complete, and usable by real teams`

  const userPrompt = `Write a complete, professional ${type} for: "${title}"

Core details:
- Department: ${department || 'General'}
- Compliance frameworks: ${frameworkList}
- Classification: ${confidentiality || 'Internal'}
- Tone: ${tone || 'Technical but clear'}
${scope ? `- Scope: ${scope}` : ''}
${purpose ? `- Purpose: ${purpose}` : ''}
${tools ? `- Tools/Systems involved: ${tools}` : ''}
${chatContext}

Use this structure:
## Document Control
## 1. Purpose
## 2. Scope
## 3. Definitions
## 4. Roles and Responsibilities
## 5. Procedure
## 6. Exceptions and Special Cases
## 7. Monitoring and Compliance
## 8. Related Documents
## 9. Revision History

Important:
- Use the interview details where relevant
- Be specific and practical, not generic
- Keep the document concise but complete
- Include framework control references only where clearly relevant
- Do not add filler text`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content =
      message.content[0]?.type === 'text' ? message.content[0].text : ''

    if (!isValidGeneratedDocument(content)) {
      return jsonResponse(
        {
          error:
            'Generated document structure was invalid. Please try again.',
        },
        500,
        {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      )
    }

    return jsonResponse(
      { content },
      200,
      {
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    )
  } catch (error) {
    console.error('Anthropic error:', String(error))
    return jsonResponse({ error: 'Failed to generate document.' }, 500)
  }
}