const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!
const N8N_LETTER_GENERATE_URL = process.env.NEXT_PUBLIC_N8N_LETTER_GENERATE_URL!

// Generate a persistent session ID per browser tab for conversation memory
let chatSessionId: string | null = null
export function getChatSessionId(): string {
  if (!chatSessionId) {
    chatSessionId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('lexflow-chat-session') || (() => {
          const id = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
          sessionStorage.setItem('lexflow-chat-session', id)
          return id
        })())
      : `chat-${Date.now()}`
  }
  return chatSessionId
}

export async function sendToAgent(message: string): Promise<string> {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId: getChatSessionId() }),
  })

  if (!res.ok) {
    throw new Error(`Agent request failed: ${res.status}`)
  }

  const data = await res.json()
  return data.output || data.message || data.text || JSON.stringify(data)
}

export async function generateLetter(payload: {
  letterId: string
  clientName: string
  clientEmail: string
  clientAddress: string
  contactPerson: string
  country: string
  matterTitle: string
  matterType: string
  matterDescription: string
  jurisdiction: string
  governingLaw: string
  feeStructure: Record<string, number | string | undefined>
  feeType: string
  liabilityCap: string
  specialTerms: string
}): Promise<string> {
  const res = await fetch('/api/generate-letter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Letter generation failed: ${res.status}`)
  }

  const text = await res.text()
  if (!text) {
    return 'Letter generation request sent successfully. The AI agent is processing it.'
  }

  try {
    const data = JSON.parse(text)
    return data.output || data.message || data.text || JSON.stringify(data)
  } catch {
    return text
  }
}
