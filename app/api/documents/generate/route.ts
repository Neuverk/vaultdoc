import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body = await req.json()
  const {
    title, type, department, frameworks,
    scope, purpose, tools, tone, language, confidentiality,
  } = body

  const frameworkList = frameworks?.join(', ') || 'general best practices'

  const systemPrompt = `You are a senior compliance officer and technical writer with 15 years of experience writing 
documentation for Fortune 500 companies. You write in a clear, professional but human tone — not robotic or overly formal. 
Your documents are practical, specific, and immediately usable by real teams. 
Use concrete examples, explain the "why" behind each step, and write as if a real expert is guiding the reader.
Write in ${language || 'English'}. Use markdown formatting: ## for sections, ### for subsections, **bold** for key terms, - for bullets.`

  const userPrompt = `Write a complete, professional ${type} for: "${title}"

Context:
- Department: ${department}
- Compliance frameworks: ${frameworkList}  
- Classification: ${confidentiality || 'Internal'}
- Tone: ${tone || 'Technical but clear'}
${scope ? `- Scope: ${scope}` : ''}
${tools ? `- Tools/Systems involved: ${tools}` : ''}

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
(detailed step-by-step process with numbered steps, sub-steps where needed, and practical guidance)

## 6. Exceptions and Special Cases
(how to handle deviations from the standard process)

## 7. Monitoring and Compliance
(how compliance is measured, KPIs, audit approach)

## 8. Related Documents
(other policies/SOPs this connects to)

## 9. Revision History
(table with version, date, author, changes)

Important: 
- Reference specific ${frameworkList} control numbers where relevant
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

    const content = message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Anthropic error:', String(error))
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}