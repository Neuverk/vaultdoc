import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { tenants, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit } from '@/lib/rate-limit'
import type { PlanType } from '@/lib/plans'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const MAX_FIELD_LENGTH = 2000
const CHAT_WINDOW_MS = 60 * 60 * 1000

const CHAT_LIMITS: Record<PlanType, number> = {
  free: 30,
  starter: 100,
  enterprise: 300,
}

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

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item): ChatMessage | null => {
      if (!item || typeof item !== 'object') return null

      const role: 'user' | 'assistant' =
        'role' in item && item.role === 'assistant' ? 'assistant' : 'user'

      const rawContent = 'content' in item ? item.content : ''
      const content = sanitizeField(rawContent)

      if (!content) return null

      return { role, content }
    })
    .filter((msg): msg is ChatMessage => Boolean(msg))
    .slice(0, 50)
}

async function getUserPlan(userId: string): Promise<PlanType> {
  try {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    })

    if (!dbUser?.tenantId) return 'free'

    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, dbUser.tenantId),
    })

    return (tenant?.plan ?? 'free') as PlanType
  } catch (error) {
    console.error('Failed to resolve user plan:', String(error))
    return 'free'
  }
}

function buildFallbackQuestion() {
  return {
    ready: false,
    reply:
      'What specific process, rule, or workflow should this document describe in detail?',
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const plan = await getUserPlan(userId)
  const chatLimit = CHAT_LIMITS[plan] ?? CHAT_LIMITS.free

  const rateLimit = checkRateLimit(
    `documents:chat:${userId}`,
    chatLimit,
    CHAT_WINDOW_MS,
  )

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. Your ${plan} plan allows up to ${chatLimit} chat requests per hour. Please try again later.`,
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

  let body: any = null

  try {
    body = await req.json()
  } catch (error) {
    console.error('Chat route: invalid JSON body', error)
    return new Response(JSON.stringify(buildFallbackQuestion()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  }

  const messages = sanitizeMessages(body?.messages)

  console.log('Chat route received messages:', messages)

  if (messages.length === 0) {
    console.error('Chat route: no valid messages after sanitization', body)
    return new Response(JSON.stringify(buildFallbackQuestion()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    })
  }

  const safeMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const systemPrompt = `You are a compliance documentation expert assistant for VaultDoc.
Your job is to gather information needed to write a professional compliance document.

RULES:
1. Analyze the conversation. Decide if you have ENOUGH information to generate a great document.
2. If you need more info, ask ONE focused question — the most important missing piece.
3. Ask as many or as few questions as needed. Simple requests may need 0-1 questions. Complex ones may need 3-4.
4. When you have enough info, respond with EXACTLY this JSON: {"ready": true, "meta": {"title": "...", "type": "SOP", "department": "IT / Information Security", "frameworks": ["ISO 27001:2022"], "language": "English", "confidentiality": "Internal", "scope": "...", "tools": "...", "tone": "Technical"}}
5. If you need more info, respond with EXACTLY this JSON: {"ready": false, "reply": "your question here"}
6. Keep questions short and conversational. Never ask more than one question at a time.
7. RESPOND ONLY WITH JSON. NO OTHER TEXT.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: safeMessages,
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : '{}'

    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      })
    } catch (parseError) {
      console.error('Chat route: failed to parse Anthropic JSON', parseError, text)

      return new Response(
        JSON.stringify({
          ready: false,
          reply:
            'Could you tell me more about the specific tools or systems this document should cover?',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      )
    }
  } catch (error) {
    console.error('Anthropic chat error:', String(error))

    return new Response(
      JSON.stringify({
        ready: false,
        reply:
          'I could not process that just now. Please describe the main workflow, tools, and target users for this document.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      },
    )
  }
}