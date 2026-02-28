'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Client, type Matter, type EngagementLetter } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  Building2,
  FileText,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  opened: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  signed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [matters, setMatters] = useState<Matter[]>([])
  const [letters, setLetters] = useState<(EngagementLetter & { matters?: { title: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [clientRes, mattersRes, lettersRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('matters').select('*').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('engagement_letters').select('*, matters(title)').eq('client_id', id).order('created_at', { ascending: false }),
      ])
      setClient(clientRes.data)
      setMatters(mattersRes.data || [])
      setLetters(lettersRes.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  if (!client) {
    return <div className="text-center py-20 text-muted-foreground">Client not found</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Clients
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-xl font-light text-gold" style={{ fontFamily: 'var(--font-display)' }}>
              {client.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-light tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {client.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {client.contact_person && `${client.contact_person} · `}
              {client.country}
            </p>
          </div>
        </div>
      </div>

      <div className="gold-line opacity-30" />

      <div className="grid grid-cols-3 gap-6">
        {/* Info */}
        <Card className="border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Contact Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gold/60" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gold/60" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gold/60" />
                <span>{client.address}</span>
              </div>
            )}
            {client.company_type && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gold/60" />
                <span>{client.company_type}</span>
              </div>
            )}
            {client.tax_id && (
              <div className="text-sm">
                <span className="text-muted-foreground">Tax ID:</span> {client.tax_id}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matters */}
        <Card className="border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Matters ({matters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matters.length > 0 ? (
              <div className="space-y-3">
                {matters.map((m) => (
                  <div key={m.id} className="py-2 border-b border-gold/5 last:border-0">
                    <p className="text-sm font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {m.type.replace('_', ' ')} · {m.jurisdiction}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">No matters yet</p>
            )}
          </CardContent>
        </Card>

        {/* Letters */}
        <Card className="border-gold/8 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Letters ({letters.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {letters.length > 0 ? (
              <div className="space-y-3">
                {letters.map((l) => (
                  <Link
                    key={l.id}
                    href={`/letters/${l.id}`}
                    className="flex items-center justify-between py-2 border-b border-gold/5 last:border-0 hover:text-gold transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm">{l.matters?.title || 'Untitled'}</span>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass[l.status]}>
                      {l.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">No letters yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
