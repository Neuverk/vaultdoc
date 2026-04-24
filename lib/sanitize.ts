const MAX_FIELD_LENGTH = 2000
const MAX_ARRAY_ITEMS = 20

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

export function sanitizeField(value: unknown, maxLength = MAX_FIELD_LENGTH): string {
  if (typeof value !== 'string') return ''
  const stripped = stripHtml(value)
  const cleaned = removePromptInjectionPatterns(stripped)
  const normalized = normalizeWhitespace(cleaned)
  return normalized.slice(0, maxLength)
}

export function sanitizeStringArray(value: unknown, maxItems = MAX_ARRAY_ITEMS): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => sanitizeField(item))
    .filter(Boolean)
    .slice(0, maxItems)
}
