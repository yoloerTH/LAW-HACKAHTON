'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendToAgent } from '@/lib/n8n'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

export default function NewLetterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const [form, setForm] = useState({
    // Client
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    contactPerson: '',
    country: 'Greece',
    // Matter
    matterTitle: '',
    matterType: 'litigation',
    matterDescription: '',
    jurisdiction: 'Athens, Greece',
    governingLaw: 'Greek Law',
    // Fees
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
    // Extra
    specialTerms: '',
  })

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate() {
    setGenerating(true)
    try {
      const feeInfo =
        form.feeType === 'hourly'
          ? `Hourly rates: Managing Partner €${form.managingPartner}, Senior Partner €${form.seniorPartner}, Partner €${form.partner}, Senior Associate €${form.seniorAssociate}, Associate €${form.associate}, Junior Associate €${form.juniorAssociate}, Trainee €${form.trainee}`
          : `Fixed fee: €${form.fixedFee}`

      const message = `Create a new engagement letter with the following details:
Client: ${form.clientName}, email: ${form.clientEmail}, address: ${form.clientAddress}, contact person: ${form.contactPerson}, country: ${form.country}.
Matter: ${form.matterTitle}, type: ${form.matterType}, description: ${form.matterDescription}, jurisdiction: ${form.jurisdiction}, governing law: ${form.governingLaw}.
Fee structure: ${feeInfo}.
${form.liabilityCap ? `Liability cap: €${form.liabilityCap}.` : ''}
${form.specialTerms ? `Special terms: ${form.specialTerms}` : ''}
Please create the client, matter, and engagement letter in the database and generate the full letter content.`

      const response = await sendToAgent(message)
      setResult(response)
    } catch (err) {
      setResult('Error generating letter. Please try again.')
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
              onClick={() => i <= step && setStep(i)}
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
                </div>
              </div>

              {!result ? (
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !form.clientName || !form.matterTitle}
                  className="w-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 h-12"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Engagement Letter
                    </>
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">Letter Generated</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result}</p>
                  </div>
                  <Button
                    onClick={() => router.push('/letters')}
                    className="w-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20"
                  >
                    View All Letters
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {!result && (
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
