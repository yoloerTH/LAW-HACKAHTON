'use client'

import { useEffect, useState } from 'react'
import { supabase, type Client } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Users, MapPin, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
      setClients(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = clients.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.contact_person?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-3xl font-light tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Clients
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clients.length} clients registered
          </p>
        </div>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2 bg-gold/10 text-gold border border-gold/20 rounded-lg text-sm hover:bg-gold/20 transition-all"
        >
          Add via AI Chat
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="gold-line opacity-30" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          className="pl-9 bg-card/50 border-gold/10 focus:border-gold/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No clients found</p>
          <p className="text-xs text-muted-foreground/50 mt-1">
            Use the AI Chat to create your first client
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <Link key={c.id} href={`/clients/${c.id}`}>
              <Card
                className={`border-gold/8 bg-card/50 hover:border-gold/20 transition-all cursor-pointer group animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
                style={{ opacity: 0 }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gold/8 flex items-center justify-center">
                      <span className="text-sm font-medium text-gold">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-gold transition-colors" />
                  </div>
                  <h3 className="text-sm font-medium mb-1 group-hover:text-gold transition-colors">
                    {c.name}
                  </h3>
                  {c.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                      <Mail className="w-3 h-3" />
                      {c.email}
                    </p>
                  )}
                  {c.country && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {c.country}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
