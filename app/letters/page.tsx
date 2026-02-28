'use client'

import { useEffect, useState } from 'react'
import { supabase, type EngagementLetter } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { FileText, Search, Filter, ArrowRight, Eye, Send, Bell } from 'lucide-react'
import Link from 'next/link'

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  opened: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

type LetterWithRelations = EngagementLetter & {
  clients?: { name: string; email: string }
  matters?: { title: string; type: string }
}

export default function LettersPage() {
  const [letters, setLetters] = useState<LetterWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('engagement_letters')
        .select('*, clients(name, email), matters(title, type)')
        .order('created_at', { ascending: false })
      setLetters(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = letters.filter((l) => {
    const matchesSearch =
      !search ||
      l.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.matters?.title?.toLowerCase().includes(search.toLowerCase()) ||
      l.recipient_email?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statuses = ['all', 'draft', 'sent', 'opened', 'signed', 'expired']

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Engagement Letters
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {letters.length} letters total
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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, matter, or email..."
            className="pl-9 bg-card/50 border-gold/10 focus:border-gold/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-card/50 border border-gold/10 rounded-lg p-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-md capitalize transition-all ${
                statusFilter === s
                  ? 'bg-gold/15 text-gold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-gold/8 bg-card/50 backdrop-blur overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No letters found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold/8">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Client
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Matter
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Created
                  </th>
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Due
                  </th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-gold/5 hover:bg-gold/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-medium">
                          {l.clients?.name || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {l.recipient_email || l.clients?.email || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm">{l.matters?.title || '—'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {l.matters?.type?.replace('_', ' ') || ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="outline" className={statusBadgeClass[l.status]}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {l.due_date
                        ? new Date(l.due_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/letters/${l.id}`}
                          className="p-2 rounded-lg hover:bg-gold/10 text-muted-foreground hover:text-gold transition-all"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
