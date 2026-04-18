import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const GENERATE_LIMIT = 10
const GENERATE_WINDOW_MS = 60 * 60 * 1000
const MAX_REF_LENGTH = 20_000
const MAX_FIELD_LENGTH = 500

type SelectedAction = 'create-draft' | 'find-gaps' | 'improve-structure'

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

const VALID_ACTIONS: SelectedAction[] = ['create-draft', 'find-gaps', 'improve-structure']

function buildPrompt(
  action: SelectedAction,
  referenceText: string,
  title: string,
  type: string,
  framework: string,
): { system: string; user: string } {
  const docLabel = type || 'compliance document'
  const fw = framework || 'applicable compliance frameworks'

  if (action === 'create-draft') {
    return {
      system: `You are a senior compliance officer and technical writer. Transform reference material into a complete, structured, professional compliance document. Use markdown: ## for sections, ### for subsections, **bold** for key terms, - for bullets. Be specific and practical.`,
      user: `Transform this reference material into a complete professional ${docLabel}${title ? ` titled "${title}"` : ''}.

Map the content to ${fw} standards where applicable. Use this structure:
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

REFERENCE MATERIAL:
${referenceText}

Produce the complete document now. Be specific — use the content from the reference material.`,
    }
  }

  if (action === 'find-gaps') {
    return {
      system: `You are a compliance auditor. Analyse documents against compliance standards and produce clear, actionable gap analysis reports in markdown.`,
      user: `Perform a gap analysis on this document against ${fw} requirements${title ? ` for: "${title}"` : ''}.

Structure your gap analysis report as follows:
## Gap Analysis Report
## 1. Executive Summary
## 2. Document Overview
## 3. Compliance Framework Mapping
## 4. Identified Gaps
(For each gap: description, severity — Critical/High/Medium/Low, recommendation)
## 5. Missing Sections
## 6. Remediation Roadmap
## 7. Conclusion

DOCUMENT TO ANALYSE:
${referenceText}

Produce the complete gap analysis now.`,
    }
  }

  // improve-structure
  return {
    system: `You are a compliance documentation specialist. Reformat and improve documents to meet professional compliance standards. Preserve the original content and intent — only improve structure, clarity, and completeness.`,
    user: `Reformat this document into a professional compliance ${docLabel}${title ? ` titled "${title}"` : ''}.

Apply ${fw} structural conventions. Improve headings, add missing standard sections, clarify ambiguous language, and format tables and lists properly.

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

ORIGINAL DOCUMENT:
${referenceText}

Produce the reformatted document now.`,
  }
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const rateLimit = await checkRateLimit(
    `documents:reference-generate:${userId}`,
    GENERATE_LIMIT,
    GENERATE_WINDOW_MS,
  )

  if (!rateLimit.success) {
    return new Response(
      JSON.stringify({
        error: `Rate limit exceeded. You can generate up to ${GENERATE_LIMIT} documents per hour. Please try again later.`,
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

  const referenceText = sanitizeField(body.referenceText, MAX_REF_LENGTH)
  const selectedAction = typeof body.selectedAction === 'string' && VALID_ACTIONS.includes(body.selectedAction as SelectedAction)
    ? (body.selectedAction as SelectedAction)
    : null
  const title = sanitizeField(body.title)
  const type = sanitizeField(body.type)
  const framework = sanitizeField(body.framework)

  if (!referenceText) {
    return new Response(
      JSON.stringify({ error: 'referenceText is required.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  if (!selectedAction) {
    return new Response(
      JSON.stringify({ error: 'selectedAction must be one of: create-draft, find-gaps, improve-structure.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const { system, user } = buildPrompt(selectedAction, referenceText, title, type, framework)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    })

    const content = message.content[0]?.type === 'text' ? message.content[0].text : ''

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Generation produced no content. Please try again.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, content }),
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      },
    )
  } catch (error) {
    console.error('Reference generate error:', String(error))
    return new Response(
      JSON.stringify({ error: 'Generation failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
