import { useEffect, useRef } from 'react'

function useSphere(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let angle = 0
    const N = 180
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
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight
      const cx = W / 2
      const cy = H / 2
      const scale = Math.min(W, H) * 0.45

      ctx.clearRect(0, 0, W, H)

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const cosB = Math.cos(angle * 0.3)
      const sinB = Math.sin(angle * 0.3)

      const projected = points.map((p) => {
        const rx = p.x * cosA - p.z * sinA
        const rz = p.x * sinA + p.z * cosA
        const ry = p.y * cosB - rz * sinB
        const rz2 = p.y * sinB + rz * cosB

        const fov = 2.5
        const sx = (rx / (rz2 + fov)) * scale * fov + cx
        const sy = (ry / (rz2 + fov)) * scale * fov + cy
        const depth = (rz2 + 1) / 2

        return { sx, sy, depth, rz: rz2 }
      })

      projected.sort((a, b) => a.rz - b.rz)

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx
          const dy = projected[i].sy - projected[j].sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 65) {
            const alpha = ((1 - dist / 65) * 0.25 * (projected[i].depth + projected[j].depth)) / 2
            ctx.strokeStyle = `rgba(255,59,48,${alpha.toFixed(3)})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(projected[i].sx, projected[i].sy)
            ctx.lineTo(projected[j].sx, projected[j].sy)
            ctx.stroke()
          }
        }
      }

      projected.forEach(({ sx, sy, depth }) => {
        const r = Math.max(0.8, depth * 2.5)
        const alpha = depth * 0.9 + 0.1
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,59,48,${alpha.toFixed(3)})`
        ctx.fill()
      })

      const grad = ctx.createRadialGradient(cx, cy, scale * 0.7, cx, cy, scale * 1.15)
      grad.addColorStop(0, 'rgba(255,59,48,0.05)')
      grad.addColorStop(1, 'rgba(255,59,48,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 1.15, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      angle += 0.003
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])
}

const FEATURES = [
  {
    num: '01',
    title: 'Risk Prediction',
    desc: 'AI-powered analysis of diabetes, hypertension, and CVD risk using region-calibrated models.',
  },
  {
    num: '02',
    title: 'Mental Health',
    desc: 'PHQ-9 and GAD-7 screening with psychosomatic amplification tracking and crisis support.',
  },
  {
    num: '03',
    title: 'Evidence-Based Plans',
    desc: 'Personalised nutrition, exercise, and sleep protocols sourced from global health guidelines.',
  },
  {
    num: '04',
    title: 'RAG Intelligence',
    desc: 'Retrieval-augmented generation over clinical datasets — every recommendation is cited.',
  },
]

import neuralBrain from '../assets/neural_brain.png'

export default function LandingPage({ onGetStarted }) {
  const canvasRef = useRef(null)
  useSphere(canvasRef)

  return (
    <div className="page-scroll w-screen bg-background text-text-primary grid-bg relative overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(11,11,11,0.7)] backdrop-blur-2xl animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-accent-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 block glow-anim relative z-10" />
          </div>
          <span className="text-base font-medium tracking-tight text-text-primary">
            LifeGuard<span className="text-accent-500 font-bold ml-0.5">.AI</span>
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-8 text-[10px] font-mono text-text-muted/60 uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-accent-500 transition-colors">Neural Core</a>
          <a href="#" className="hover:text-accent-500 transition-colors">Risk Protocol</a>
          <a href="#" className="hover:text-accent-500 transition-colors">Evidence Base</a>
        </div>
        <button
          onClick={onGetStarted}
          className="text-[10px] px-6 py-2.5 rounded-full border border-accent-500/30 text-text-primary hover:bg-accent-500 hover:text-white transition-all font-mono tracking-widest uppercase bg-accent-500/5 shadow-[0_0_20px_rgba(255,59,48,0.1)]"
        >
          Access Beta
        </button>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center pt-24 lg:pt-0 px-6 lg:px-20 gap-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-accent-500/5 rounded-full blur-[180px] pointer-events-none" />

        {/* Left: Text Content */}
        <div className="flex-1 relative z-10 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-accent-500/30 bg-accent-500/5 mb-10 animate-fade-in stagger-1">
            <span className="w-2 h-2 rounded-full bg-accent-500 glow-anim" />
            <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-accent-500 font-bold">V.2.0.4 AGENTIC AI DEPLOYED</span>
          </div>

          <div className="space-y-4 mb-10 overflow-hidden">
            <h1 className="text-7xl lg:text-8xl xl:text-[110px] font-light tracking-tighter leading-[0.9] animate-slide-up stagger-2">
              Predictive<br />
              Personal<br />
              <span className="text-accent-500 italic font-medium tracking-tight">Prevention.</span>
            </h1>
          </div>

          <p className="text-text-muted text-lg lg:text-xl leading-relaxed max-w-lg mb-12 tracking-wide animate-slide-up stagger-3 mx-auto lg:mx-0 font-light border-l-2 border-accent-500/20 pl-6">
            Early detection of lifestyle diseases through AI-driven analysis of your biometrics, habits, and mental health — grounded in clinical evidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start animate-slide-up stagger-4">
            <button
              onClick={onGetStarted}
              className="px-10 py-5 rounded-2xl bg-accent-500 text-background font-bold text-sm tracking-widest uppercase hover:bg-[#E02A20] transition-all hover:shadow-[0_0_50px_rgba(255,59,48,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Diagnostic Sequence
            </button>
            <button className="px-10 py-5 rounded-2xl border border-[rgba(255,255,255,0.1)] text-text-primary text-sm tracking-widest uppercase hover:border-accent-500/50 transition-all bg-[rgba(255,255,255,0.02)] backdrop-blur-md glass-card hover:bg-[rgba(255,255,255,0.05)]">
              Clinical Specs
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-12 mt-20 pt-10 border-t border-[rgba(255,255,255,0.08)] animate-fade-in stagger-5">
            {[
              ['0.98', 'Precision'],
              ['124', 'Metrics'],
              ['REAL', 'Response']
            ].map(([val, lbl]) => (
              <div key={lbl} className="group cursor-default">
                <p className="text-3xl font-light font-mono text-text-primary group-hover:text-accent-500 transition-colors duration-500">{val}</p>
                <p className="text-[9px] text-text-muted uppercase tracking-[0.3em] mt-3">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: The Centerpiece */}
        <div className="flex-1 flex items-center justify-center relative z-10 w-full lg:max-w-none min-h-[500px] lg:min-h-screen animate-scale-in">
          <div className="relative w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] lg:w-[600px] lg:h-[600px] flex items-center justify-center">
            
            {/* Animated Glow Rings */}
            <div className="absolute inset-0 rounded-full border border-accent-500/10 animate-[ping_10s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full border border-accent-500/5 animate-[ping_15s_linear_infinite_reverse]" />
            
            {/* Neural Brain Image */}
            <div className="relative z-20 w-4/5 h-4/5 animate-brain-float">
              <img 
                src={neuralBrain} 
                className="w-full h-full object-contain filter drop-shadow-[0_0_40px_rgba(255,59,48,0.4)] pointer-events-none select-none" 
                alt="Neural Health Brain" 
              />
            </div>
            
            {/* Interactive Canvas Dots Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 z-30 opacity-60 mix-blend-screen pointer-events-none"
            />

            {/* Floating Labels */}
            <div className="absolute top-0 right-0 glass-card px-4 py-2 rounded-xl border border-accent-500/20 translate-x-1/2 -translate-y-1/2 animate-brain-float stagger-2">
               <p className="text-[10px] font-mono text-accent-500 uppercase tracking-widest whitespace-nowrap">Neural Flux: 82%</p>
            </div>
            <div className="absolute bottom-1/4 left-0 glass-card px-4 py-2 rounded-xl border border-accent-500/20 -translate-x-1/2 animate-brain-float stagger-4">
               <p className="text-[10px] font-mono text-accent-500 uppercase tracking-widest whitespace-nowrap">Risk Synapse: SECURE</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-32 relative z-10 border-t border-[rgba(255,255,255,0.05)]">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent-500 mb-4 flex items-center gap-3">
              <span className="w-8 border-t border-accent-500/50 block"></span>
              Core Capabilities
            </p>
            <h2 className="text-4xl lg:text-5xl font-light tracking-tight text-text-primary max-w-xl leading-tight border-l-2 border-accent-500 pl-6">
              Built for prevention,<br />powered by evidence.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.num}
                className="glass-card p-8 rounded-2xl hover:border-accent-500/50 hover:bg-accent-500/5 transition-all duration-300 group animate-slide-up relative overflow-hidden"
                style={{ animationDelay: `${i * 0.1 + 0.2}s` }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-500/0 group-hover:bg-accent-500/10 blur-2xl rounded-full transition-all duration-500" />
                <span className="text-[10px] font-mono text-accent-500 border border-accent-500/20 px-2 py-1 rounded inline-block tracking-widest mb-8 bg-[rgba(255,255,255,0.02)]">
                  {f.num}
                </span>
                <h3 className="text-sm font-medium text-text-primary mb-3 tracking-wide">{f.title}</h3>
                <p className="text-[11px] text-text-muted leading-relaxed tracking-wide">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-32 text-center relative z-10 border-t border-[rgba(255,255,255,0.05)]">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-accent-500/10 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto glass-card p-12 lg:p-16 rounded-3xl border border-accent-500/20">
          <div className="w-12 h-12 mx-auto rounded-full bg-accent-500/10 border border-accent-500/30 flex items-center justify-center mb-8 float-anim">
            <span className="w-3 h-3 rounded-full bg-accent-500 glow-anim" />
          </div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-text-muted mb-6">Begin Assessment Sequence</p>
          <h2 className="text-4xl lg:text-5xl font-light tracking-tight mb-6">Your health intelligence<br /><span className="text-accent-500 font-medium">starts here.</span></h2>
          <p className="text-text-muted text-sm mb-12 tracking-wide max-w-sm mx-auto leading-relaxed">Complete a 5-minute diagnostic conversation and receive a personalised prevention protocol.</p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 rounded-xl bg-accent-500 text-background font-medium text-sm tracking-wide hover:bg-[#E02A20] transition-all hover:shadow-[0_0_40px_rgba(255,59,48,0.4)] block mx-auto"
          >
            Access Secure Portal
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between bg-background z-10 relative">
        <span className="text-[9px] font-mono text-text-muted/50 uppercase tracking-[0.2em]">LifeGuard AI © 2026 // NEURAL SECURED</span>
        <span className="text-[9px] font-mono text-text-muted/50 uppercase tracking-[0.2em] hidden sm:block">Preventive Intelligence. Not Medical Advice.</span>
      </footer>
    </div>
  )
}
