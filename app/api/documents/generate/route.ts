import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MAX_FIELD_LENGTH = 2000
const GENERATE_LIMIT = 10
const GENERATE_WINDOW_MS = 60 * 60 * 1000

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
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
    .slice(0, 20)
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
    .filter((msg) => msg.content.length > 0)
    .slice(0, 50)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rateLimit = await checkRateLimit(
  `documents:generate:${userId}`,
  GENERATE_LIMIT,
  GENERATE_WINDOW_MS,
)

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error:
          'Rate limit exceeded. You can generate up to 10 documents per hour. Please try again later.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(
            Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          ),
        },
      },
    )
  }

  const body = await req.json()

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
    return new Response(
      JSON.stringify({ error: 'Document title is required.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  if (!type) {
    return new Response(
      JSON.stringify({ error: 'Document type is required.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  if (frameworks.length === 0) {
    return new Response(
      JSON.stringify({ error: 'At least one framework is required.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  const frameworkList = frameworks.join(', ')

  const chatContext =
    messages.length > 0
      ? `\n\nAdditional context gathered through interview:\n${messages
          .map((m) => `${m.role === 'user' ? 'Answer' : 'Question'}: ${m.content}`)
          .join('\n')}`
      : ''

  const systemPrompt = `You are a senior compliance officer and technical writer with 15 years of experience writing documentation for Fortune 500 companies. You write in a clear, professional but human tone — not robotic or overly formal. Your documents are practical, specific, and immediately usable by real teams. Use concrete examples, explain the "why" behind each step, and write as if a real expert is guiding the reader. Write in ${language || 'English'}. Use markdown formatting: ## for sections, ### for subsections, **bold** for key terms, - for bullets.`

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

IMPORTANT: The interview answers above contain critical specific details that MUST be incorporated into the document. Do not write a generic document — use every relevant specific detail provided in the answers.

Structure the document with these sections:
## Document Control
(table with title, ID, version, date, department, classification, owner, reviewer)
## 1. Purpose
(2-3 paragraphs explaining why this document exists, what problem it solves, and what outcome is expected)
## 2. Scope
(who this applies to, what systems/processes are covered, any exclusions)
## 3. Definitions
(key terms and abbreviations used in this document)
## 4. Roles and Responsibilities
(RACI-style breakdown of who does what)
## 5. Procedure
(detailed step-by-step process incorporating the specific rules, exceptions, and operational details from the interview answers)
## 6. Exceptions and Special Cases
(how to handle deviations — use the specific scenarios mentioned in the interview)
## 7. Monitoring and Compliance
(how compliance is measured, KPIs, audit approach)
## 8. Related Documents
(other policies/SOPs this connects to)
## 9. Revision History
(table with version, date, author, changes)

Important:
- Reference specific ${frameworkList} control numbers where relevant
- Use the specific details from the interview answers where applicable
- Write in a human, expert voice — not a template
- Be specific and practical, not generic
- Each section should have real content, not placeholder text`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content =
      message.content[0]?.type === 'text' ? message.content[0].text : ''

    return new Response(JSON.stringify({ content }), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  } catch (error) {
    console.error('Anthropic error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Failed to generate document.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}