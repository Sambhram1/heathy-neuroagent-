import { useState, useCallback, useRef, useEffect } from 'react'
import ChatInterface from '../components/ChatInterface'
import RiskDashboard from '../components/RiskDashboard'
import MentalHealthPanel from '../components/MentalHealthPanel'
import PreventionPlan from '../components/PreventionPlan'
import DiagnosisUpload from '../components/DiagnosisUpload'
import ExerciseVideos from '../components/ExerciseVideos'
import DietPlan from '../components/DietPlan'
import MentalHealthChat from '../components/MentalHealthChat'
import { clearSession } from '../lib/firestore'

const NAV = [
  { id: 'assessment', label: 'Assessment', num: '01', desc: 'Diagnostic AI' },
  { id: 'risk', label: 'Risk Dashboard', num: '02', desc: 'Biometric scores' },
  { id: 'diagnosis', label: 'Upload Report', num: '03', desc: 'Optional upload' },
  { id: 'exercise', label: 'Exercise', num: '04', desc: 'Video protocols' },
  { id: 'diet', label: 'Diet Plan', num: '05', desc: 'Nutrition guide' },
  { id: 'mental', label: 'Mental Health', num: '06', desc: 'Support chat' },
]

const PANEL_TITLES = {
  assessment: ['/ DIAGNOSTIC CORE', 'Health Assessment'],
  risk: ['/ BIOMETRIC RISK', 'Risk Dashboard'],
  diagnosis: ['/ CLINICAL DATA', 'Diagnosis Upload'],
  exercise: ['/ MOVEMENT PROTOCOL', 'Exercise Videos'],
  diet: ['/ NUTRITIONAL PROTOCOL', 'Diet Plan'],
  mental: ['/ COGNITIVE SUPPORT', 'Mental Health'],
}

export default function MainApp({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('assessment')
  const [riskScores, setRiskScores] = useState(null)
  const [amplifiers, setAmplifiers] = useState([])
  const [evidence, setEvidence] = useState([])
  const [planReady, setPlanReady] = useState(false)
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [startingFresh, setStartingFresh] = useState(false)
  const avatarRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleStartFresh = async () => {
    if (!window.confirm('Start a fresh session? This will clear all chat messages.')) return
    setStartingFresh(true)
    try {
      await clearSession(user.uid)
      setRiskScores(null)
      setAmplifiers([])
      setEvidence([])
      setPlanReady(false)
      setSessionId(crypto.randomUUID())
      setActiveNav('assessment')
    } catch (err) {
      console.error('Failed to clear session:', err)
    } finally {
      setStartingFresh(false)
    }
  }

  const handleAgentResponse = useCallback((response) => {
    if (response.risk_scores) setRiskScores(response.risk_scores)
    if (response.amplifiers?.length) setAmplifiers(response.amplifiers)
    if (response.evidence?.length) {
      setEvidence((prev) => {
        const existing = new Set(prev.map((e) => e.text))
        return [...prev, ...response.evidence.filter((e) => !existing.has(e.text))]
      })
    }
    if (response.plan_ready) setPlanReady(true)
  }, [])

  const [subtitle, title] = PANEL_TITLES[activeNav] || ['', '']

  const isAssessment = activeNav === 'assessment'
  const isMental = activeNav === 'mental'

  return (
    <div className="h-screen w-screen flex bg-background text-text-primary overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-[240px] flex flex-col border-r border-[rgba(255,255,255,0.06)] bg-[rgba(11,11,11,0.97)] backdrop-blur-xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex items-center justify-center flex-shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] block glow-anim" />
          </div>
          <div>
            <p className="text-sm font-medium tracking-wide text-text-primary leading-none">
              LifeGuard<span className="text-text-muted font-light">AI</span>
            </p>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50 mt-1">Health Intelligence</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveNav(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all relative group ${
                activeNav === item.id
                  ? 'bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.2)]'
                  : 'hover:bg-[rgba(255,255,255,0.03)] border border-transparent'
              }`}
            >
              {activeNav === item.id && (
                <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-accent-500 rounded-full" />
              )}
              <span
                className={`text-[9px] font-mono tracking-widest flex-shrink-0 w-6 ${
                  activeNav === item.id ? 'text-accent-500' : 'text-text-muted/50'
                }`}
              >
                {item.num}
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-medium tracking-wide truncate ${
                  activeNav === item.id ? 'text-text-primary' : 'text-text-muted group-hover:text-text-primary'
                }`}>
                  {item.label}
                </p>
                <p className="text-[9px] text-text-muted/40 tracking-wide font-mono">{item.desc}</p>
              </div>
              {item.id === 'assessment' && planReady && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-500 glow-anim flex-shrink-0" />
              )}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 pt-3 border-t border-[rgba(255,255,255,0.06)] space-y-2">
          {/* Start Fresh */}
          <button
            onClick={handleStartFresh}
            disabled={startingFresh}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl
              border border-[rgba(255,255,255,0.06)] text-[10px] font-mono uppercase tracking-widest
              text-text-muted/50 hover:text-accent-500 hover:border-accent-500/30
              disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {startingFresh ? (
              <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
              </svg>
            )}
            Start Fresh
          </button>

          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-medium text-accent-500">
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-primary font-medium truncate">{user?.displayName || 'User'}</p>
              <p className="text-[9px] text-text-muted/50 font-mono truncate">{user?.email || ''}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-[9px] font-mono uppercase tracking-widest text-text-muted/40 hover:text-accent-500 transition-colors flex-shrink-0"
              title="Sign out"
            >
              ↩
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative grid-bg">
        {/* Header */}
        <header className="flex-shrink-0 h-14 flex items-center justify-between px-5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(11,11,11,0.5)] backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-1 text-text-muted hover:text-text-primary"
              onClick={() => setSidebarOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted/60">{subtitle}</p>
              <h1 className="text-sm font-medium tracking-wide text-text-primary leading-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 glow-anim" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Active</span>
            </div>
            {/* Avatar dropdown */}
            <div className="relative" ref={avatarRef}>
              <button
                onClick={() => setShowAvatarMenu(v => !v)}
                className="w-8 h-8 rounded-full overflow-hidden border border-[rgba(255,255,255,0.1)] hover:border-accent-500/40 transition-all focus:outline-none"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent-500/10 flex items-center justify-center text-[11px] font-medium text-accent-500">
                    {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </button>
              {showAvatarMenu && (
                <div className="absolute right-0 top-10 w-56 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(11,11,11,0.97)] backdrop-blur-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-xs font-medium text-text-primary truncate">{user?.displayName || 'User'}</p>
                    <p className="text-[10px] text-text-muted/60 font-mono truncate mt-0.5">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowAvatarMenu(false); onLogout() }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-mono uppercase tracking-widest text-text-muted hover:text-accent-500 hover:bg-accent-500/5 transition-all text-left"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content area */}
        {isAssessment ? (
          // Two-column layout for assessment
          <div className="flex-1 overflow-hidden p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left: Chat */}
            <div className="w-full lg:w-[400px] xl:w-[460px] flex-shrink-0 flex flex-col glass-card overflow-hidden shadow-2xl">
              <div className="flex-shrink-0 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
                <span className="text-[9px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20 tracking-widest">01</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">Diagnostic Core</span>
                <div className="ml-auto flex gap-1">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  key={sessionId}
                  user={user}
                  sessionId={sessionId}
                  onAgentResponse={handleAgentResponse}
                  planReady={planReady}
                  onViewPlan={() => setActiveNav('risk')}
                />
              </div>
            </div>

            {/* Right: Risk dashboard preview */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
              <div className="mb-4 flex items-baseline gap-3">
                <span className="text-[10px] font-mono text-text-muted tracking-widest uppercase">/ BIOMETRIC RISK</span>
              </div>
              <RiskDashboard riskScores={riskScores} amplifiers={amplifiers} />
            </div>
          </div>
        ) : isMental ? (
          // Mental health dedicated chat — no scrollable outer
          <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full p-4 lg:p-6">
            <div className="flex-1 glass-card overflow-hidden flex flex-col">
              <div className="flex-shrink-0 px-5 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#eb4899] bg-[rgba(235,72,153,0.1)] px-2 py-0.5 rounded border border-[rgba(235,72,153,0.2)] tracking-widest">06</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">NeuroTrace Support</span>
              </div>
              <MentalHealthChat sessionId={sessionId} />
            </div>
          </div>
        ) : (
          // Standard scrollable panel
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
              {activeNav === 'risk' && (
                <>
                  <MentalHealthPanel riskScores={riskScores} amplifiers={amplifiers} />
                  <div className="mt-8">
                    <PreventionPlan planReady={planReady} evidence={evidence} />
                  </div>
                </>
              )}
              {activeNav === 'diagnosis' && <DiagnosisUpload />}
              {activeNav === 'exercise' && <ExerciseVideos riskScores={riskScores} />}
              {activeNav === 'diet' && <DietPlan riskScores={riskScores} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
