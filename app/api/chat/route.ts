import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const n8nUrl = process.env.N8N_WEBHOOK_URL!

  const res = await fetch(n8nUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.text()

  try {
    return NextResponse.json(JSON.parse(data))
  } catch {
    return NextResponse.json({ output: data })
  }
}
