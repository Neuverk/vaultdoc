import Anthropic from '@anthropic-ai/sdk'
import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { messages } = await req.json()

  const systemPrompt = `You are a compliance documentation expert assistant for Vaultdoc.
Your job is to gather information needed to write a professional compliance document.

RULES:
1. Analyze the conversation. Decide if you have ENOUGH information to generate a great document.
2. If you need more info, ask ONE focused question — the most important missing piece.
3. Ask as many or as few questions as needed. Simple requests may need 0-1 questions. Complex ones may need 3-4.
4. When you have enough info, respond with EXACTLY this JSON: {"ready": true, "meta": {"title": "...", "type": "SOP", "department": "IT / Information Security", "frameworks": ["ISO 27001:2022"], "language": "English", "confidentiality": "Internal", "scope": "...", "tools": "...", "tone": "Technical"}}
5. If you need more info, respond with EXACTLY this JSON: {"ready": false, "reply": "your question here"}
6. Keep questions short and conversational. Never ask more than one question at a time.
7. RESPOND ONLY WITH JSON. NO OTHER TEXT.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({
      ready: false,
      reply: "Could you tell me more about the specific tools or systems this document should cover?"
    }), { headers: { 'Content-Type': 'application/json' } })
  }
}