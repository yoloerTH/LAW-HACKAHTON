import { NextRequest, NextResponse } from 'next/server'

const GMAIL_WEBHOOK_URL = 'https://n8nsaved-production.up.railway.app/webhook/GmailLaw'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const res = await fetch(GMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.text()
    if (!data) {
      return NextResponse.json({ output: 'Email send request submitted successfully.' })
    }

    try {
      return NextResponse.json(JSON.parse(data))
    } catch {
      return NextResponse.json({ output: data })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
