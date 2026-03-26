import { useState, useRef, useEffect, useCallback } from 'react'
import { apiUrl } from '../lib/apiBase'

const WELCOME = {
  role: 'assistant',
  content: "Hello, I'm NeuroTrace — your mental health companion within LifeGuard AI.\n\nThis is a safe, private space. You can talk about how you're feeling, what's been on your mind, or anything weighing on you.\n\nWhat's been going on for you lately?",
}

function formatMsg(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>')
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full border border-[rgba(158,158,158,0.3)] flex items-center justify-center mr-3 flex-shrink-0 bg-[rgba(158,158,158,0.05)]">
          <span className="w-2 h-2 rounded-full bg-[#9E9E9E]" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
        </div>
      )}
      <div
        className={`max-w-[85%] px-5 py-3.5 text-xs leading-relaxed rounded-2xl ${
          isUser
            ? 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-text-primary font-mono'
            : 'text-text-muted border-l-2 border-[rgba(158,158,158,0.25)] pl-4 rounded-l-none'
        }`}
      >
        <div dangerouslySetInnerHTML={{ __html: `<p>${formatMsg(msg.content)}</p>` }} className="tracking-wide" />
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full border border-[rgba(158,158,158,0.3)] flex items-center justify-center mr-3 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#9E9E9E] opacity-50 animate-pulse" />
      </div>
      <div className="px-4 py-3 flex items-center gap-2 border-l-2 border-[rgba(158,158,158,0.2)]">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 bg-[#9E9E9E] rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function MentalHealthChat({ sessionId, userProfile, reportContext }) {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [crisis, setCrisis] = useState(false)
  const [voiceLive, setVoiceLive] = useState(false)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)
  const speechRetryRef = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (audioRef.current) {
        try {
          audioRef.current.pause()
          audioRef.current.src = ''
        } catch {}
      }
    }
  }, [])

  const speakWithFish = useCallback(async (text) => {
    if (!voiceLive || !text?.trim()) return
    setVoiceError('')
    setVoiceLoading(true)
    try {
      const res = await fetch(apiUrl('/api/voice/fish-tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, format: 'mp3' }),
      })
      if (!res.ok) {
        if (res.status === 502 || res.status === 402) {
          throw new Error('Fish Audio API out of credits (402) or unavailable.');
        }
        let detail = ''
        try {
          const data = await res.json()
          detail = data?.detail || ''
        } catch {}
        throw new Error(detail || `HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (!audioRef.current) audioRef.current = new Audio()
      audioRef.current.pause()
      audioRef.current.src = url
      await audioRef.current.play()
      audioRef.current.onended = () => URL.revokeObjectURL(url)
    } catch (e) {
      console.warn('Fish Audio failed, falling back to browser TTS:', e.message)
      setVoiceError(`Using offline voice. (Fish API error: ${e.message})`)
      
      // Fallback to browser's native SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text.substring(0, 200)) // text limits
        window.speechSynthesis.speak(utterance)
      } else {
        setVoiceError(`Voice unavailable: ${e.message}`)
      }
    } finally {
      setVoiceLoading(false)
    }
  }, [voiceLive])

  const startListening = useCallback((langOverride) => {
    setVoiceError('')
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition not supported in this browser.')
      return
    }

    if (!window.isSecureContext) {
      setVoiceError('Microphone requires HTTPS secure context.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone API not available in this browser.')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = langOverride || navigator.language || 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onend = () => {
      setListening(false)
      speechRetryRef.current = false
    }
    rec.onerror = (event) => {
      const reason = event?.error || 'unknown'
      const msgMap = {
        'not-allowed': 'Mic permission denied. Allow microphone access and retry.',
        'service-not-allowed': 'Mic service is blocked by browser settings.',
        'audio-capture': 'No microphone detected. Connect a mic and retry.',
        'no-speech': 'No speech detected. Speak clearly and try again.',
        'network': 'Browser speech service is unavailable right now. Retrying once...',
        'aborted': 'Voice capture was interrupted. Please retry.',
      }
      setListening(false)
      if (reason === 'network' && !speechRetryRef.current) {
        speechRetryRef.current = true
        setVoiceError(msgMap[reason])
        setTimeout(() => startListening('en-US'), 350)
        return
      }
      setVoiceError(
        reason === 'network'
          ? 'Speech recognition is currently unavailable in this browser session. Try Chrome, disable strict privacy extensions, or continue by typing.'
          : (msgMap[reason] || `Could not capture voice (${reason}). Please try again.`)
      )
    }
    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() || ''
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognitionRef.current = rec

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop())
        rec.start()
      })
      .catch((err) => {
        const denied = err?.name === 'NotAllowedError' || err?.name === 'SecurityError'
        setVoiceError(denied ? 'Mic permission denied. Allow microphone access and retry.' : `Microphone unavailable: ${err?.name || 'unknown error'}`)
      })
  }, [])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      // Prepend profile context to first user message if available
      let apiMessages = history.map((m) => ({ role: m.role, content: m.content }))
      if (userProfile || reportContext) {
        const ctxParts = []
        if (userProfile) ctxParts.push(`User profile: Age ${userProfile.age}, ${userProfile.sex}, stress ${userProfile.stress_level}/10, sleep ${userProfile.sleep_hours}h (${userProfile.sleep_quality}).`)
        if (reportContext) ctxParts.push(`Uploaded report: "${reportContext.filename}". ${reportContext.notes || ''}`)
        if (ctxParts.length > 0) {
          apiMessages = [{ role: 'user', content: `[CONTEXT] ${ctxParts.join(' ')}` }, { role: 'assistant', content: 'Context received.' }, ...apiMessages.slice(1)]
        }
      }
      const res = await fetch(apiUrl('/api/mental-chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, session_id: sessionId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      if (voiceLive) {
        await speakWithFish(data.message)
      }
      if (data.crisis_detected) setCrisis(true)
    } catch (err) {
      const detail = err?.message ? ` (${err.message})` : ''
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Connection issue. Please try again in a moment${detail}.` },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, sessionId, userProfile, reportContext, voiceLive, speakWithFish])

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Voice therapist controls */}
      <div className="flex-shrink-0 px-4 pt-3">
        <div className="glass-card p-3 border border-[rgba(255,255,255,0.08)] flex items-center gap-2 justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#9E9E9E]">Fish Voice Therapist</p>
            <p className="text-[11px] text-text-muted">Live voice in this side section</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startListening}
              className="text-[11px] px-2.5 py-1 rounded border border-[rgba(158,158,158,0.25)] text-[#9E9E9E] hover:bg-[rgba(158,158,158,0.12)]"
              title="Speak with microphone"
            >
              {listening ? 'Listening...' : 'Mic'}
            </button>
            <button
              type="button"
              onClick={() => setVoiceLive((v) => !v)}
              className={`text-[11px] px-2.5 py-1 rounded border font-mono uppercase tracking-widest ${voiceLive ? 'border-[#22c55e]/50 text-[#22c55e] bg-[#22c55e]/10' : 'border-[rgba(255,255,255,0.15)] text-text-muted'}`}
            >
              {voiceLive ? 'Live On' : 'Live Off'}
            </button>
          </div>
        </div>
        {(voiceLoading || voiceError) && (
          <div className="mt-2 text-[11px] font-mono">
            {voiceLoading && <p className="text-[#9E9E9E]">Generating Fish voice...</p>}
            {voiceError && <p className="text-accent-500">{voiceError}</p>}
          </div>
        )}
      </div>

      {/* Crisis banner */}
      {crisis && (
        <div className="flex-shrink-0 mx-4 mt-4 p-4 rounded-xl border border-accent-500/30 bg-[rgba(229,229,229,0.04)] animate-fade-in">
          <p className="text-[11px] font-mono uppercase tracking-widest text-accent-500 mb-1">Crisis Support Available</p>
          <p className="text-[12px] text-text-muted leading-relaxed">
            <strong className="text-text-primary">iCall (TISS):</strong> 9152987821 · Mon–Sat 8am–10pm &nbsp;|&nbsp;
            <strong className="text-text-primary">Vandrevala:</strong> 1860-2662-345 · 24/7 Free
          </p>
        </div>
      )}

      {/* Always-visible helpline bar */}
      <div className="flex-shrink-0 px-4 py-2 mt-2 flex items-center gap-3 border-b border-[rgba(255,255,255,0.04)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9E9E9E] opacity-50" />
        <p className="text-[11px] font-mono uppercase tracking-widest text-text-muted/50">
          iCall: 9152987821 &nbsp;·&nbsp; Vandrevala 24/7: 1860-2662-345
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide">
        {messages.map((m, i) => (
          <Bubble key={i} msg={m} />
        ))}
        {loading && <Typing />}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end p-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl focus-within:border-[rgba(158,158,158,0.3)] transition-all">
          <textarea
            ref={inputRef}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-xs font-mono tracking-wide text-text-primary min-h-[40px] max-h-[100px] focus:outline-none placeholder:text-text-muted/40"
            placeholder="Share what's on your mind…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            disabled={loading}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(158,158,158,0.1)] border border-[rgba(158,158,158,0.2)] hover:bg-[rgba(158,158,158,0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#9E9E9E]"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.00432 0.627577 1.16641C0.482813 1.3285 0.458494 1.56543 0.567086 1.75471L3.92482 7.5L0.567086 13.2453C0.458494 13.4346 0.482813 13.6715 0.627577 13.8336C0.772341 13.9957 1.00481 14.045 1.20308 13.9569L14.7031 7.95688C14.8836 7.87668 15 7.69762 15 7.5C15 7.30238 14.8836 7.12332 14.7031 7.04312L1.20308 1.04312Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-text-muted/40 font-mono uppercase tracking-widest text-center mt-2">
          Not a substitute for professional mental health care
        </p>
      </div>
    </div>
  )
}
