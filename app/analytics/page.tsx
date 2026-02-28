'use client'

import { useEffect, useState } from 'react'
import { supabase, type EngagementLetter } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Clock, TrendingUp, Target, Percent } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: '#6b7280',
  sent: '#3b82f6',
  opened: '#f59e0b',
  signed: '#10b981',
  expired: '#ef4444',
}

type LetterWithRelations = EngagementLetter & {
  matters?: { type: string }
}

export default function AnalyticsPage() {
  const [letters, setLetters] = useState<LetterWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('engagement_letters')
        .select('*, matters(type)')
        .order('created_at', { ascending: false })
      setLetters(data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Average time to signature (days)
  const signedLetters = letters.filter((l) => l.signed_at && l.created_at)
  const avgDays =
    signedLetters.length > 0
      ? Math.round(
          signedLetters.reduce((sum, l) => {
            const diff = new Date(l.signed_at!).getTime() - new Date(l.created_at).getTime()
            return sum + diff / (1000 * 60 * 60 * 24)
          }, 0) / signedLetters.length
        )
      : 0

  // Sign rate
  const totalSent = letters.filter((l) => l.status !== 'draft').length
  const signRate = totalSent > 0 ? Math.round((signedLetters.length / totalSent) * 100) : 0

  // Average follow-ups
  const avgFollowUps =
    letters.length > 0
      ? (letters.reduce((sum, l) => sum + l.follow_up_count, 0) / letters.length).toFixed(1)
      : '0'

  // By matter type
  const byType = letters.reduce(
    (acc, l) => {
      const type = l.matters?.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const typeData = Object.entries(byType).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  // By status
  const byStatus = letters.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const statusData = Object.entries(byStatus).map(([name, value]) => ({
    name,
    value,
  }))

  // Monthly trend
  const monthly = letters.reduce(
    (acc, l) => {
      const month = new Date(l.created_at).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
      acc[month] = (acc[month] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const monthlyData = Object.entries(monthly)
    .map(([month, count]) => ({ month, count }))
    .reverse()
    .slice(0, 12)
    .reverse()

  const kpis = [
    {
      label: 'Avg. Days to Sign',
      value: avgDays || '—',
      icon: Clock,
      accent: 'text-gold',
      bg: 'bg-gold/8',
    },
    {
      label: 'Signature Rate',
      value: `${signRate}%`,
      icon: Target,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/8',
    },
    {
      label: 'Avg. Follow-ups',
      value: avgFollowUps,
      icon: TrendingUp,
      accent: 'text-blue-400',
      bg: 'bg-blue-500/8',
    },
    {
      label: 'Total Processed',
      value: letters.length,
      icon: Percent,
      accent: 'text-yellow-400',
      bg: 'bg-yellow-500/8',
    },
  ]

  const typeColors = ['#c9a55c', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Insights and performance metrics
        </p>
      </div>

      <div className="gold-line opacity-30" />

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card
            key={k.label}
            className={`border-gold/8 bg-card/50 animate-fade-in-up stagger-${i + 1}`}
            style={{ opacity: 0 }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    {k.label}
                  </p>
                  <p
                    className="text-3xl font-light tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {loading ? '—' : k.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${k.bg}`}>
                  <k.icon className={`w-4 h-4 ${k.accent}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Monthly Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#7a8194', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#7a8194', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d1321',
                      border: '1px solid rgba(201,165,92,0.2)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" fill="#c9a55c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm py-16 text-center">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* By Matter Type */}
        <Card className="border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              By Matter Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {typeData.map((_, i) => (
                        <Cell key={i} fill={typeColors[i % typeColors.length]} />
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
                  {typeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: typeColors[i % typeColors.length] }}
                      />
                      <span className="capitalize text-muted-foreground">{d.name}</span>
                      <span className="text-foreground font-medium ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-16 text-center">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="col-span-2 border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-4">
                {statusData.map((d) => {
                  const pct = letters.length > 0 ? Math.round((d.value / letters.length) * 100) : 0
                  return (
                    <div key={d.name} className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs capitalize text-muted-foreground">{d.name}</span>
                        <span className="text-xs text-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: statusColors[d.name] || '#6b7280',
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground/50 mt-1">{d.value} letters</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">
                No data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
