import { useEffect, useState } from 'react'

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// We use a 270-degree arc (¾ circle). strokeDasharray covers 75% of circumference.
const ARC = CIRCUMFERENCE * 0.75

function getRiskColor(score) {
  if (score === null || score === undefined) return 'rgba(255,255,255,0.1)'
  if (score < 30) return '#F5F5F5' // White for healthy
  if (score < 55) return '#C8C8C8'
  if (score < 75) return '#A7A7A7'
  return '#E5E5E5' // Red for critical
}

function getRiskLabel(score) {
  if (score === null || score === undefined) return '—'
  if (score < 30) return 'Optimal'
  if (score < 55) return 'Elevated'
  if (score < 75) return 'High Risk'
  return 'Critical'
}

function getRiskLabelColor(score) {
  if (score === null || score === undefined) return 'text-text-muted'
  if (score < 30) return 'text-text-primary'
  if (score < 55) return 'text-[#C8C8C8]'
  if (score < 75) return 'text-[#A7A7A7]'
  return 'text-accent-500'
}

function GaugeChart({ label, score, icon }) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    if (score === null || score === undefined) {
      setAnimated(0)
      return
    }
    // Animate to the score value
    const start = Date.now()
    const duration = 1400
    const from = animated
    const to = score

    const frame = () => {
      const elapsed = Date.now() - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimated(from + (to - from) * eased)
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, [score])

  const color = getRiskColor(score)
  const label_text = getRiskLabel(score)
  const label_color = getRiskLabelColor(score)

  // Dash offset: full arc = 0% → ARC, 100% = 0
  const filled = (animated / 100) * ARC
  const offset = ARC - filled
  const rotation = 135

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-3 hover:border-[rgba(255,255,255,0.2)] transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
      
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-[0.2em] w-full text-left">{label}</p>
      
      <div className="relative w-32 h-32 my-2">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Background track */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth="4"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
          />
          {/* Colored fill */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              filter: score >= 75 ? `drop-shadow(0 0 8px ${color})` : 'none',
              transition: 'stroke 0.5s ease',
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-light font-mono leading-none tracking-tighter"
            style={{ color: score !== null ? '#F5F5F5' : '#404040' }}
          >
            {score !== null && score !== undefined ? Math.round(animated) : '—'}
          </span>
          {score !== null && score !== undefined && (
            <span className="text-[9px] text-text-muted font-mono tracking-widest mt-1">/ 100</span>
          )}
        </div>
      </div>
      
      <div className="text-center w-full flex items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-3">
        <p className="text-[10px] text-text-muted tracking-widest font-mono flex items-center gap-2">
          <span className="opacity-60">{icon}</span>
        </p>
        <p className={`text-[10px] uppercase font-bold tracking-widest ${label_color}`}>{label_text}</p>
      </div>
    </div>
  )
}

function AmplifierCard({ text }) {
  return (
    <div className="glass-card p-4 border-l-2 border-accent-500/50 animate-fade-in bg-[rgba(229,229,229,0.02)]">
      <p className="text-xs text-text-muted leading-relaxed tracking-wide"
        dangerouslySetInnerHTML={{ __html: text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>') }}
      />
    </div>
  )
}

function OverallRiskBadge({ score }) {
  const color = getRiskColor(score)
  const label = getRiskLabel(score)

  return (
    <div
      className="glass-card p-6 flex items-center justify-between overflow-hidden relative"
      style={{ borderColor: score >= 75 ? `rgba(229,229,229,0.3)` : undefined }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
           <span className="w-1.5 h-1.5 rounded-full bg-accent-500 glow-anim" />
           <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-mono">System Risk Score</p>
        </div>
        <p className="text-xs text-text-muted max-w-sm leading-relaxed tracking-wide">
          Weighted biometric composite factoring Diabetology, Hypertension, Cardiovascular status, and Cognitive load.
        </p>
      </div>
      <div className="text-right relative z-10 flex flex-col items-end">
        <div className="flex items-baseline gap-1">
          <p className="font-mono font-light leading-none tracking-tighter" style={{ color: score ? '#F5F5F5' : '#404040', fontSize: '4rem' }}>
            {score !== null && score !== undefined ? Math.round(score) : '--'}
          </p>
          {score !== null && <span className="text-text-muted font-mono mb-2">%</span>}
        </div>
        <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
            {score !== null ? label : 'STANDBY'}
          </p>
        </div>
      </div>
    </div>
  )
}

const GAUGES = [
  { key: 'diabetes_risk', label: 'T2 Diabetes', icon: 'GLUCOSE' },
  { key: 'hypertension_risk', label: 'Hypertension', icon: 'BP/SYS' },
  { key: 'cvd_risk', label: 'Cardiovascular', icon: 'HEART' },
  { key: 'mental_health_index', label: 'Cognitive', icon: 'NEURAL' },
]

export default function RiskDashboard({ riskScores, amplifiers }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Score */}
      <OverallRiskBadge score={riskScores?.overall_risk ?? null} />

      {/* 4 Primary Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {GAUGES.map(g => (
          <GaugeChart
            key={g.key}
            label={g.label}
            icon={g.icon}
            score={riskScores ? riskScores[g.key] : null}
          />
        ))}
      </div>

      {/* Somatic Amplifiers */}
      {amplifiers && amplifiers.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">02</span>
            <p className="text-[10px] font-medium text-text-muted uppercase tracking-[0.2em]">
              Somatic Amplifiers Detected
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amplifiers.map((amp, i) => (
              <AmplifierCard key={i} text={amp} />
            ))}
          </div>
        </div>
      )}

      {/* Placeholder State */}
      {!riskScores && (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card border-dashed">
          <div className="w-16 h-16 rounded-full border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6 float-anim bg-[rgba(255,255,255,0.01)] backdrop-blur-md">
            <span className="w-4 h-4 rounded-full bg-accent-500/50 glow-anim" />
          </div>
          <p className="text-sm font-medium text-text-primary tracking-wide">Awaiting Biometric Analysis</p>
          <p className="text-xs text-text-muted mt-2 tracking-wide">Engage with the diagnostic core to populate risk profiles.</p>
        </div>
      )}

      {/* Footer Legal */}
      <div className="pt-8 text-center border-t border-[rgba(255,255,255,0.03)] opacity-50">
        <p className="text-[9px] text-text-muted font-mono uppercase tracking-widest leading-loose">
           PROBABILISTIC MODEL. NON-DIAGNOSTIC.<br/>
           CONSULT A LICENSED CLINICIAN FOR FORMAL EVALUATION.
         </p>
      </div>
    </div>
  )
}
