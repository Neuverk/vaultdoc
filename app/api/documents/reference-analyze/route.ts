import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const ANALYZE_LIMIT = 20
const ANALYZE_WINDOW_MS = 60 * 60 * 1000
const MAX_REF_LENGTH = 20_000
const MAX_FIELD_LENGTH = 500

function sanitizeField(value: unknown, max = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/ignore\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/disregard\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/forget\s+(all|any|previous|prior)\s+instructions?/gi, ' ')
    .replace(/system\s+prompt/gi, ' ')
    .replace(/jailbreak/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rateLimit = await checkRateLimit(
    `documents:reference-analyze:${userId}`,
    ANALYZE_LIMIT,
    ANALYZE_WINDOW_MS,
  )

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
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

  const referenceText = sanitizeField(body.referenceText, MAX_REF_LENGTH)
  const title = sanitizeField(body.title)
  const preferredType = sanitizeField(body.preferredType)

  if (!referenceText) {
    return new Response(
      JSON.stringify({ error: 'referenceText is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const userPrompt = `Analyze this compliance reference document and return a JSON analysis.

REFERENCE TEXT:
${referenceText}
${title ? `\nDesired title: ${title}` : ''}
${preferredType ? `\nPreferred document type: ${preferredType}` : ''}

Return ONLY this JSON structure with no other text:
{
  "detectedType": "SOP",
  "summary": "2-3 sentence description of what this document covers",
  "suggestedFrameworks": ["ISO 27001:2022"],
  "likelyDepartment": "IT / Information Security",
  "identifiedGaps": ["gap 1", "gap 2", "gap 3"],
  "recommendedNextAction": "One-sentence recommendation for the next step"
}`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'You are a compliance documentation analyst. Analyze reference documents and return structured JSON. Respond ONLY with valid JSON. No commentary, no code fences, no explanation.',
      messages: [{ role: 'user', content: userPrompt }],
    })

    const text = message.content[0]?.type === 'text' ? message.content[0].text : ''

    let parsed: unknown
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    } catch {
      return new Response(
        JSON.stringify({ error: 'Analysis failed to produce a valid result. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('detectedType' in parsed) ||
      !('summary' in parsed)
    ) {
      return new Response(
        JSON.stringify({ error: 'Analysis returned an unexpected format. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, analysis: parsed }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      },
    )
  } catch (error) {
    console.error('Reference analyze error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Analysis failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
