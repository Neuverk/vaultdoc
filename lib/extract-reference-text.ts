import mammoth from 'mammoth'

export async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'text/plain') {
    return buffer.toString('utf-8')
  }

  // application/vnd.openxmlformats-officedocument.wordprocessingml.document
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
