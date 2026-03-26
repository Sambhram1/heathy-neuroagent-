import { useState, useRef, useEffect, useCallback } from 'react'

const WELCOME_MSG = {
  role: 'assistant',
  content: "Initiating Neurotrace Diagnostics — your cognitive health and somatic risk analyzer.\n\nTo establish a baseline, please provide your current chronological **age**.",
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up group`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full border border-accent-500/30 flex items-center justify-center mr-3 flex-shrink-0 relative overflow-hidden bg-[rgba(255,255,255,0.02)]">
          <div className="w-1.5 h-1.5 bg-accent-500 rounded-full glow-anim" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-5 py-3.5 text-xs leading-relaxed font-mono ${
          isUser 
            ? 'glass-card text-text-primary ml-4' 
            : 'border-l border-accent-500/20 text-text-muted pl-4'
        }`}
        style={isUser ? { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' } : {}}
      >
        <div dangerouslySetInnerHTML={{ __html: `<p>${formatMessage(msg.content)}</p>` }} className="tracking-wide" />
      </div>
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center ml-3 flex-shrink-0">
          <span className="w-1 h-3 border-l-2 border-[rgba(255,255,255,0.3)] block transform rotate-45" />
        </div>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-6 h-6 rounded-full border border-accent-500/30 flex items-center justify-center mr-3 flex-shrink-0">
         <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse opacity-50" />
      </div>
      <div className="px-4 py-3 flex items-center gap-2 border-l border-accent-500/20">
        <div className="w-1 h-1 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-1 h-1 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-1 h-1 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}

export default function ChatInterface({ sessionId, onAgentResponse, planReady, onViewPlan }) {
  const [messages, setMessages] = useState([WELCOME_MSG])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          session_id: sessionId,
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      onAgentResponse(data)
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Connection sequence failed. Verify Neural API bridge (port 8000). Error Code: ${err.message}`,
        },
      ])
    } finally {
      setIsLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [input, isLoading, messages, sessionId, onAgentResponse])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-[rgba(11,11,11,0.5)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] backdrop-blur-md">
        <p className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-accent-500 rounded-full glow-anim opacity-75"></span>
          DIAGNOSTIC CORE // <span className="text-text-primary">{sessionId.slice(0, 8).toUpperCase()}</span>
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Plan ready banner */}
      {planReady && (
        <div className="flex-shrink-0 mx-6 mb-4 p-4 rounded-xl glass-card border-accent-500/30 flex items-center justify-between animate-fade-in bg-accent-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 blur-[40px] pointer-events-none rounded-full" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 glow-anim" />
            <span className="text-xs text-text-primary font-mono tracking-widest uppercase">Report Synthesized</span>
          </div>
          <button
            onClick={onViewPlan}
            className="relative z-10 text-[10px] px-4 py-2 rounded border border-accent-500/50 bg-accent-500/10 text-accent-500 font-mono tracking-widest uppercase hover:bg-accent-500 hover:text-[#0B0B0B] transition-all"
          >
            Access Data
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2">
        <div className="flex gap-3 items-end p-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl focus-within:border-[rgba(255,255,255,0.2)] focus-within:bg-[rgba(255,255,255,0.03)] transition-all">
          <textarea
            ref={inputRef}
            className="flex-1 resize-none bg-transparent px-3 py-2 text-xs font-mono tracking-wide text-text-primary min-h-[40px] max-h-[120px] focus:outline-none placeholder:text-text-muted/40"
            placeholder="INPUT RESPONSE..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded border border-[rgba(255,255,255,0.1)] flex items-center justify-center bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-primary"
          >
             <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.20308 1.04312C1.00481 0.954998 0.772341 1.00432 0.627577 1.16641C0.482813 1.3285 0.458494 1.56543 0.567086 1.75471L3.92482 7.5L0.567086 13.2453C0.458494 13.4346 0.482813 13.6715 0.627577 13.8336C0.772341 13.9957 1.00481 14.045 1.20308 13.9569L14.7031 7.95688C14.8836 7.87668 15 7.69762 15 7.5C15 7.30238 14.8836 7.12332 14.7031 7.04312L1.20308 1.04312ZM4.84553 7.15H10.5V7.85H4.84553L2.17343 12.4939L13.597 7.5L2.17343 2.50611L4.84553 7.15Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        <div className="flex justify-between items-center mt-3 px-2">
            <p className="text-[9px] text-text-muted/40 font-mono uppercase tracking-widest">
              END-TO-END SECURED
            </p>
            <p className="text-[9px] text-text-muted font-mono uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-1 h-1 bg-accent-500 rounded-full opacity-50"></span>
              SYS.ACTIVE
            </p>
        </div>
      </div>
    </div>
  )
}
