'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { generateLetter } from '@/lib/n8n'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  ArrowRight,
  User,
  Briefcase,
  DollarSign,
  FileText,
  Loader2,
  Sparkles,
  Check,
  Database,
  ExternalLink,
  Send,
  ChevronDown,
} from 'lucide-react'

const steps = [
  { label: 'Client', icon: User },
  { label: 'Matter', icon: Briefcase },
  { label: 'Fees', icon: DollarSign },
  { label: 'Generate', icon: FileText },
]

const matterTypes = [
  { value: 'litigation', label: 'Litigation' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'advisory', label: 'Advisory' },
]

type ExistingClient = { id: string; name: string; email: string; address: string; contact_person: string; country: string }
type ExistingMatter = { id: string; title: string; type: string; description: string; jurisdiction: string; governing_law: string; client_id: string }

export default function NewLetterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [letterId, setLetterId] = useState<string | null>(null)
  const [googleDocUrl, setGoogleDocUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Existing clients/matters from Supabase
  const [existingClients, setExistingClients] = useState<ExistingClient[]>([])
  const [existingMatters, setExistingMatters] = useState<ExistingMatter[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null)
  const [useExistingClient, setUseExistingClient] = useState(false)
  const [useExistingMatter, setUseExistingMatter] = useState(false)

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    contactPerson: '',
    country: 'Greece',
    matterTitle: '',
    matterType: 'litigation',
    matterDescription: '',
    jurisdiction: 'Athens, Greece',
    governingLaw: 'Greek Law',
    feeType: 'hourly',
    managingPartner: '554',
    seniorPartner: '492',
    partner: '394',
    seniorAssociate: '344',
    associate: '283',
    juniorAssociate: '246',
    trainee: '98',
    fixedFee: '',
    liabilityCap: '',
    specialTerms: '',
  })

  // Fetch existing clients on mount
  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, address, contact_person, country')
        .order('name')
      if (data) setExistingClients(data)
    }
    fetchClients()
  }, [])

  // Fetch matters when a client is selected
  useEffect(() => {
    async function fetchMatters() {
      if (!selectedClientId) {
        setExistingMatters([])
        return
      }
      const { data } = await supabase
        .from('matters')
        .select('id, title, type, description, jurisdiction, governing_law, client_id')
        .eq('client_id', selectedClientId)
        .order('created_at', { ascending: false })
      if (data) setExistingMatters(data)
    }
    fetchMatters()
  }, [selectedClientId])

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function selectExistingClient(clientId: string) {
    const client = existingClients.find((c) => c.id === clientId)
    if (!client) return
    setSelectedClientId(clientId)
    setForm((prev) => ({
      ...prev,
      clientName: client.name || '',
      clientEmail: client.email || '',
      clientAddress: client.address || '',
      contactPerson: client.contact_person || '',
      country: client.country || 'Greece',
    }))
  }

  function selectExistingMatter(matterId: string) {
    const matter = existingMatters.find((m) => m.id === matterId)
    if (!matter) return
    setSelectedMatterId(matterId)
    setForm((prev) => ({
      ...prev,
      matterTitle: matter.title || '',
      matterType: matter.type || 'litigation',
      matterDescription: matter.description || '',
      jurisdiction: matter.jurisdiction || 'Athens, Greece',
      governingLaw: matter.governing_law || 'Greek Law',
    }))
  }

  async function handleSendEmail() {
    if (!letterId) return
    setSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letterId,
          recipientEmail: form.clientEmail,
          clientName: form.clientName,
          contactPerson: form.contactPerson,
          matterTitle: form.matterTitle,
          googleDocId: googleDocUrl ? googleDocUrl.split('/d/')[1]?.split('/')[0] : '',
          googleDocUrl: googleDocUrl || '',
        }),
      })
      if (!res.ok) throw new Error('Failed to send email')
      setSent(true)
    } catch (err) {
      console.error(err)
      alert('Failed to send email. Please try again.')
    }
    setSending(false)
  }

  async function handleGenerate() {
    console.log('MATTER TYPE BEING SAVED:', form.matterType)
    setGenerating(true)
    setSaving(true)
    setStatus('Saving client to database...')

    try {
      let clientId: string

      if (useExistingClient && selectedClientId) {
        clientId = selectedClientId
        // Update existing client with any changed info
        await supabase.from('clients').update({
          email: form.clientEmail || undefined,
          address: form.clientAddress || undefined,
          contact_person: form.contactPerson || undefined,
          country: form.country,
        }).eq('id', clientId)
        setStatus('Using existing client...')
      } else {
        // Check if client exists by name
        const { data: foundClients } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', form.clientName)
          .limit(1)

        if (foundClients && foundClients.length > 0) {
          clientId = foundClients[0].id
          await supabase.from('clients').update({
            email: form.clientEmail || undefined,
            address: form.clientAddress || undefined,
            contact_person: form.contactPerson || undefined,
            country: form.country,
          }).eq('id', clientId)
          setStatus('Client found, updating...')
        } else {
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              name: form.clientName,
              email: form.clientEmail,
              address: form.clientAddress,
              contact_person: form.contactPerson,
              country: form.country,
            })
            .select('id')
            .single()

          if (clientError) throw clientError
          clientId = newClient.id
          setStatus('Client created.')
        }
      }

      // Step 2: Matter
      let matterId: string

      if (useExistingMatter && selectedMatterId) {
        matterId = selectedMatterId
        setStatus('Using existing matter...')
      } else {
        setStatus('Saving matter to database...')
        const { data: newMatter, error: matterError } = await supabase
          .from('matters')
          .insert({
            client_id: clientId,
            title: form.matterTitle,
            type: form.matterType,
            description: form.matterDescription,
            jurisdiction: form.jurisdiction,
            governing_law: form.governingLaw,
          })
          .select('id')
          .single()

        if (matterError) throw matterError
        matterId = newMatter.id
        setStatus('Matter created.')
      }

      // Step 3: Build fee structure
      const feeStructure =
        form.feeType === 'hourly'
          ? {
              managing_partner: Number(form.managingPartner),
              senior_partner: Number(form.seniorPartner),
              partner: Number(form.partner),
              senior_associate: Number(form.seniorAssociate),
              associate: Number(form.associate),
              junior_associate: Number(form.juniorAssociate),
              trainee: Number(form.trainee),
            }
          : { fixed_fee: Number(form.fixedFee.replace(/,/g, '')) }

      // Step 4: Create engagement letter draft
      setStatus('Creating engagement letter draft...')
      const { data: newLetter, error: letterError } = await supabase
        .from('engagement_letters')
        .insert({
          client_id: clientId,
          matter_id: matterId,
          status: 'draft',
          fee_structure: feeStructure,
          liability_cap: form.liabilityCap ? Number(form.liabilityCap.replace(/,/g, '')) : null,
          recipient_email: form.clientEmail,
        })
        .select('id')
        .single()

      if (letterError) throw letterError
      setLetterId(newLetter.id)

      // Step 5: Create tracking event
      await supabase.from('tracking_events').insert({
        letter_id: newLetter.id,
        event_type: 'created',
        metadata: { source: 'web_form' },
      })

      setSaving(false)
      setStatus('Data saved. Generating letter with AI...')

      // Step 6: Call n8n to generate the letter content
      await generateLetter({
        letterId: newLetter.id,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientAddress: form.clientAddress,
        contactPerson: form.contactPerson,
        country: form.country,
        matterTitle: form.matterTitle,
        matterType: form.matterType,
        matterDescription: form.matterDescription,
        jurisdiction: form.jurisdiction,
        governingLaw: form.governingLaw,
        feeStructure,
        feeType: form.feeType,
        liabilityCap: form.liabilityCap,
        specialTerms: form.specialTerms,
      })

      setDone(true)
      setStatus('Letter generated! Checking for Google Doc...')

      // Poll Supabase for the Google Doc ID
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        const { data } = await supabase
          .from('engagement_letters')
          .select('pdf_url')
          .eq('id', newLetter.id)
          .single()
        if (data?.pdf_url) {
          clearInterval(poll)
          setGoogleDocUrl(`https://docs.google.com/document/d/${data.pdf_url}/edit`)
          setStatus('Google Doc is ready!')
        }
        if (attempts >= 30) {
          clearInterval(poll)
          setStatus('Letter generated successfully!')
        }
      }, 2000)
    } catch (err) {
      console.error(err)
      setStatus('Error: ' + (err instanceof Error ? err.message : 'Something went wrong'))
    }
    setGenerating(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors mb-3"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </button>
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          New Engagement Letter
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details and let AI generate your letter
        </p>
      </div>

      <div className="gold-line opacity-30" />

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1">
            <button
              onClick={() => i <= step && !generating && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all w-full ${
                i === step
                  ? 'bg-gold/10 text-gold border border-gold/20'
                  : i < step
                  ? 'text-gold/60 hover:text-gold'
                  : 'text-muted-foreground/30'
              }`}
            >
              {i < step ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <s.icon className="w-3.5 h-3.5" />
              )}
              {s.label}
            </button>
            {i < steps.length - 1 && (
              <div className={`w-6 h-px mx-1 ${i < step ? 'bg-gold/40' : 'bg-gold/8'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-gold/8 bg-card/50">
        <CardContent className="p-6">
          {/* Step 0: Client */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s', animationFillMode: 'forwards' }}>
              {/* Toggle: New vs Existing Client */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => {
                    setUseExistingClient(false)
                    setSelectedClientId(null)
                    setForm((prev) => ({ ...prev, clientName: '', clientEmail: '', clientAddress: '', contactPerson: '', country: 'Greece' }))
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    !useExistingClient
                      ? 'bg-gold/10 text-gold border-gold/20'
                      : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                  }`}
                >
                  + New Client
                </button>
                <button
                  onClick={() => setUseExistingClient(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    useExistingClient
                      ? 'bg-gold/10 text-gold border-gold/20'
                      : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                  }`}
                >
                  Existing Client
                </button>
              </div>

              {/* Existing Client Dropdown */}
              {useExistingClient && (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Select Client
                  </Label>
                  <div className="relative">
                    <select
                      value={selectedClientId || ''}
                      onChange={(e) => selectExistingClient(e.target.value)}
                      className="w-full appearance-none bg-background/50 border border-gold/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-gold/30 focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose a client...</option>
                      {existingClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.email}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Client / Company Name *
                  </Label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => update('clientName', e.target.value)}
                    placeholder="Aegean Ventures Limited"
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Email *
                  </Label>
                  <Input
                    value={form.clientEmail}
                    onChange={(e) => update('clientEmail', e.target.value)}
                    placeholder="dimitris@aegeanventures.com"
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Address
                </Label>
                <Input
                  value={form.clientAddress}
                  onChange={(e) => update('clientAddress', e.target.value)}
                  placeholder="2847 Market Street, Suite 301, San Francisco, CA 94102"
                  className="bg-background/50 border-gold/10 focus:border-gold/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Contact Person
                  </Label>
                  <Input
                    value={form.contactPerson}
                    onChange={(e) => update('contactPerson', e.target.value)}
                    placeholder="Dimitris Konstantinou"
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Country
                  </Label>
                  <Input
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    placeholder="Greece"
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Matter */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s', animationFillMode: 'forwards' }}>
              {/* Toggle: New vs Existing Matter */}
              {selectedClientId && existingMatters.length > 0 && (
                <>
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => {
                        setUseExistingMatter(false)
                        setSelectedMatterId(null)
                        setForm((prev) => ({ ...prev, matterTitle: '', matterDescription: '', matterType: 'litigation', jurisdiction: 'Athens, Greece', governingLaw: 'Greek Law' }))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        !useExistingMatter
                          ? 'bg-gold/10 text-gold border-gold/20'
                          : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                      }`}
                    >
                      + New Matter
                    </button>
                    <button
                      onClick={() => setUseExistingMatter(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        useExistingMatter
                          ? 'bg-gold/10 text-gold border-gold/20'
                          : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                      }`}
                    >
                      Existing Matter
                    </button>
                  </div>

                  {useExistingMatter && (
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                        Select Matter
                      </Label>
                      <div className="relative">
                        <select
                          value={selectedMatterId || ''}
                          onChange={(e) => selectExistingMatter(e.target.value)}
                          className="w-full appearance-none bg-background/50 border border-gold/10 rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-gold/30 focus:outline-none cursor-pointer"
                        >
                          <option value="">Choose a matter...</option>
                          {existingMatters.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title} — {m.type}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Matter Title *
                </Label>
                <Input
                  value={form.matterTitle}
                  onChange={(e) => update('matterTitle', e.target.value)}
                  placeholder="Aegean Coastal Development Project"
                  className="bg-background/50 border-gold/10 focus:border-gold/30"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Matter Type *
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {matterTypes.map((mt) => (
                    <button
                      key={mt.value}
                      onClick={() => update('matterType', mt.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm border transition-all ${
                        form.matterType === mt.value
                          ? 'bg-gold/10 text-gold border-gold/20'
                          : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                      }`}
                    >
                      {mt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  value={form.matterDescription}
                  onChange={(e) => update('matterDescription', e.target.value)}
                  placeholder="Describe the legal matter, scope of work, and any specific requirements..."
                  className="bg-background/50 border-gold/10 focus:border-gold/30 min-h-[120px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Jurisdiction
                  </Label>
                  <Input
                    value={form.jurisdiction}
                    onChange={(e) => update('jurisdiction', e.target.value)}
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Governing Law
                  </Label>
                  <Input
                    value={form.governingLaw}
                    onChange={(e) => update('governingLaw', e.target.value)}
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Fees */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s', animationFillMode: 'forwards' }}>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Fee Structure
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => update('feeType', 'hourly')}
                    className={`px-4 py-3 rounded-lg text-sm border transition-all ${
                      form.feeType === 'hourly'
                        ? 'bg-gold/10 text-gold border-gold/20'
                        : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                    }`}
                  >
                    Hourly Rates
                  </button>
                  <button
                    onClick={() => update('feeType', 'fixed')}
                    className={`px-4 py-3 rounded-lg text-sm border transition-all ${
                      form.feeType === 'fixed'
                        ? 'bg-gold/10 text-gold border-gold/20'
                        : 'border-gold/8 text-muted-foreground hover:border-gold/20'
                    }`}
                  >
                    Fixed Fee
                  </button>
                </div>
              </div>

              {form.feeType === 'hourly' ? (
                <div className="space-y-3 p-4 rounded-lg border border-gold/8 bg-background/30">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                    Hourly Rate Schedule (EUR)
                  </p>
                  {[
                    { key: 'managingPartner', label: 'Managing Partner' },
                    { key: 'seniorPartner', label: 'Senior Partner' },
                    { key: 'partner', label: 'Partner' },
                    { key: 'seniorAssociate', label: 'Senior Associate' },
                    { key: 'associate', label: 'Associate' },
                    { key: 'juniorAssociate', label: 'Junior Associate' },
                    { key: 'trainee', label: 'Trainee' },
                  ].map((r) => (
                    <div key={r.key} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground/50">€</span>
                        <Input
                          value={form[r.key as keyof typeof form]}
                          onChange={(e) => update(r.key, e.target.value)}
                          className="w-24 bg-background/50 border-gold/10 focus:border-gold/30 text-right text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                    Fixed Fee Amount (EUR)
                  </Label>
                  <Input
                    value={form.fixedFee}
                    onChange={(e) => update('fixedFee', e.target.value)}
                    placeholder="30,000"
                    className="bg-background/50 border-gold/10 focus:border-gold/30"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Liability Cap (EUR, optional)
                </Label>
                <Input
                  value={form.liabilityCap}
                  onChange={(e) => update('liabilityCap', e.target.value)}
                  placeholder="1,230,000"
                  className="bg-background/50 border-gold/10 focus:border-gold/30"
                />
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in-up" style={{ opacity: 0, animationDelay: '0s', animationFillMode: 'forwards' }}>
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Additional Terms or Instructions
                </Label>
                <Textarea
                  value={form.specialTerms}
                  onChange={(e) => update('specialTerms', e.target.value)}
                  placeholder="Any special clauses, conditions, or instructions for the AI..."
                  className="bg-background/50 border-gold/10 focus:border-gold/30 min-h-[80px]"
                />
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg border border-gold/8 bg-background/30 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-gold mb-3">Summary</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client:</span>{' '}
                    <span>{form.clientName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    <span>{form.clientEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Matter:</span>{' '}
                    <span>{form.matterTitle || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>{' '}
                    <span className="capitalize">{form.matterType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Jurisdiction:</span>{' '}
                    <span>{form.jurisdiction}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fee:</span>{' '}
                    <span>
                      {form.feeType === 'hourly' ? 'Hourly rates' : `Fixed €${form.fixedFee}`}
                    </span>
                  </div>
                  {form.liabilityCap && (
                    <div>
                      <span className="text-muted-foreground">Liability Cap:</span>{' '}
                      <span>€{form.liabilityCap}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress indicator during generation */}
              {generating && (
                <div className="p-4 rounded-lg border border-gold/15 bg-gold/[0.03] space-y-3">
                  <div className="flex items-center gap-3">
                    {saving ? (
                      <Database className="w-4 h-4 text-gold animate-pulse" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-gold animate-pulse" />
                    )}
                    <span className="text-sm text-gold">{status}</span>
                  </div>
                  <div className="h-1 bg-gold/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold/40 rounded-full transition-all duration-1000"
                      style={{
                        width: saving ? '30%' : '70%',
                        animation: 'pulse 2s ease-in-out infinite',
                      }}
                    />
                  </div>
                </div>
              )}

              {!done && !generating && (
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !form.clientName || !form.matterTitle}
                  className="w-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 h-12"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save & Generate Engagement Letter
                </Button>
              )}

              {done && !generating && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">
                        Letter Generated & Saved
                      </span>
                    </div>
                  </div>

                  {googleDocUrl ? (
                    <a
                      href={googleDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg text-sm hover:bg-blue-500/20 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Your Google Doc is ready — open it
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gold/10 bg-gold/[0.03]">
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                      <span className="text-sm text-muted-foreground">Waiting for Google Doc...</span>
                    </div>
                  )}

                  {/* Send Email Button */}
                  {googleDocUrl && !sent && (
                    <Button
                      onClick={handleSendEmail}
                      disabled={sending || !form.clientEmail}
                      className="w-full bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 h-12"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {sending ? 'Sending...' : `Send to ${form.clientEmail}`}
                    </Button>
                  )}

                  {sent && (
                    <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400 font-medium">
                          Email sent to {form.clientEmail}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {letterId && (
                      <Button
                        onClick={() => router.push(`/letters/${letterId}`)}
                        className="flex-1 bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Letter
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push('/letters')}
                      variant="outline"
                      className="flex-1 border-gold/10 text-muted-foreground hover:text-foreground"
                    >
                      All Letters
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {!done && !generating && (
            <div className="flex justify-between mt-8 pt-4 border-t border-gold/8">
              <Button
                variant="ghost"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              {step < 3 && (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
