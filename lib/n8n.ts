const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL!
const N8N_LETTER_GENERATE_URL = process.env.NEXT_PUBLIC_N8N_LETTER_GENERATE_URL!

export async function sendToAgent(message: string): Promise<string> {
  const res = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
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
  const res = await fetch(N8N_LETTER_GENERATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Letter generation failed: ${res.status}`)
  }

  const data = await res.json()
  return data.output || data.message || data.text || JSON.stringify(data)
}
