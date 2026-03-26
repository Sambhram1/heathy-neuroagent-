import { useState } from 'react'

export default function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const users = JSON.parse(localStorage.getItem('lifeguard_users') || '[]')

    if (mode === 'register') {
      if (!form.name || !form.email || !form.password) return setError('All fields are required.')
      if (form.password.length < 6) return setError('Password must be at least 6 characters.')
      if (users.find((u) => u.email === form.email)) return setError('Email already registered.')
      const user = { id: crypto.randomUUID(), name: form.name, email: form.email, password: form.password }
      users.push(user)
      localStorage.setItem('lifeguard_users', JSON.stringify(users))
      const { password, ...safe } = user
      localStorage.setItem('lifeguard_current_user', JSON.stringify(safe))
      onLogin(safe)
    } else {
      const user = users.find((u) => u.email === form.email && u.password === form.password)
      if (!user) return setError('Invalid email or password.')
      const { password, ...safe } = user
      localStorage.setItem('lifeguard_current_user', JSON.stringify(safe))
      onLogin(safe)
    }
  }

  return (
    <div className="h-screen w-screen bg-[#0B0B0B] flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF3B30]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] hover:text-[#F5F5F5] transition-colors flex items-center gap-2 z-10"
      >
        <span>←</span> Back
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] block" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
          </div>
          <span className="text-sm font-medium tracking-wide text-[#F5F5F5]">
            LifeGuard<span className="text-[#8E8E93] font-light">AI</span>
          </span>
        </div>

        <h2 className="text-xl font-light tracking-tight text-[#F5F5F5] mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-[11px] text-[#8E8E93] tracking-wide mb-8">
          {mode === 'login' ? 'Sign in to access your health dashboard.' : 'Start your preventive health journey.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] block mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Your full name"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#8E8E93]/40 outline-none focus:border-[rgba(255,59,48,0.5)] transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] block mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#8E8E93]/40 outline-none focus:border-[rgba(255,59,48,0.5)] transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E93] block mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-sm text-[#F5F5F5] placeholder-[#8E8E93]/40 outline-none focus:border-[rgba(255,59,48,0.5)] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-[#FF3B30] font-mono tracking-wide px-1">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#FF3B30] text-white font-medium text-sm tracking-wide hover:bg-[#E02A20] transition-all hover:shadow-[0_0_20px_rgba(255,59,48,0.3)] mt-2"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-[11px] text-[#8E8E93] hover:text-[#F5F5F5] transition-colors tracking-wide"
          >
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span className="text-[#FF3B30]">{mode === 'login' ? 'Register' : 'Sign in'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
