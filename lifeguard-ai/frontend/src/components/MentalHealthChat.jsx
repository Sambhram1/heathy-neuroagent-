import { useState, useRef, useEffect, useCallback } from 'react'

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
        <div className="w-7 h-7 rounded-full border border-[rgba(235,72,153,0.3)] flex items-center justify-center mr-3 flex-shrink-0 bg-[rgba(235,72,153,0.05)]">
          <span className="w-2 h-2 rounded-full bg-[#eb4899]" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
        </div>
      )}
      <div
        className={`max-w-[85%] px-5 py-3.5 text-xs leading-relaxed rounded-2xl ${
          isUser
            ? 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-text-primary font-mono'
            : 'text-text-muted border-l-2 border-[rgba(235,72,153,0.25)] pl-4 rounded-l-none'
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
      <div className="w-7 h-7 rounded-full border border-[rgba(235,72,153,0.3)] flex items-center justify-center mr-3 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-[#eb4899] opacity-50 animate-pulse" />
      </div>
      <div className="px-4 py-3 flex items-center gap-2 border-l-2 border-[rgba(235,72,153,0.2)]">
        {[0, 150, 300].map((delay) => (
          <div
            key={delay}
            className="w-1.5 h-1.5 bg-[#eb4899] rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function MentalHealthChat({ sessionId }) {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [crisis, setCrisis] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/mental-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          session_id: sessionId,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
      if (data.crisis_detected) setCrisis(true)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection issue. Please try again in a moment.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, loading, messages, sessionId])

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Crisis banner */}
      {crisis && (
        <div className="flex-shrink-0 mx-4 mt-4 p-4 rounded-xl border border-accent-500/30 bg-[rgba(255,59,48,0.04)] animate-fade-in">
          <p className="text-[10px] font-mono uppercase tracking-widest text-accent-500 mb-1">Crisis Support Available</p>
          <p className="text-[11px] text-text-muted leading-relaxed">
            <strong className="text-text-primary">iCall (TISS):</strong> 9152987821 · Mon–Sat 8am–10pm &nbsp;|&nbsp;
            <strong className="text-text-primary">Vandrevala:</strong> 1860-2662-345 · 24/7 Free
          </p>
        </div>
      )}

      {/* Always-visible helpline bar */}
      <div className="flex-shrink-0 px-4 py-2 mt-2 flex items-center gap-3 border-b border-[rgba(255,255,255,0.04)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#eb4899] opacity-50" />
        <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">
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
        <div className="flex gap-2 items-end p-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-xl focus-within:border-[rgba(235,72,153,0.3)] transition-all">
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
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-[rgba(235,72,153,0.1)] border border-[rgba(235,72,153,0.2)] hover:bg-[rgba(235,72,153,0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[#eb4899]"
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.00432 0.627577 1.16641C0.482813 1.3285 0.458494 1.56543 0.567086 1.75471L3.92482 7.5L0.567086 13.2453C0.458494 13.4346 0.482813 13.6715 0.627577 13.8336C0.772341 13.9957 1.00481 14.045 1.20308 13.9569L14.7031 7.95688C14.8836 7.87668 15 7.69762 15 7.5C15 7.30238 14.8836 7.12332 14.7031 7.04312L1.20308 1.04312Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <p className="text-[9px] text-text-muted/40 font-mono uppercase tracking-widest text-center mt-2">
          Not a substitute for professional mental health care
        </p>
      </div>
    </div>
  )
}
