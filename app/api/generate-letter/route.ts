import { NextRequest, NextResponse } from 'next/server'

const N8N_URL = process.env.N8N_LETTER_GENERATE_URL || 'https://n8nsaved-production.up.railway.app/webhook/LetterGenerate'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(N8N_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.text()

  if (!data) {
    return NextResponse.json({ output: 'Letter generation request sent successfully.' })
  }

  try {
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ output: data })
  }
}
