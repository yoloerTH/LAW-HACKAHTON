import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ letterId: string }> }
) {
  const { letterId } = await params

  // Fetch the letter to get the Google Doc ID
  const { data: letter } = await supabase
    .from('engagement_letters')
    .select('id, pdf_url, status, recipient_email')
    .eq('id', letterId)
    .single()

  if (!letter || !letter.pdf_url) {
    return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
  }

  // Log the "opened" tracking event
  await supabase.from('tracking_events').insert({
    letter_id: letterId,
    event_type: 'opened',
    metadata: {
      opened_by: letter.recipient_email || 'unknown',
      opened_at: new Date().toISOString(),
      source: 'email_link_click',
    },
  })

  // Update letter status to "opened" (only if currently "sent")
  if (letter.status === 'sent') {
    await supabase
      .from('engagement_letters')
      .update({ status: 'opened' })
      .eq('id', letterId)
  }

  // Redirect to the Google Doc
  const googleDocUrl = `https://docs.google.com/document/d/${letter.pdf_url}/edit`
  return NextResponse.redirect(googleDocUrl)
}
