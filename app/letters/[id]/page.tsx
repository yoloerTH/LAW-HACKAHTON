'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type EngagementLetter, type TrackingEvent } from '@/lib/supabase'
import { sendToAgent } from '@/lib/n8n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Send,
  Bell,
  Download,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Clock,
  Eye,
  PenLine,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  opened: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const timelineSteps = ['created', 'sent', 'opened', 'signed'] as const
const timelineIcons = {
  created: FileText,
  sent: Send,
  opened: Eye,
  signed: CheckCircle2,
}

type LetterWithRelations = EngagementLetter & {
  clients?: { name: string; email: string; contact_person: string }
  matters?: { title: string; type: string; description: string; jurisdiction: string }
}

export default function LetterDetailPage() {
  const { id } = useParams()
  const [letter, setLetter] = useState<LetterWithRelations | null>(null)
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [letterRes, eventsRes] = await Promise.all([
        supabase
          .from('engagement_letters')
          .select('*, clients(name, email, contact_person), matters(title, type, description, jurisdiction)')
          .eq('id', id)
          .single(),
        supabase
          .from('tracking_events')
          .select('*')
          .eq('letter_id', id)
          .order('created_at', { ascending: true }),
      ])
      setLetter(letterRes.data)
      setEvents(eventsRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleAction(action: string) {
    if (!letter) return
    setActionLoading(action)
    try {
      let message = ''
      if (action === 'send') {
        message = `Send the engagement letter with id ${letter.id} to ${letter.recipient_email || letter.clients?.email}`
      } else if (action === 'remind') {
        message = `Send a reminder for engagement letter with id ${letter.id} to ${letter.recipient_email || letter.clients?.email}`
      } else if (action === 'sign') {
        message = `Mark engagement letter with id ${letter.id} as signed`
      }
      await sendToAgent(message)
      // Reload data
      const [letterRes, eventsRes] = await Promise.all([
        supabase
          .from('engagement_letters')
          .select('*, clients(name, email, contact_person), matters(title, type, description, jurisdiction)')
          .eq('id', id)
          .single(),
        supabase
          .from('tracking_events')
          .select('*')
          .eq('letter_id', id)
          .order('created_at', { ascending: true }),
      ])
      setLetter(letterRes.data)
      setEvents(eventsRes.data || [])
    } catch {
      console.error('Action failed')
    }
    setActionLoading(null)
  }

  const currentStepIndex = letter
    ? timelineSteps.indexOf(letter.status as typeof timelineSteps[number])
    : -1

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  if (!letter) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Letter not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/letters"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Letters
          </Link>
          <h1
            className="text-3xl font-light tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {letter.clients?.name || 'Engagement Letter'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {letter.matters?.title || 'No matter assigned'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {letter.pdf_url && (
            <a
              href={`https://docs.google.com/document/d/${letter.pdf_url}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm hover:bg-blue-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Google Doc
            </a>
          )}
          {letter.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              onClick={() => handleAction('send')}
              disabled={!!actionLoading}
            >
              {actionLoading === 'send' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Send
            </Button>
          )}
          {(letter.status === 'sent' || letter.status === 'opened') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                onClick={() => handleAction('remind')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'remind' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Bell className="w-4 h-4 mr-1" />
                )}
                Remind
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => handleAction('sign')}
                disabled={!!actionLoading}
              >
                {actionLoading === 'sign' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                )}
                Mark Signed
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="gold-line opacity-30" />

      {/* Status Timeline */}
      <Card className="border-gold/8 bg-card/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {timelineSteps.map((step, i) => {
              const Icon = timelineIcons[step]
              const isComplete = i <= currentStepIndex
              const isCurrent = i === currentStepIndex
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isComplete
                          ? isCurrent
                            ? 'bg-gold/20 border-gold text-gold'
                            : 'bg-gold/10 border-gold/40 text-gold/60'
                          : 'border-gold/10 text-muted-foreground/30'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-widest mt-2 ${
                        isComplete ? 'text-gold' : 'text-muted-foreground/30'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      className={`flex-1 h-px mx-4 ${
                        i < currentStepIndex ? 'bg-gold/40' : 'bg-gold/8'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Letter Content */}
        <div className="col-span-2 space-y-6">
          <Card className="border-gold/8 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-gold" />
                Letter Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {letter.content ? (
                <div
                  className="prose prose-invert prose-sm max-w-none text-foreground/80 leading-relaxed"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '15px' }}
                  dangerouslySetInnerHTML={{ __html: letter.content.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <p className="text-muted-foreground text-sm py-8 text-center">
                  No content generated yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tracking Events */}
          <Card className="border-gold/8 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-gold" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 py-2 border-b border-gold/5 last:border-0"
                    >
                      <div className="w-2 h-2 rounded-full bg-gold/40" />
                      <Badge
                        variant="outline"
                        className={statusBadgeClass[e.event_type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}
                      >
                        {e.event_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(e.created_at).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm py-4 text-center">
                  No tracking events yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-gold/8 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                <Badge variant="outline" className={statusBadgeClass[letter.status]}>
                  {letter.status}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Client</p>
                <p className="text-sm">{letter.clients?.name || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Contact</p>
                <p className="text-sm">{letter.clients?.contact_person || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                <p className="text-sm text-gold">{letter.recipient_email || letter.clients?.email || '—'}</p>
              </div>
              <div className="gold-line opacity-20" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Matter Type</p>
                <p className="text-sm capitalize">{letter.matters?.type?.replace('_', ' ') || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Jurisdiction</p>
                <p className="text-sm">{letter.matters?.jurisdiction || '—'}</p>
              </div>
              {letter.liability_cap && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Liability Cap</p>
                  <p className="text-sm">{new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(letter.liability_cap)}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Follow-ups Sent</p>
                <p className="text-sm">{letter.follow_up_count}</p>
              </div>
              {letter.due_date && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Due Date</p>
                  <p className="text-sm">
                    {new Date(letter.due_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {letter.fee_structure && (
            <Card className="border-gold/8 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                  Fee Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(letter.fee_structure).map(([role, rate]) => (
                    <div key={role} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground capitalize">{role.replace('_', ' ')}</span>
                      <span className="text-gold">{typeof rate === 'number' ? `€${rate}` : String(rate)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
