import { useEffect, useRef } from 'react'

function useSphere(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let angle = 0
    const N = 140
    const golden = Math.PI * (3 - Math.sqrt(5))

    const points = []
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2
      const r = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r })
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      const cx = W / 2
      const cy = H / 2
      const scale = Math.min(W, H) * 0.4

      ctx.clearRect(0, 0, W, H)

      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const cosB = Math.cos(angle * 0.4)
      const sinB = Math.sin(angle * 0.4)

      const projected = points.map((p) => {
        // Y-axis rotation
        const rx = p.x * cosA - p.z * sinA
        const rz = p.x * sinA + p.z * cosA
        // X-axis tilt
        const ry = p.y * cosB - rz * sinB
        const rz2 = p.y * sinB + rz * cosB

        const fov = 2.5
        const sx = (rx / (rz2 + fov)) * scale * fov + cx
        const sy = (ry / (rz2 + fov)) * scale * fov + cy
        const depth = (rz2 + 1) / 2

        return { sx, sy, depth, rz: rz2 }
      })

      projected.sort((a, b) => a.rz - b.rz)

      // Draw edges
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].sx - projected[j].sx
          const dy = projected[i].sy - projected[j].sy
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 55) {
            const alpha = ((1 - dist / 55) * 0.18 * (projected[i].depth + projected[j].depth)) / 2
            ctx.strokeStyle = `rgba(255,59,48,${alpha.toFixed(3)})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(projected[i].sx, projected[i].sy)
            ctx.lineTo(projected[j].sx, projected[j].sy)
            ctx.stroke()
          }
        }
      }

      // Draw dots
      projected.forEach(({ sx, sy, depth }) => {
        const r = Math.max(0.5, depth * 3)
        const alpha = depth * 0.9 + 0.05
        ctx.beginPath()
        ctx.arc(sx, sy, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,59,48,${alpha.toFixed(3)})`
        ctx.fill()
      })

      // Outer glow ring
      const grad = ctx.createRadialGradient(cx, cy, scale * 0.7, cx, cy, scale * 1.1)
      grad.addColorStop(0, 'rgba(255,59,48,0.04)')
      grad.addColorStop(1, 'rgba(255,59,48,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, scale * 1.1, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.fill()

      angle += 0.004
      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])
}

const FEATURES = [
  {
    num: '01',
    title: 'Risk Prediction',
    desc: 'AI-powered analysis of diabetes, hypertension, and CVD risk using South Asian-calibrated models.',
  },
  {
    num: '02',
    title: 'Mental Health',
    desc: 'PHQ-9 and GAD-7 screening with psychosomatic amplification tracking and crisis support.',
  },
  {
    num: '03',
    title: 'Evidence-Based Plans',
    desc: 'Personalised nutrition, exercise, and sleep protocols sourced from ICMR and WHO guidelines.',
  },
  {
    num: '04',
    title: 'RAG Intelligence',
    desc: 'Retrieval-augmented generation over clinical datasets — every recommendation is cited.',
  },
]

export default function LandingPage({ onGetStarted }) {
  const canvasRef = useRef(null)
  useSphere(canvasRef)

  return (
    <div className="page-scroll w-screen bg-[#0B0B0B] text-[#F5F5F5]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(11,11,11,0.8)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#FF3B30] block" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
          </div>
          <span className="text-sm font-medium tracking-wide">
            LifeGuard<span className="text-[#8E8E93] font-light ml-0.5">AI</span>
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="text-[11px] px-4 py-2 rounded border border-[rgba(255,255,255,0.15)] text-[#8E8E93] hover:text-[#F5F5F5] hover:border-[rgba(255,255,255,0.3)] transition-all font-mono tracking-widest uppercase"
        >
          Get Started
        </button>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center pt-20 px-8 lg:px-16 gap-8 relative">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF3B30]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Left: Text */}
        <div className="flex-1 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(255,59,48,0.3)] bg-[rgba(255,59,48,0.05)] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3B30]" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF3B30]">Agentic Health Intelligence</span>
          </div>

          <h1 className="text-5xl lg:text-6xl xl:text-7xl font-light tracking-tight leading-[1.05] mb-6">
            Predict.<br />
            Prevent.<br />
            <span className="text-[#FF3B30]">Thrive.</span>
          </h1>

          <p className="text-[#8E8E93] text-sm leading-relaxed max-w-sm mb-10 tracking-wide">
            Early detection of lifestyle diseases through AI-driven analysis of your biometrics, habits, and mental health — grounded in clinical evidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGetStarted}
              className="px-8 py-4 rounded-xl bg-[#FF3B30] text-white font-medium text-sm tracking-wide hover:bg-[#E02A20] transition-all hover:shadow-[0_0_30px_rgba(255,59,48,0.4)]"
            >
              Start Diagnosis
            </button>
            <button className="px-8 py-4 rounded-xl border border-[rgba(255,255,255,0.1)] text-[#8E8E93] text-sm tracking-wide hover:text-[#F5F5F5] hover:border-[rgba(255,255,255,0.2)] transition-all">
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-[rgba(255,255,255,0.06)]">
            {[['4+', 'Risk Domains'], ['71', 'Clinical Vectors'], ['RAG', 'Evidence-Backed']].map(([val, lbl]) => (
              <div key={lbl}>
                <p className="text-2xl font-light font-mono text-[#F5F5F5]">{val}</p>
                <p className="text-[10px] text-[#8E8E93] uppercase tracking-widest mt-1">{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 3D Sphere */}
        <div className="flex-1 flex items-center justify-center relative z-10 w-full max-w-lg lg:max-w-none" style={{ minHeight: '480px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ minHeight: '420px', maxHeight: '560px' }}
          />
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[rgba(255,255,255,0.2)]">Neural Risk</p>
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[rgba(255,255,255,0.2)]">Model</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 lg:px-16 py-24 relative">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#FF3B30] mb-3">Core Capabilities</p>
            <h2 className="text-3xl font-light tracking-tight">Built for prevention,<br />powered by evidence.</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.num}
                className="p-6 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.01)] hover:border-[rgba(255,59,48,0.25)] hover:bg-[rgba(255,59,48,0.02)] transition-all group"
              >
                <span className="text-[10px] font-mono text-[#FF3B30] bg-[rgba(255,59,48,0.1)] px-2 py-0.5 rounded border border-[rgba(255,59,48,0.2)] mb-4 inline-block tracking-widest">
                  {f.num}
                </span>
                <h3 className="text-sm font-medium text-[#F5F5F5] mb-2 tracking-wide">{f.title}</h3>
                <p className="text-[11px] text-[#8E8E93] leading-relaxed tracking-wide">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 lg:px-16 py-24 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[200px] bg-[#FF3B30]/5 rounded-full blur-[80px]" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#8E8E93] mb-6">Begin Your Assessment</p>
          <h2 className="text-4xl font-light tracking-tight mb-4">Your health intelligence<br /><span className="text-[#FF3B30]">starts here.</span></h2>
          <p className="text-[#8E8E93] text-sm mb-10 tracking-wide">Complete a 5-minute diagnostic conversation and receive a personalised prevention protocol.</p>
          <button
            onClick={onGetStarted}
            className="px-10 py-4 rounded-xl bg-[#FF3B30] text-white font-medium text-sm tracking-wide hover:bg-[#E02A20] transition-all hover:shadow-[0_0_40px_rgba(255,59,48,0.4)]"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 lg:px-16 py-8 border-t border-[rgba(255,255,255,0.05)] flex items-center justify-between">
        <span className="text-[9px] font-mono text-[#8E8E93]/40 uppercase tracking-widest">LifeGuard AI © 2025</span>
        <span className="text-[9px] font-mono text-[#8E8E93]/40 uppercase tracking-widest">Preventive Intelligence. Not Medical Advice.</span>
      </footer>
    </div>
  )
}
