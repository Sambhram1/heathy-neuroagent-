import { useEffect, useRef, useState } from 'react'
import neuralBrain from '../assets/neural_brain.png'

// ─── Neural Sphere Canvas ───────────────────────────────────────────────────
function useNeuralSphere(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, angle = 0
    const N = 200
    const golden = Math.PI * (3 - Math.sqrt(5))
    const points = []
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r })
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight
      const cx = W / 2, cy = H / 2
      const scale = Math.min(W, H) * 0.42
      ctx.clearRect(0, 0, W, H)

      const cosA = Math.cos(angle * 0.7), sinA = Math.sin(angle * 0.7)
      const cosB = Math.cos(angle * 0.2), sinB = Math.sin(angle * 0.2)

      const projected = points.map((p) => {
        const rx = p.x * cosA - p.z * sinA
        const rz = p.x * sinA + p.z * cosA
        const ry = p.y * cosB - rz * sinB
        const rz2 = p.y * sinB + rz * cosB
        const fov = 2.5
        return {
          sx: (rx / (rz2 + fov)) * scale * fov + cx,
          sy: (ry / (rz2 + fov)) * scale * fov + cy,
          depth: (rz2 + 1) / 2,
          rz: rz2,
        }
      })
      projected.sort((a, b) => a.rz - b.rz)

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx
          const dy = projected[i].sy - projected[j].sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 58) {
            const alpha = ((1 - dist / 58) * 0.28 * (projected[i].depth + projected[j].depth)) / 2
            ctx.strokeStyle = `rgba(229,229,229,${alpha.toFixed(3)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(projected[i].sx, projected[i].sy)
            ctx.lineTo(projected[j].sx, projected[j].sy)
            ctx.stroke()
          }
        }
      }

      projected.forEach(({ sx, sy, depth }) => {
        ctx.beginPath()
        ctx.arc(sx, sy, Math.max(0.5, depth * 2.2), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(229,229,229,${(depth * 0.85 + 0.15).toFixed(3)})`
        ctx.fill()
      })

      angle += 0.004
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
}

// ─── Radial Lines SVG ──────────────────────────────────────────────────────
function RadialLines() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(300,300)">
        {Array.from({ length: 36 }, (_, i) => {
          const angle = (i / 36) * 2 * Math.PI
          return (
            <line key={i}
              x1={Math.cos(angle) * 115} y1={Math.sin(angle) * 115}
              x2={Math.cos(angle) * 290} y2={Math.sin(angle) * 290}
              stroke="rgba(229,229,229,0.06)" strokeWidth="0.5"
            />
          )
        })}
        <circle cx="0" cy="0" r="115" fill="none" stroke="rgba(229,229,229,0.08)" strokeWidth="0.5" />
        <circle cx="0" cy="0" r="190" fill="none" stroke="rgba(229,229,229,0.05)" strokeWidth="0.5" />
        <circle cx="0" cy="0" r="265" fill="none" stroke="rgba(229,229,229,0.03)" strokeWidth="0.5" strokeDasharray="4 8" />
      </g>
    </svg>
  )
}

// ─── Arc Decoration ────────────────────────────────────────────────────────
function ArcDecoration() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid meet">
      <path d="M 470 470 A 210 210 0 0 0 340 565" fill="none" stroke="rgba(229,229,229,0.55)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 130 130 A 210 210 0 0 1 260 35" fill="none" stroke="rgba(229,229,229,0.18)" strokeWidth="1" strokeLinecap="round" />
      <path d="M 540 300 A 240 240 0 0 0 300 60" fill="none" stroke="rgba(229,229,229,0.07)" strokeWidth="0.8" strokeDasharray="3 6" />
    </svg>
  )
}

// ─── Corner Crosshair ──────────────────────────────────────────────────────
function Corner({ pos }) {
  const cls = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0',
    bl: 'bottom-0 left-0',
    br: 'bottom-0 right-0',
  }[pos]
  return (
    <div className={`absolute w-5 h-5 pointer-events-none ${cls}`}>
      {(pos === 'tl' || pos === 'bl') && <div className="absolute top-0 left-0 w-3 h-px bg-[#E5E5E5]/50" />}
      {(pos === 'tr' || pos === 'br') && <div className="absolute top-0 right-0 w-3 h-px bg-[#E5E5E5]/50" />}
      {(pos === 'tl' || pos === 'tr') && <div className="absolute top-0 left-0 w-px h-3 bg-[#E5E5E5]/50" />}
      {(pos === 'bl' || pos === 'br') && <div className="absolute bottom-0 left-0 w-px h-3 bg-[#E5E5E5]/50" />}
    </div>
  )
}

// ─── Data ─────────────────────────────────────────────────────────────────
const CONDITIONS = [
  { code: 'MET-D', name: 'METABOLIC DISORDER', sub: 'Diabetes Risk Protocol' },
  { code: 'CVD-H', name: 'CARDIOVASCULAR', sub: 'Hypertension Detection' },
  { code: 'PSY-A', name: 'PSYCHOSOMATIC', sub: 'Anxiety & Stress Index' },
  { code: 'CVD-C', name: 'CARDIAC EVENT', sub: 'CVD Risk Stratification' },
]

const FEATURES = [
  { num: '01', title: 'Neural Risk Prediction', desc: 'AI-calibrated models for diabetes, hypertension, and CVD using South Asian biometric thresholds.' },
  { num: '02', title: 'Psychosomatic Mapping', desc: 'PHQ-9 / GAD-7 screening with mental health amplification on physical disease risk.' },
  { num: '03', title: 'Evidence-Based Protocol', desc: 'Personalised nutrition, exercise and sleep programmes grounded in peer-reviewed guidelines.' },
  { num: '04', title: 'RAG Intelligence Core', desc: 'Retrieval-augmented generation over clinical datasets — every recommendation is cited.' },
]

const LIVE_METRICS = ['0.94 AUC', '0.97 AUC', '0.91 AUC', '0.96 AUC']

// ─── Landing Page ──────────────────────────────────────────────────────────
export default function LandingPage({ onGetStarted }) {
  const canvasRef = useRef(null)
  useNeuralSphere(canvasRef)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="page-scroll w-screen bg-[#0B0B0B] text-[#F5F5F5] relative overflow-x-hidden atmo-noise">

      {/* Fine grid background */}
      <div className="fixed inset-0 pointer-events-none atmo-grid" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.09)_0%,transparent_35%),radial-gradient(circle_at_82%_80%,rgba(255,255,255,0.07)_0%,transparent_38%)]" />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-6 lg:px-12 border-b border-white/[0.05] bg-[rgba(11,11,11,0.85)] backdrop-blur-2xl">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#E5E5E5]/10 border border-[#E5E5E5]/25 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#E5E5E5]" style={{ boxShadow: '0 0 8px rgba(229,229,229,0.9)' }} />
          </div>
          <span className="text-[13px] font-medium tracking-tight text-white">
            LifeGuard<span className="text-[#E5E5E5]">.AI</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          {['Neural Core', 'Risk Protocol', 'Evidence Base'].map(item => (
            <a key={item} href="#" className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35 hover:text-[#E5E5E5] transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-[#E5E5E5]/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E5] animate-pulse" />
            System Online
          </div>
          <button
            onClick={onGetStarted}
            className="text-[10px] font-mono uppercase tracking-[0.15em] px-5 py-2 rounded-full border border-[#E5E5E5]/25 text-white hover:bg-[#E5E5E5] hover:border-[#E5E5E5] hover:text-[#0B0B0B] transition-all bg-[#E5E5E5]/5 font-medium"
          >
            Access Beta
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen pt-[52px] flex flex-col lg:flex-row items-stretch relative">

        {/* LEFT: Text */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-14 xl:px-20 py-16 lg:py-0 relative z-10 lg:max-w-[540px] xl:max-w-[600px]">

          {/* Status bar */}
          <div className="flex items-center gap-2.5 mb-10 self-start">
            <div className="h-px w-8 bg-[#E5E5E5]/50" />
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#E5E5E5]/80">V.2.0.4 — Agentic Core</span>
            <div className="h-px w-8 bg-[#E5E5E5]/50" />
          </div>

          {/* Heading */}
          <div className="mb-8 space-y-0">
            <h1 className="text-[clamp(52px,7.5vw,108px)] font-extralight leading-[0.87] tracking-[-0.03em] text-white">
              Early
            </h1>
            <h1 className="text-[clamp(52px,7.5vw,108px)] font-extralight leading-[0.87] tracking-[-0.03em] text-white">
              Detection.
            </h1>
            <h1 className="text-[clamp(52px,7.5vw,108px)] font-light leading-[0.87] tracking-[-0.03em] text-[#E5E5E5] italic">
              Prevention.
            </h1>
          </div>

          <p className="text-white/40 text-[13px] leading-[1.8] max-w-[340px] mb-10 font-light border-l border-[#E5E5E5]/20 pl-4 tracking-wide">
            AI-driven lifestyle disease risk prediction with psychosomatic integration — clinically grounded, personalised to you.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 mb-14">
            <button
              onClick={onGetStarted}
              className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#E5E5E5] text-[#0B0B0B] text-[11px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-[#BFBFBF] transition-all hover:shadow-[0_0_45px_rgba(229,229,229,0.4)] active:scale-[0.98]"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0B]/40" />
              Begin Diagnostic
            </button>
            <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border border-white/10 text-white/50 text-[11px] font-mono uppercase tracking-[0.2em] hover:border-white/25 hover:text-white/80 transition-all">
              Clinical Specs →
            </button>
          </div>

          {/* Metrics */}
          <div className="flex gap-10 border-t border-white/[0.06] pt-8">
            {[['0.97', 'Precision Score'], ['3', 'Disease Models'], ['REAL-TIME', 'Response']].map(([val, lbl]) => (
              <div key={lbl} className="group cursor-default">
                <p className="text-[22px] font-light font-mono text-white group-hover:text-[#E5E5E5] transition-colors duration-400">{val}</p>
                <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/25 mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Brain */}
        <div className="flex-1 flex items-center justify-center relative border-t lg:border-t-0 lg:border-l border-white/[0.05] min-h-[480px] overflow-hidden">
          <RadialLines />

          <div className="relative w-[260px] h-[260px] sm:w-[360px] sm:h-[360px] lg:w-[440px] lg:h-[440px]">
            {/* Corner marks */}
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

            {/* Rings */}
            <div className="absolute inset-0 rounded-full border border-[#E5E5E5]/[0.08]" />
            <div className="absolute inset-[10%] rounded-full border border-[#E5E5E5]/[0.04]" />
            <div className="absolute inset-[4%] rounded-full border border-white/10 orbital-ring" />
            <div className="absolute inset-[16%] rounded-full border border-white/10 [border-style:dashed] orbital-ring-reverse" />

            {/* Brain image */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ animation: 'brain-float 8s ease-in-out infinite' }}>
              <img
                src={neuralBrain}
                alt=""
                className="w-4/5 h-4/5 object-contain pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 0 35px rgba(229,229,229,0.38)) drop-shadow(0 0 70px rgba(229,229,229,0.14))',
                }}
              />
            </div>

            {/* Canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ mixBlendMode: 'screen', opacity: 0.65 }}
            />

            {/* Floating label: top right */}
            <div className="absolute -top-10 right-0 sm:-right-10 flex items-start gap-2" style={{ animation: 'brain-float 8s ease-in-out infinite', animationDelay: '1s' }}>
              <div className="flex flex-col items-center gap-1 mt-2">
                <div className="w-px h-7 bg-[#E5E5E5]/25" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#E5E5E5]/50" />
              </div>
              <div className="bg-[rgba(229,229,229,0.06)] border border-[#E5E5E5]/20 rounded-xl px-3 py-2 backdrop-blur-md whitespace-nowrap">
                <p className="text-[8px] font-mono text-[#E5E5E5]/80 uppercase tracking-widest">Neural Flux</p>
                <p className="text-[12px] font-mono text-white mt-0.5">{LIVE_METRICS[tick % LIVE_METRICS.length]}</p>
              </div>
            </div>

            {/* Floating label: bottom left */}
            <div className="absolute -bottom-10 left-0 sm:-left-10" style={{ animation: 'brain-float 8s ease-in-out infinite', animationDelay: '3s' }}>
              <div className="bg-[rgba(229,229,229,0.06)] border border-[#E5E5E5]/20 rounded-xl px-3 py-2 backdrop-blur-md whitespace-nowrap">
                <p className="text-[8px] font-mono text-[#E5E5E5]/80 uppercase tracking-widest">Risk State</p>
                <p className="text-[12px] font-mono text-white mt-0.5">MONITORING</p>
              </div>
            </div>
          </div>

          <ArcDecoration />

          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-px pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(229,229,229,0.15), transparent)',
              animation: 'scan-line 6s ease-in-out infinite',
            }}
          />
        </div>

        {/* RIGHT: Conditions panel */}
        <div className="hidden xl:flex flex-col justify-center px-10 border-l border-white/[0.05] min-w-[230px] py-16">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/25 mb-6">Disease Protocols</p>
          <div className="space-y-5">
            {CONDITIONS.map((c) => (
              <div key={c.code} className="group cursor-default">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[8px] font-mono text-[#E5E5E5]/50 tracking-widest">{c.code}</span>
                  <div className="flex-1 h-px bg-white/[0.05] group-hover:bg-[#E5E5E5]/20 transition-colors" />
                </div>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/55 group-hover:text-white transition-colors">{c.name}</p>
                <p className="text-[9px] text-white/22 tracking-wide mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* App-style CTA */}
          <div className="mt-10 border-t border-white/[0.05] pt-8">
            <button
              onClick={onGetStarted}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-[#E5E5E5]/30 hover:bg-[#E5E5E5]/[0.04] transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#E5E5E5] flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_20px_rgba(229,229,229,0.4)] transition-shadow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/25">Get Started</p>
                <p className="text-[12px] text-white font-medium tracking-tight">Start Diagnostic</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ── TICKER BANNER ── */}
      <div className="border-t border-white/[0.05] py-4 overflow-hidden relative">
        <div className="flex gap-10 whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
          {[...CONDITIONS, ...CONDITIONS, ...CONDITIONS].map((c, i) => (
            <div key={i} className="flex items-center gap-5 flex-shrink-0">
              <span className="text-[8px] font-mono text-[#E5E5E5]/40 tracking-widest">{c.code}</span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/18">{c.name}</span>
              <span className="text-white/10 text-lg">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="px-6 lg:px-16 py-24 relative border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#E5E5E5]/45" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#E5E5E5]/65">Core Capabilities</span>
              </div>
              <h2 className="text-[clamp(28px,4vw,52px)] font-extralight leading-tight tracking-tight text-white">
                Built for prevention,<br />
                <span className="text-white/35">powered by evidence.</span>
              </h2>
            </div>
            <p className="text-[10px] font-mono text-white/28 max-w-xs leading-[1.9] lg:text-right">
              Each model is calibrated on clinical datasets spanning 100,000+ patient records with South Asian population adjustments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.05]">
            {FEATURES.map((f) => (
              <div key={f.num} className="bg-[#0B0B0B] p-8 hover:bg-[rgba(229,229,229,0.025)] transition-colors group cursor-default">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-[8px] font-mono text-[#E5E5E5]/55 border border-[#E5E5E5]/18 px-2 py-0.5 rounded tracking-widest">{f.num}</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                <h3 className="text-[13px] font-medium text-white mb-3 tracking-wide group-hover:text-[#E5E5E5] transition-colors">{f.title}</h3>
                <p className="text-[11px] text-white/32 leading-relaxed tracking-wide">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 lg:px-16 py-24 relative border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="relative border border-white/[0.07] rounded-3xl overflow-hidden p-12 lg:p-16">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#E5E5E5]/[0.07] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#E5E5E5]/[0.04] rounded-full blur-3xl pointer-events-none" />

            {/* Corner marks */}
            {['tl', 'tr', 'bl', 'br'].map(pos => {
              const base = 'absolute w-5 h-5'
              const coords = { tl: 'top-5 left-5', tr: 'top-5 right-5', bl: 'bottom-5 left-5', br: 'bottom-5 right-5' }
              return (
                <div key={pos} className={`${base} ${coords[pos]}`}>
                  <div className={`absolute h-px w-3 bg-[#E5E5E5]/35 ${pos.includes('r') ? 'right-0' : 'left-0'} top-0`} />
                  <div className={`absolute w-px h-3 bg-[#E5E5E5]/35 ${pos.includes('b') ? 'bottom-0' : 'top-0'} left-0`} />
                </div>
              )
            })}

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <div className="h-px w-5 bg-[#E5E5E5]/35" />
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#E5E5E5]/55">Begin Assessment</span>
                <div className="h-px w-5 bg-[#E5E5E5]/35" />
              </div>
              <h2 className="text-[clamp(28px,4vw,52px)] font-extralight tracking-tight text-white mb-4 leading-tight">
                Your health intelligence<br /><span className="text-[#E5E5E5]">starts here.</span>
              </h2>
              <p className="text-white/32 text-[13px] tracking-wide mb-10 max-w-sm mx-auto leading-relaxed">
                5-minute diagnostic assessment. Personalised risk scores. Clinically grounded prevention protocols.
              </p>
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#E5E5E5] text-[#0B0B0B] text-[11px] font-mono uppercase tracking-[0.2em] font-bold hover:bg-[#BFBFBF] transition-all hover:shadow-[0_0_50px_rgba(229,229,229,0.35)] active:scale-[0.98]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#0B0B0B]/40" />
                Access Secure Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 lg:px-12 py-5 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5E5E5]/45" />
          <span className="text-[9px] font-mono text-white/22 uppercase tracking-[0.2em]">LifeGuard AI © 2026</span>
        </div>
        <span className="text-[9px] font-mono text-white/18 uppercase tracking-[0.15em]">Preventive Intelligence — Not Medical Advice</span>
      </footer>
    </div>
  )
}
