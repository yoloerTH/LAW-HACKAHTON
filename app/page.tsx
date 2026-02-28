'use client'

import { useEffect, useState } from 'react'
import { supabase, type EngagementLetter, type TrackingEvent } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const statusColors: Record<string, string> = {
  draft: '#6b7280',
  sent: '#3b82f6',
  opened: '#f59e0b',
  signed: '#10b981',
  expired: '#ef4444',
}

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  opened: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function Dashboard() {
  const [letters, setLetters] = useState<EngagementLetter[]>([])
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [lettersRes, eventsRes] = await Promise.all([
        supabase
          .from('engagement_letters')
          .select('*, clients(name, email), matters(title, type)')
          .order('created_at', { ascending: false }),
        supabase
          .from('tracking_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      setLetters(lettersRes.data || [])
      setEvents(eventsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const total = letters.length
  const pending = letters.filter((l) => l.status === 'sent' || l.status === 'opened').length
  const signed = letters.filter((l) => l.status === 'signed').length
  const overdue = letters.filter(
    (l) =>
      l.due_date &&
      new Date(l.due_date) < new Date() &&
      l.status !== 'signed'
  ).length

  const statusCounts = letters.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))

  const stats = [
    {
      label: 'Total Letters',
      value: total,
      icon: FileText,
      accent: 'text-gold',
      bg: 'bg-gold/8',
    },
    {
      label: 'Pending Signature',
      value: pending,
      icon: Clock,
      accent: 'text-blue-400',
      bg: 'bg-blue-500/8',
    },
    {
      label: 'Signed',
      value: signed,
      icon: CheckCircle2,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: AlertTriangle,
      accent: 'text-red-400',
      bg: 'bg-red-500/8',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Engagement letter overview and activity
          </p>
        </div>
        <Link
          href="/letters/new"
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-lg text-sm hover:bg-gold/20 transition-all"
        >
          New Letter
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="gold-line opacity-30" />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card
            key={s.label}
            className={`border-gold/8 bg-card/50 backdrop-blur animate-fade-in-up stagger-${i + 1}`}
            style={{ opacity: 0 }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {s.label}
                  </p>
                  <p className="text-3xl font-light tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {loading ? '—' : s.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-4 h-4 ${s.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <Card className="border-gold/8 bg-card/50 backdrop-blur animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={statusColors[entry.name] || '#6b7280'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0d1321',
                        border: '1px solid rgba(201,165,92,0.2)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: statusColors[d.name] }}
                      />
                      <span className="capitalize text-muted-foreground">{d.name}</span>
                      <span className="text-foreground font-medium ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No letters yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-2 border-gold/8 bg-card/50 backdrop-blur animate-fade-in-up stagger-6" style={{ opacity: 0 }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-gold" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={statusBadgeClass[e.event_type] || statusBadgeClass.draft}
                      >
                        {e.event_type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Letter {e.letter_id?.slice(0, 8)}...
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground/60">
                      {new Date(e.created_at).toLocaleDateString('en-GB', {
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
              <p className="text-muted-foreground text-sm py-8 text-center">
                No activity yet — create your first letter
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Letters */}
      {overdue > 0 && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Overdue Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {letters
                .filter(
                  (l) =>
                    l.due_date &&
                    new Date(l.due_date) < new Date() &&
                    l.status !== 'signed'
                )
                .map((l) => {
                  const client = (l as unknown as { clients: { name: string } })?.clients
                  const matter = (l as unknown as { matters: { title: string } })?.matters
                  return (
                    <Link
                      key={l.id}
                      href={`/letters/${l.id}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-red-500/5 transition-colors"
                    >
                      <div>
                        <span className="text-sm">{client?.name || 'Unknown Client'}</span>
                        <span className="text-xs text-muted-foreground ml-3">{matter?.title}</span>
                      </div>
                      <span className="text-xs text-red-400">
                        Due{' '}
                        {new Date(l.due_date!).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </Link>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
