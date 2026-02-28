'use client'

import { useState, useRef, useEffect } from 'react'
import { sendToAgent } from '@/lib/n8n'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  'Show me all unsigned letters',
  'Create a new client named Meridian Corp with email info@meridian.gr',
  'How many letters were sent this month?',
  'Send a reminder for all overdue letters',
  'What is the status of the latest engagement letter?',
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(text?: string) {
    const message = text || input.trim()
    if (!message || loading) return

    setInput('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: message, timestamp: new Date() },
    ])
    setLoading(true)

    try {
      const response = await sendToAgent(message)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response, timestamp: new Date() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request. Please try again.',
          timestamp: new Date(),
        },
      ])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          AI Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Chat with the agent to manage clients, letters, and emails
        </p>
      </div>

      <div className="gold-line opacity-30 mb-4" />

      {/* Messages */}
      <Card className="flex-1 border-gold/8 bg-card/50 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
              <h2
                className="text-xl font-light text-foreground/80 mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                How can I help you?
              </h2>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                I can create clients, generate engagement letters, send emails,
                check statuses, and more.
              </p>
              <div className="flex flex-wrap gap-2 max-w-lg justify-center">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="px-3 py-1.5 text-xs rounded-full border border-gold/15 text-muted-foreground hover:text-gold hover:border-gold/30 transition-all bg-background/30"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-gold" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gold/10 text-foreground border border-gold/15 rounded-br-md'
                      : 'bg-secondary/50 text-foreground/90 border border-gold/5 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                    {msg.timestamp.toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-secondary border border-gold/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-gold" />
              </div>
              <div className="bg-secondary/50 border border-gold/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-gold/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gold/8">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI agent anything..."
              className="bg-background/50 border-gold/10 focus:border-gold/30"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-gold/10 text-gold border border-gold/20 hover:bg-gold/20 px-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
