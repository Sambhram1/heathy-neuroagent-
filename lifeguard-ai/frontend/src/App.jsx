import { useState, useCallback } from 'react'
import { Activity, Home, Brain, Settings, Bell, ChevronRight, Menu } from 'lucide-react'
import ChatInterface from './components/ChatInterface'
import RiskDashboard from './components/RiskDashboard'
import MentalHealthPanel from './components/MentalHealthPanel'
import PreventionPlan from './components/PreventionPlan'

export default function App() {
  const [riskScores, setRiskScores] = useState(null)
  const [amplifiers, setAmplifiers] = useState([])
  const [evidence, setEvidence] = useState([])
  const [planReady, setPlanReady] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sessionId] = useState(() => crypto.randomUUID())

  const handleAgentResponse = useCallback((response) => {
    if (response.risk_scores) {
      setRiskScores(response.risk_scores)
    }
    if (response.amplifiers?.length) {
      setAmplifiers(response.amplifiers)
    }
    if (response.evidence?.length) {
      setEvidence(prev => {
        const existing = new Set(prev.map(e => e.text))
        const newItems = response.evidence.filter(e => !existing.has(e.text))
        return [...prev, ...newItems]
      })
    }
    if (response.plan_ready) {
      setPlanReady(true)
    }
  }, [])

  return (
    <div className="h-screen w-screen flex bg-background text-text-primary overflow-hidden font-sans">
      
      {/* Slim Sidebar Navigation */}
      <nav className="w-20 hidden md:flex flex-col items-center py-6 border-r border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] z-20">
        <div className="mb-12 w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center glow-anim border border-accent-500/20">
          <Activity className="text-accent-500 w-5 h-5" />
        </div>
        
        <div className="flex flex-col gap-6 flex-1 w-full px-4">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-[rgba(255,255,255,0.08)] text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]'}`}
          >
            <Home className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </button>
          
          <button 
            onClick={() => setActiveTab('mental')} 
            className={`w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 ${activeTab === 'mental' ? 'bg-[rgba(255,255,255,0.08)] text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]'}`}
          >
            <Brain className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </button>
          
          <button 
            onClick={() => setActiveTab('plan')} 
            className={`relative w-full aspect-square flex items-center justify-center rounded-2xl transition-all duration-300 ${activeTab === 'plan' ? 'bg-[rgba(255,255,255,0.08)] text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]'}`}
          >
            <Activity className="w-[22px] h-[22px]" strokeWidth={1.5} />
            {planReady && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-accent-500 glow-anim" />}
          </button>
        </div>

        <div className="flex flex-col gap-4 w-full px-4 mt-auto">
          <button className="w-full aspect-square flex items-center justify-center rounded-2xl text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-all">
            <Bell className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </button>
          <button className="w-full aspect-square flex items-center justify-center rounded-2xl text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)] transition-all">
            <Settings className="w-[22px] h-[22px]" strokeWidth={1.5} />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative grid-bg">
        
        {/* Minimal Header */}
        <header className="h-[72px] flex-shrink-0 flex items-center justify-between px-6 lg:px-10 border-b border-[rgba(255,255,255,0.06)] z-10">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-primary">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-medium tracking-wide">
                LifeGuard<span className="text-text-muted font-light ml-1">AI</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] text-text-muted ml-4 border-l border-[rgba(255,255,255,0.1)] pl-4">
                Cognitive & Health Core
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 glass-card px-4 py-1.5 rounded-full border-[rgba(255,255,255,0.05)]">
              <div className="w-2 h-2 rounded-full bg-accent-500 glow-anim" />
              <span className="text-[11px] tracking-[0.15em] text-text-muted font-mono uppercase">Monitoring Active</span>
            </div>
            <button className="glass-card hover:bg-[rgba(255,255,255,0.05)] transition-colors px-4 py-2 rounded-lg text-sm font-medium border-[rgba(255,255,255,0.05)] flex items-center gap-2">
              <span className="text-text-primary">Get the app</span>
            </button>
          </div>
        </header>

        {/* Dashboard Grid Space */}
        <div className="flex-1 overflow-hidden p-4 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
          
          {/* Left Column: Diagnostics Core (Chat) */}
          <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 flex flex-col glass-card overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 blur-[100px] rounded-full pointer-events-none" />
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[rgba(255,255,255,0.01)] backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">01</span>
                <h2 className="text-[11px] font-mono uppercase tracking-[0.15em] text-text-muted">Agent Diagnostic</h2>
              </div>
              <div className="flex gap-1.5">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden relative z-10">
              <ChatInterface
                sessionId={sessionId}
                onAgentResponse={handleAgentResponse}
                planReady={planReady}
                onViewPlan={() => setActiveTab('plan')}
              />
            </div>
          </div>

          {/* Right Column: Dynamic Content Panels */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {/* Context Title */}
            <div className="mb-6 flex items-end justify-between flex-shrink-0 z-10">
              <div>
                <span className="text-xs font-mono text-text-muted tracking-widest uppercase mb-2 block">
                  {activeTab === 'dashboard' ? '/ BIOMETRIC RISK' : activeTab === 'mental' ? '/ PSYCHOSOMATIC' : '/ INTERVENTION'}
                </span>
                <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-text-primary">
                  {activeTab === 'dashboard' && 'Health Dashboard'}
                  {activeTab === 'mental' && 'Cognitive Amplifiers'}
                  {activeTab === 'plan' && 'Prevention Protocol'}
                </h2>
              </div>
              
              <button className="hidden md:flex items-center gap-2 text-xs text-text-muted hover:text-accent-500 transition-colors group">
                <span className="uppercase tracking-[0.1em]">Detailed View</span>
                <div className="w-6 h-6 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center group-hover:border-accent-500/50 group-hover:bg-accent-500/10 transition-all">
                  <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            </div>

            {/* Scrollable Panel Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-10 z-10 custom-scrollbar">
              <div className="animate-fade-in relative">
                {activeTab === 'dashboard' && (
                  <RiskDashboard riskScores={riskScores} amplifiers={amplifiers} />
                )}
                {activeTab === 'mental' && (
                  <MentalHealthPanel riskScores={riskScores} amplifiers={amplifiers} />
                )}
                {activeTab === 'plan' && (
                  <PreventionPlan planReady={planReady} evidence={evidence} />
                )}
              </div>
            </div>
            
            {/* Background wireframe decoration matching Dribbble */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
               <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
                 <circle cx="500" cy="500" r="400" fill="none" stroke="rgba(255,59,48,0.3)" strokeWidth="1" />
                 <circle cx="500" cy="500" r="300" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                 <line x1="100" y1="500" x2="900" y2="500" stroke="rgba(255,59,48,0.2)" strokeWidth="1" />
                 <line x1="500" y1="100" x2="500" y2="900" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
               </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
