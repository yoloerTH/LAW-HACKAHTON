'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Phone, PhoneOff, Bot, User, Volume2 } from 'lucide-react'

const VOICE_BACKEND_URL = 'https://law-voice-production.up.railway.app'

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function VoicePage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [status, setStatus] = useState('Ready to connect')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [aiSpeaking, setAiSpeaking] = useState(false)

  const socketRef = useRef<Socket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, currentTranscript])

  // Play audio from queue sequentially
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return

    isPlayingRef.current = true
    setAiSpeaking(true)

    const base64Audio = audioQueueRef.current.shift()!
    try {
      const audioData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))
      const audioContext = new AudioContext({ sampleRate: 44100 })
      const audioBuffer = await audioContext.decodeAudioData(audioData.buffer)
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(audioContext.destination)
      source.onended = () => {
        isPlayingRef.current = false
        setAiSpeaking(false)
        playNextAudio()
      }
      source.start(0)
    } catch (error) {
      console.error('Audio playback error:', error)
      isPlayingRef.current = false
      setAiSpeaking(false)
      playNextAudio()
    }
  }, [])

  // Start voice call
  async function startCall() {
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      })
      mediaStreamRef.current = stream

      // Connect to voice backend
      const socket = io(VOICE_BACKEND_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 10000
      })
      socketRef.current = socket

      socket.on('connect', () => {
        console.log('Connected to voice backend')
        setIsConnected(true)
        setStatus('Connected')
        socket.emit('call-start')
      })

      socket.on('status', (msg: string) => {
        setStatus(msg)
      })

      socket.on('transcript', ({ text }: { text: string }) => {
        setCurrentTranscript('')
        setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }])
      })

      socket.on('ai-response', ({ text, isUserMessage }: { text: string; partial?: boolean; isUserMessage?: boolean }) => {
        if (isUserMessage) return
        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last && last.role === 'assistant' && (Date.now() - last.timestamp.getTime()) < 5000) {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...last,
              content: last.content + ' ' + text
            }
            return updated
          }
          return [...prev, { role: 'assistant', content: text, timestamp: new Date() }]
        })
      })

      socket.on('audio-response', (base64Audio: string) => {
        audioQueueRef.current.push(base64Audio)
        playNextAudio()
      })

      socket.on('barge-in', () => {
        audioQueueRef.current = []
        isPlayingRef.current = false
        setAiSpeaking(false)
      })

      socket.on('error', ({ message }: { message: string }) => {
        console.error('Socket error:', message)
        setStatus('Error: ' + message)
      })

      socket.on('disconnect', () => {
        setIsConnected(false)
        setStatus('Disconnected')
      })

      // Set up audio processing
      const audioContext = new AudioContext({ sampleRate: 16000 })
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      processorRef.current = processor

      processor.onaudioprocess = (e) => {
        if (isMuted || !socket.connected) return

        const inputData = e.inputBuffer.getChannelData(0)
        const pcmData = new Int16Array(inputData.length)
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, Math.floor(inputData[i] * 32768)))
        }

        const uint8Array = new Uint8Array(pcmData.buffer)
        let binary = ''
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i])
        }
        const base64 = btoa(binary)
        socket.emit('audio-stream', base64)
      }

      source.connect(processor)
      processor.connect(audioContext.destination)

      setIsCallActive(true)
      setStatus('Connecting...')

    } catch (error) {
      console.error('Failed to start call:', error)
      setStatus('Failed to access microphone')
    }
  }

  // End voice call
  function endCall() {
    if (socketRef.current) {
      socketRef.current.emit('call-end')
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    audioQueueRef.current = []
    isPlayingRef.current = false

    setIsCallActive(false)
    setIsConnected(false)
    setAiSpeaking(false)
    setStatus('Call ended')
    setCurrentTranscript('')
  }

  // Toggle mute
  function toggleMute() {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-4">
        <h1
          className="text-3xl font-light tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Voice Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Talk to LexFlow — create letters, check statuses, manage clients by voice
        </p>
      </div>

      <div className="gold-line opacity-30 mb-4" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Conversation Log */}
        <Card className="flex-1 border-gold/8 bg-card/50 overflow-hidden flex flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && !isCallActive ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gold/10 border-2 border-gold/20 flex items-center justify-center mb-6">
                  <Mic className="w-8 h-8 text-gold" />
                </div>
                <h2
                  className="text-xl font-light text-foreground/80 mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Voice-Powered Legal Assistant
                </h2>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                  Press the call button to start talking. Ask me to create engagement letters,
                  check letter statuses, look up clients, and more.
                </p>
                <div className="flex flex-wrap gap-2 max-w-lg justify-center text-xs text-muted-foreground/60">
                  <span className="px-3 py-1.5 rounded-full border border-gold/10">&quot;Create a letter for Aegean Ventures&quot;</span>
                  <span className="px-3 py-1.5 rounded-full border border-gold/10">&quot;How many unsigned letters?&quot;</span>
                  <span className="px-3 py-1.5 rounded-full border border-gold/10">&quot;Send the Meridian letter&quot;</span>
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
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-gold/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Live transcript */}
            {currentTranscript && (
              <div className="flex gap-3 justify-end">
                <div className="max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-gold/5 text-foreground/50 border border-gold/10 rounded-br-md italic">
                  {currentTranscript}...
                </div>
                <div className="w-8 h-8 rounded-lg bg-secondary border border-gold/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Controls */}
        <Card className="border-gold/8 bg-card/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  isCallActive
                    ? aiSpeaking
                      ? 'bg-blue-400 animate-pulse'
                      : 'bg-emerald-400 animate-pulse'
                    : 'bg-muted-foreground/30'
                }`} />
                <div>
                  <p className="text-sm font-medium">
                    {isCallActive ? (aiSpeaking ? 'AI Speaking' : status) : status}
                  </p>
                  {isCallActive && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {aiSpeaking ? 'Listening for interruption...' : 'Listening...'}
                    </p>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3">
                {isCallActive && (
                  <Button
                    onClick={toggleMute}
                    variant="outline"
                    size="icon"
                    className={`rounded-full w-12 h-12 ${
                      isMuted
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        : 'border-gold/20 text-gold hover:bg-gold/10'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </Button>
                )}

                <Button
                  onClick={isCallActive ? endCall : startCall}
                  size="icon"
                  className={`rounded-full w-14 h-14 transition-all ${
                    isCallActive
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gold hover:bg-gold-dark text-[#070b14]'
                  }`}
                >
                  {isCallActive ? (
                    <PhoneOff className="w-6 h-6" />
                  ) : (
                    <Phone className="w-6 h-6" />
                  )}
                </Button>
              </div>
            </div>

            {/* Audio Visualizer */}
            {isCallActive && (
              <div className="mt-4 flex items-center justify-center gap-1 h-8">
                {aiSpeaking ? (
                  // AI speaking animation
                  <>
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-blue-400/60 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 24 + 8}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.6s'
                        }}
                      />
                    ))}
                  </>
                ) : (
                  // Listening animation
                  <>
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-gold/30 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 12 + 4}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '1s'
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
