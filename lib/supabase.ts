import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  name: string
  email: string | null
  address: string | null
  contact_person: string | null
  phone: string | null
  company_type: string | null
  tax_id: string | null
  country: string
  created_at: string
}

export type Matter = {
  id: string
  client_id: string
  title: string
  type: 'litigation' | 'real_estate' | 'corporate' | 'advisory'
  description: string | null
  jurisdiction: string
  governing_law: string
  created_at: string
}

export type EngagementLetter = {
  id: string
  matter_id: string | null
  client_id: string | null
  status: 'draft' | 'sent' | 'opened' | 'signed' | 'expired'
  content: string | null
  pdf_url: string | null
  fee_structure: Record<string, unknown> | null
  liability_cap: number | null
  recipient_email: string | null
  sent_at: string | null
  opened_at: string | null
  signed_at: string | null
  signer_name: string | null
  due_date: string | null
  follow_up_count: number
  created_at: string
  updated_at: string
  clients?: Client
  matters?: Matter
}

export type TrackingEvent = {
  id: string
  letter_id: string
  event_type: 'created' | 'sent' | 'opened' | 'viewed' | 'signed' | 'reminder_sent' | 'expired'
  metadata: Record<string, unknown>
  created_at: string
}
