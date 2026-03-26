import { useEffect, useState } from 'react'

function ScoreBar({ label, score, max, colorStops }) {
  const [width, setWidth] = useState(0)
  const pct = (score / max) * 100

  useEffect(() => {
    if (score === undefined || score === null) return
    const timer = setTimeout(() => setWidth(pct), 100)
    return () => clearTimeout(timer)
  }, [score, pct])

  const getColor = () => {
    if (pct < 30) return colorStops[0]
    if (pct < 55) return colorStops[1]
    if (pct < 75) return colorStops[2]
    return colorStops[3]
  }

  const getSeverity = () => {
    if (label === 'PHQ-9 Depression') {
      if (score <= 4) return 'Minimal'
      if (score <= 9) return 'Mild'
      if (score <= 14) return 'Moderate'
      if (score <= 19) return 'Moderately Severe'
      return 'Severe'
    }
    if (label === 'GAD-7 Anxiety') {
      if (score <= 4) return 'Minimal'
      if (score <= 9) return 'Mild'
      if (score <= 14) return 'Moderate'
      return 'Severe'
    }
    return ''
  }

  const getDetailText = () => {
    if (label === 'PHQ-9 Depression') {
      return 'Scale: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-19 Moderately Severe, 20-27 Severe. This is a screening estimate, not a diagnosis.'
    }
    if (label === 'GAD-7 Anxiety') {
      return 'Scale: 0-4 Minimal, 5-9 Mild, 10-14 Moderate, 15-21 Severe. This is a screening estimate and should be clinically validated if persistent.'
    }
    return 'Score interpretation is based on standard screening band thresholds.'
  }

  return (
    <div className="glass-card p-4 space-y-3 relative overflow-hidden group hover:border-[rgba(255,255,255,0.15)] transition-all">
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent-500/5 blur-[80px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between relative z-10">
        <span className="text-[12px] uppercase tracking-widest text-text-muted font-medium">{label}</span>
        <div className="flex items-center gap-3">
          {getSeverity() && (
            <span className="text-[11px] px-2 py-0.5 rounded border font-mono tracking-widest uppercase"
              style={{ color: getColor(), borderColor: `${getColor()}40`, background: `${getColor()}10` }}>
              {getSeverity()}
            </span>
          )}
          <span className="text-sm font-light font-mono" style={{ color: getColor() }}>
            {score !== null && score !== undefined ? score : '—'}<span className="text-text-muted/50">/{max}</span>
          </span>
        </div>
      </div>
      <div className="h-1 bg-[rgba(255,255,255,0.03)] rounded-full overflow-hidden relative z-10">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${width}%`,
            background: `linear-gradient(90deg, ${colorStops[0]}, ${getColor()})`,
            boxShadow: score >= 10 ? `0 0 10px ${getColor()}80` : 'none',
          }}
        />
      </div>

      <div className="relative z-10 max-h-0 opacity-0 overflow-hidden transition-all duration-250 group-hover:max-h-24 group-hover:opacity-100">
        <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[11px] leading-relaxed text-text-muted tracking-wide">{getDetailText()}</p>
        </div>
      </div>
    </div>
  )
}

function StressIndicator({ level }) {
  const emojis = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']
  const colors = [
    '#F5F5F5', '#F5F5F5', '#E5E5E5', '#C8C8C8',
    '#C8C8C8', '#A7A7A7', '#A7A7A7', '#E5E5E5', '#E5E5E5', '#BFBFBF'
  ]
  const emoji = level ? emojis[Math.min(level - 1, 9)] : '--'
  const color = level ? colors[Math.min(level - 1, 9)] : 'rgba(255,255,255,0.1)'

  return (
    <div className="glass-card p-4 group hover:border-[rgba(255,255,255,0.15)] transition-all">
      <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium text-text-muted mb-2">Cortisol / Stress</p>
        <div className="flex gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-1.5 rounded-sm transition-all duration-500"
              style={{
                background: level && i < level ? color : 'rgba(255,255,255,0.03)',
                boxShadow: level && i < level ? `0 0 8px ${color}60` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <div className="text-right flex flex-col items-end">
        <p className="text-sm font-light font-mono" style={{ color }}>
          {level !== null && level !== undefined ? `${level}/10` : '—'}
        </p>
        <span className="text-[11px] text-text-muted uppercase tracking-widest mt-1">Somatic Load</span>
      </div>
      </div>

      <div className="max-h-0 opacity-0 overflow-hidden transition-all duration-250 group-hover:max-h-20 group-hover:opacity-100">
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[11px] leading-relaxed text-text-muted tracking-wide">
            Somatic load reflects stress burden from behavioral and sleep signals. Higher values indicate more physiological stress pressure.
          </p>
        </div>
      </div>
    </div>
  )
}

function SleepBadge({ quality }) {
  const config = {
    good: { color: '#F5F5F5', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.1)', code: 'OPT', label: 'Optimal Recovery' },
    fair: { color: '#C8C8C8', bg: 'rgba(200,200,200,0.05)', border: 'rgba(200,200,200,0.2)', code: 'SUB', label: 'Suboptimal' },
    poor: { color: '#E5E5E5', bg: 'rgba(229,229,229,0.05)', border: 'rgba(229,229,229,0.2)', code: 'CRI', label: 'Deficient' },
  }
  const c = config[quality] || { color: '#8E8E93', bg: 'rgba(255,255,255,0.01)', border: 'rgba(255,255,255,0.05)', code: 'N/A', label: 'Not assessed' }

  return (
    <div
      className="glass-card p-4 group hover:border-[rgba(255,255,255,0.15)] transition-all"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded flex items-center justify-center border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
          <span className="text-[11px] font-mono font-bold tracking-widest" style={{ color: c.color }}>{c.code}</span>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-1">REM / Deep Sleep Index</p>
          <p className="text-xs font-semibold tracking-wide" style={{ color: c.color }}>{c.label}</p>
        </div>
      </div>

      <div className="max-h-0 opacity-0 overflow-hidden transition-all duration-250 group-hover:max-h-20 group-hover:opacity-100">
        <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-[11px] leading-relaxed text-text-muted tracking-wide">
            Recovery status is inferred from sleep quality signals. Optimal means stronger overnight restoration; suboptimal or deficient suggests reduced recovery.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MentalHealthPanel({ riskScores, amplifiers }) {
  const mhi = riskScores?.mental_health_index ?? null

  // Estimate PHQ-9 and GAD-7 from mental health index (rough inverse)
  const phq9_est = mhi !== null ? Math.round((mhi / 100) * 18) : null
  const gad7_est = mhi !== null ? Math.round((mhi / 100) * 14) : null
  const stress_est = riskScores ? Math.round((mhi / 100) * 8 + 2) : null

  const showAlert = phq9_est !== null && (phq9_est > 10 || gad7_est > 10)

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Mental Health Top Card */}
      <div className="glass-card p-5 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-accent-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0 relative z-10">
          <div className="w-4 h-4 rounded-full border border-accent-500 flex items-center justify-center">
             <div className="w-1 h-1 bg-accent-500 rounded-full glow-anim" />
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[12px] font-mono uppercase tracking-[0.2em] text-text-primary mb-1">Cognitive Base State</p>
          <p className="text-[11px] text-text-muted uppercase tracking-widest">PHQ-9 // GAD-7 // Somatic Index</p>
        </div>
        {mhi !== null && (
          <div className="ml-auto text-right relative z-10 flex flex-col items-end">
            <p className="text-3xl font-light font-mono text-text-primary tracking-tighter leading-none">{Math.round(mhi)}</p>
            <p className="text-[11px] text-accent-500 font-mono tracking-widest mt-2">NEURAL INDEX</p>
          </div>
        )}
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ScoreBar
          label="PHQ-9 Depression"
          score={phq9_est}
          max={27}
          colorStops={['#F5F5F5', '#C8C8C8', '#A7A7A7', '#E5E5E5']}
        />
        <ScoreBar
          label="GAD-7 Anxiety"
          score={gad7_est}
          max={21}
          colorStops={['#F5F5F5', '#C8C8C8', '#A7A7A7', '#E5E5E5']}
        />
      </div>

      {/* Stress & Sleep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StressIndicator level={stress_est} />
        <SleepBadge quality={riskScores ? (mhi > 60 ? 'poor' : mhi > 35 ? 'fair' : 'good') : null} />
      </div>

      {/* Alert for high scores */}
      {showAlert && (
        <div className="glass-card p-5 border-l-2 border-accent-500 animate-fade-in relative overflow-hidden" style={{ background: 'rgba(229,229,229,0.04)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-start gap-4 relative z-10 flex-col md:flex-row">
            <div className="w-8 h-8 rounded bg-accent-500/10 border border-accent-500/20 flex items-center justify-center text-accent-500 shrink-0">
               !
            </div>
            <div>
              <p className="text-[12px] font-mono uppercase tracking-widest text-accent-500 mb-2">Intervention Recommended</p>
              <p className="text-xs text-text-muted leading-relaxed mb-4 tracking-wide pr-4">
                Analysis detects elevated psychosomatic markers. Connectivity with a certified clinician is advised to stabilize cognitive load.
              </p>
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3 text-[11px] uppercase tracking-widest bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-2 rounded">
                  <div className="w-1.5 h-1.5 bg-accent-500 rounded-full glow-anim hidden md:block" />
                  <span className="text-text-muted"><strong className="text-text-primary font-medium">iCall (TISS):</strong> 9152987821</span>
                  <span className="text-[11px] text-text-muted/50 md:border-l border-[rgba(255,255,255,0.1)] md:pl-3">Mon–Sat, 8am–10pm</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 text-[11px] uppercase tracking-widest bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] p-2 rounded">
                   <div className="w-1.5 h-1.5 bg-accent-500 rounded-full glow-anim hidden md:block" />
                  <span className="text-text-muted"><strong className="text-text-primary font-medium">Vandrevala:</strong> 1860-2662-345</span>
                  <span className="text-[11px] text-text-muted/50 md:border-l border-[rgba(255,255,255,0.1)] md:pl-3">24/7 Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mind-body summary */}
      {amplifiers && amplifiers.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3 mb-2">
             <span className="text-[11px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">03</span>
            <p className="text-[11px] font-medium text-text-muted uppercase tracking-[0.2em]">
              Psychosomatic Feedback Loop
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {amplifiers.map((amp, i) => (
              <div key={i} className="glass-card p-4 border-l-2 border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.01)] hover:border-accent-500 hover:bg-[rgba(229,229,229,0.02)] transition-colors">
                <p className="text-xs text-text-muted leading-relaxed tracking-wide"
                  dangerouslySetInnerHTML={{ __html: amp.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>') }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {!riskScores && (
         <div className="flex flex-col items-center justify-center py-20 text-center glass-card border-dashed">
         <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6 float-anim bg-[rgba(255,255,255,0.01)] backdrop-blur-md">
           <span className="w-4 h-4 rounded-full bg-[rgba(255,255,255,0.1)]" />
         </div>
         <p className="text-sm font-medium text-text-primary tracking-wide">Awaiting Cognitive Data</p>
         <p className="text-xs text-text-muted mt-2 tracking-wide">Engage with diagnostics to initiate neuro-profiling.</p>
       </div>
      )}

      <div className="pt-8 text-center border-t border-[rgba(255,255,255,0.03)] opacity-50">
        <p className="text-[11px] text-text-muted font-mono uppercase tracking-widest leading-loose">
           PHQ-9 & GAD-7 HEURISTIC SCREENING.<br/>
           NOT FOR DEFINITIVE DIAGNOSIS.
         </p>
      </div>
    </div>
  )
}
