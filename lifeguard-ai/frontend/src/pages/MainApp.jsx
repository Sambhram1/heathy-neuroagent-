import { useState, useCallback, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import AssessmentForm from '../components/AssessmentForm'
import ChatInterface from '../components/ChatInterface'
import RiskDashboard from '../components/RiskDashboard'
import MentalHealthPanel from '../components/MentalHealthPanel'
import PreventionPlan from '../components/PreventionPlan'
import DiagnosisUpload from '../components/DiagnosisUpload'
import ExerciseVideos from '../components/ExerciseVideos'
import DietPlan from '../components/DietPlan'
import MentalHealthChat from '../components/MentalHealthChat'

const NAV = [
  { id: 'assessment', label: 'Assessment',    num: '01', desc: 'Diagnostic AI' },
  { id: 'risk',       label: 'Risk Dashboard', num: '02', desc: 'Biometric scores' },
  { id: 'diagnosis',  label: 'Upload Report',  num: '03', desc: 'Optional upload' },
  { id: 'exercise',   label: 'Exercise',       num: '04', desc: 'Video protocols' },
  { id: 'diet',       label: 'Diet Plan',      num: '05', desc: 'Nutrition guide' },
  { id: 'mental',     label: 'Mental Health',  num: '06', desc: 'Support chat' },
]

// ─── Risk colour helper ────────────────────────────────────────────────────
function riskColor(score) {
  if (score == null) return '#8E8E93'
  if (score < 35) return '#22c55e'
  if (score < 65) return '#facc15'
  return '#ef4444'
}

function scoreTheme(score) {
  if (score == null) {
    return {
      accent: '#E5E5E5',
      spotA: 'rgba(229,229,229,0.10)',
      spotB: 'rgba(229,229,229,0.06)',
    }
  }
  if (score < 35) {
    return {
      accent: '#22c55e',
      spotA: 'rgba(34,197,94,0.17)',
      spotB: 'rgba(34,197,94,0.10)',
    }
  }
  if (score < 65) {
    return {
      accent: '#facc15',
      spotA: 'rgba(250,204,21,0.17)',
      spotB: 'rgba(250,204,21,0.10)',
    }
  }
  return {
    accent: '#ef4444',
    spotA: 'rgba(239,68,68,0.18)',
    spotB: 'rgba(239,68,68,0.11)',
  }
}

export default function MainApp({ user }) {
  const [activeNav, setActiveNav]     = useState('assessment')
  const [riskScores, setRiskScores]   = useState(null)
  const [amplifiers, setAmplifiers]   = useState([])
  const [evidence, setEvidence]       = useState([])
  const [planReady, setPlanReady]     = useState(false)
  const [sessionId]                   = useState(() => crypto.randomUUID())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [reportContext, setReportContext] = useState(null)
  const [hasAssessment, setHasAssessment] = useState(null)

  // Load Firestore user data
  useEffect(() => {
    if (!user?.uid) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        if (snap.exists()) {
          const d = snap.data()
          setHasAssessment(!!d.hasAssessment)
          if (d.riskScores)    setRiskScores(d.riskScores)
          if (d.amplifiers)    setAmplifiers(d.amplifiers)
          if (d.profile)       setUserProfile(d.profile)
          if (d.reportContext) setReportContext(d.reportContext)
        } else {
          setHasAssessment(false)
        }
      } catch { setHasAssessment(false) }
    }
    load()
  }, [user?.uid])

  const handleAssessmentComplete = useCallback(async ({ profile, riskScores: rs, amplifiers: amps, profileSummary }) => {
    setRiskScores(rs); setAmplifiers(amps); setUserProfile(profile)
    setHasAssessment(true); setActiveNav('risk')
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          hasAssessment: true, profile, riskScores: rs,
          amplifiers: amps, profileSummary, assessedAt: serverTimestamp(),
        })
      } catch {}
    }
  }, [user?.uid])

  const handleAgentResponse = useCallback(async (response) => {
    if (response.risk_scores) {
      setRiskScores(response.risk_scores)
      if (user?.uid) {
        try { await updateDoc(doc(db, 'users', user.uid), { riskScores: response.risk_scores }) } catch {}
      }
    }
    if (response.amplifiers?.length) setAmplifiers(response.amplifiers)
    if (response.evidence?.length) {
      setEvidence(prev => {
        const s = new Set(prev.map(e => e.text))
        return [...prev, ...response.evidence.filter(e => !s.has(e.text))]
      })
    }
    if (response.plan_ready) setPlanReady(true)
  }, [user?.uid])

  const handleReportSaved = useCallback(async (ctx) => {
    setReportContext(ctx)
    if (user?.uid) {
      try { await updateDoc(doc(db, 'users', user.uid), { reportContext: ctx, reportAt: serverTimestamp() }) } catch {}
    }
  }, [user?.uid])

  const handleLogout = () => signOut(auth)

  const resetAssessment = () => {
    setHasAssessment(false); setRiskScores(null)
    setAmplifiers([]); setUserProfile(null); setActiveNav('assessment')
  }

  // Loading
  if (hasAssessment === null) {
    return (
      <div className="h-screen w-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-4 h-4 border-2 border-[#E5E5E5] border-t-transparent rounded-full animate-spin" />
          <p className="text-[11px] font-mono uppercase tracking-widest text-white/30">Loading profile…</p>
        </div>
      </div>
    )
  }

  const PANEL = {
    assessment: [hasAssessment ? 'DIAGNOSTIC CORE' : 'ONBOARDING', hasAssessment ? 'Assessment' : 'Initial Assessment'],
    risk:       ['BIOMETRIC RISK',    'Risk Dashboard'],
    diagnosis:  ['CLINICAL DATA',     'Upload Report'],
    exercise:   ['MOVEMENT PROTOCOL', 'Exercise Videos'],
    diet:       ['NUTRITIONAL GUIDE', 'Diet Plan'],
    mental:     ['COGNITIVE SUPPORT', 'Mental Health'],
  }
  const [subtitle, title] = PANEL[activeNav] || ['', '']
  const showForm  = activeNav === 'assessment' && !hasAssessment
  const isAssess  = activeNav === 'assessment'
  const isMental  = activeNav === 'mental'

  const overallRisk = riskScores?.overall_risk
  const theme = scoreTheme(overallRisk)

  return (
    <div className="h-screen w-screen flex bg-[#0B0B0B] text-[#F5F5F5] overflow-hidden">
      {/* Fine grid bg */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 18%, ${theme.spotA} 0%, transparent 34%), radial-gradient(circle at 82% 76%, ${theme.spotB} 0%, transparent 36%)`,
          transition: 'background-image 0.45s ease',
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-[220px] flex flex-col border-r border-white/[0.06] bg-[rgba(11,11,11,0.98)] backdrop-blur-xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* Logo */}
        <div className="h-[52px] px-5 flex items-center gap-2.5 border-b border-white/[0.06] flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/25 flex items-center justify-center flex-shrink-0">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.accent, boxShadow: `0 0 8px ${theme.accent}` }} />
          </div>
          <div>
            <p className="text-[13px] font-medium tracking-tight text-white leading-none">
              LifeGuard<span style={{ color: theme.accent }}>.AI</span>
            </p>
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25 mt-0.5">Health Intelligence</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const active = activeNav === item.id
            const locked = item.id !== 'assessment' && !hasAssessment
            return (
              <button
                key={item.id}
                onClick={() => { if (!locked) { setActiveNav(item.id); setSidebarOpen(false) } }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all relative group ${
                  active
                    ? 'bg-white/[0.08] border border-white/[0.18]'
                    : locked
                    ? 'border border-transparent opacity-40 cursor-not-allowed'
                    : 'hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full" style={{ background: theme.accent }} />}
                <span className={`text-[9px] font-mono tracking-widest flex-shrink-0 w-5 ${active ? '' : 'text-white/30'}`} style={active ? { color: theme.accent } : undefined}>
                  {item.num}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-medium tracking-wide truncate leading-none mb-0.5 ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                    {item.label}
                  </p>
                  <p className="text-[9px] text-white/25 tracking-wide font-mono">{item.desc}</p>
                </div>
                {item.id === 'assessment' && planReady && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }} />
                )}
              </button>
            )
          })}

          {hasAssessment && (
            <button
              onClick={resetAssessment}
              className="w-full flex items-center gap-3 px-3 py-2 mt-3 rounded-xl text-left border border-transparent hover:bg-white/[0.02] transition-all"
            >
              <span className="text-[11px] text-white/20 flex-shrink-0 w-5">↺</span>
              <p className="text-[11px] font-mono uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors">Re-assess</p>
            </button>
          )}
        </nav>

        {/* User info */}
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.06] flex-shrink-0">
          {overallRisk != null && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-[rgba(229,229,229,0.05)] border border-[rgba(229,229,229,0.12)]">
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Overall Risk</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[20px] font-light font-mono" style={{ color: riskColor(overallRisk) }}>
                  {Math.round(overallRisk)}
                </span>
                <span className="text-[9px] text-white/30 font-mono">/ 100</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="w-7 h-7 rounded-full bg-[#E5E5E5]/10 border border-[#E5E5E5]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-medium" style={{ color: theme.accent }}>
                {(user?.name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-white font-medium truncate leading-none">{user?.name || 'User'}</p>
              <p className="text-[9px] text-white/25 font-mono truncate mt-0.5">{user?.email || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-[11px] font-mono text-white/20 transition-colors flex-shrink-0"
              style={{ '--hover-color': theme.accent }}
              title="Sign out"
            >↩</button>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 h-[52px] flex items-center justify-between px-5 border-b border-white/[0.06] bg-[rgba(11,11,11,0.6)] backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 -ml-1 text-white/30 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25">/ {subtitle}</p>
              <h1 className="text-[12px] font-medium tracking-wide text-white leading-tight">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reportContext && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.02]">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/35">Report Loaded</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.05] bg-white/[0.02]">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }} />
              <span className="text-[9px] font-mono uppercase tracking-widest text-white/30">Active</span>
            </div>
          </div>
        </header>

        {/* Content */}
        {showForm ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AssessmentForm onComplete={handleAssessmentComplete} />
          </div>
        ) : isAssess ? (
          <div className="flex-1 overflow-hidden p-4 lg:p-5 flex flex-col lg:flex-row gap-4">
            {/* Chat */}
            <div className="w-full lg:w-[380px] xl:w-[440px] flex-shrink-0 flex flex-col border border-white/[0.06] rounded-2xl overflow-hidden bg-[rgba(255,255,255,0.01)]">
              <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <span className="text-[9px] font-mono px-2 py-0.5 rounded border tracking-widest" style={{ color: theme.accent, background: `${theme.accent}14`, borderColor: `${theme.accent}35` }}>01</span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">AI Diagnostic</span>
                <div className="ml-auto flex gap-1">
                  <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface
                  sessionId={sessionId}
                  onAgentResponse={handleAgentResponse}
                  planReady={planReady}
                  onViewPlan={() => setActiveNav('risk')}
                  userProfile={userProfile}
                  reportContext={reportContext}
                />
              </div>
            </div>
            {/* Risk panel */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-px w-5 bg-[#E5E5E5]/35" />
                <span className="text-[9px] font-mono text-white/25 tracking-widest uppercase">Biometric Risk</span>
              </div>
              <RiskDashboard riskScores={riskScores} amplifiers={amplifiers} />
            </div>
          </div>
        ) : isMental ? (
          <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full p-4 lg:p-5">
            <div className="flex-1 border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col bg-[rgba(255,255,255,0.01)]">
              <div className="flex-shrink-0 px-5 py-3 border-b border-white/[0.06] flex items-center gap-3">
                <span className="text-[9px] font-mono text-[#9E9E9E]/70 bg-[rgba(158,158,158,0.06)] px-2 py-0.5 rounded border border-[rgba(158,158,158,0.15)] tracking-widest">06</span>
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/35">Cognitive Support</span>
              </div>
              <MentalHealthChat sessionId={sessionId} userProfile={userProfile} reportContext={reportContext} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
              {activeNav === 'risk' && (
                <>
                  <MentalHealthPanel riskScores={riskScores} amplifiers={amplifiers} />
                  <div className="mt-8">
                    <PreventionPlan planReady={planReady} evidence={evidence} />
                  </div>
                </>
              )}
              {activeNav === 'diagnosis' && (
                <DiagnosisUpload onReportSaved={handleReportSaved} existingReport={reportContext} />
              )}
              {activeNav === 'exercise' && <ExerciseVideos riskScores={riskScores} userProfile={userProfile} />}
              {activeNav === 'diet'     && <DietPlan riskScores={riskScores} userProfile={userProfile} />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
