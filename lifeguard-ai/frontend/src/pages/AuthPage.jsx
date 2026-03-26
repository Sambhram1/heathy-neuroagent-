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
    <div className="h-screen w-screen bg-background flex items-center justify-center relative overflow-hidden grid-bg text-text-primary">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-8 left-8 text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted hover:text-text-primary transition-colors flex items-center gap-3 z-10 glass-card px-4 py-2 rounded-lg"
      >
        <span className="text-accent-500">←</span> RETURN
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 p-8 lg:p-10 rounded-3xl glass-card border-accent-500/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-fade-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 blur-[40px] rounded-full pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center float-anim">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-500 block glow-anim" />
          </div>
          <span className="text-base font-medium tracking-wide text-text-primary">
            LifeGuard<span className="text-text-muted font-light ml-0.5">AI</span>
          </span>
        </div>

        <h2 className="text-2xl font-light tracking-tight text-text-primary mb-2 relative z-10">
          {mode === 'login' ? 'Authentication' : 'Initialisation'}
        </h2>
        <p className="text-[11px] text-text-muted tracking-wide mb-8 border-l border-accent-500/50 pl-3 relative z-10 leading-relaxed max-w-[250px]">
          {mode === 'login' ? 'Secure neural handshake required to access health dashboard.' : 'Enter parameters to start your preventive health journey.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {mode === 'register' && (
            <div className="animate-slide-up">
              <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-muted block mb-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                Legal Identity
              </label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Data subject name"
                className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3.5 text-xs text-text-primary placeholder-text-muted/30 outline-none focus:border-accent-500/50 focus:bg-[rgba(255,255,255,0.04)] transition-all font-mono"
              />
            </div>
          )}
          <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-muted block mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-text-muted/30" />
              Secure Comm Link
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="id@nexus.node"
              className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3.5 text-xs text-text-primary placeholder-text-muted/30 outline-none focus:border-accent-500/50 focus:bg-[rgba(255,255,255,0.04)] transition-all font-mono"
            />
          </div>
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-text-muted block mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-text-muted/30" />
              Encryption Key
            </label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              className="w-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3.5 text-xs text-text-primary placeholder-text-muted/30 outline-none focus:border-accent-500/50 focus:bg-[rgba(255,255,255,0.04)] transition-all font-mono tracking-[0.2em]"
            />
          </div>

          {error && (
            <div className="animate-fade-in bg-accent-500/10 border border-accent-500/20 px-4 py-3 rounded-lg flex items-center gap-3">
              <span className="text-accent-500 font-bold text-sm">!</span>
              <p className="text-[10px] text-accent-500 font-mono tracking-wide">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-accent-500 text-background font-medium text-[11px] uppercase font-mono tracking-[0.2em] hover:bg-[#E02A20] transition-all hover:shadow-[0_0_20px_rgba(255,59,48,0.3)] mt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}
          >
            {mode === 'login' ? 'Establish Uplink' : 'Initialize Profile'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] text-center relative z-10 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-[10px] uppercase font-mono tracking-[0.15em] text-text-muted hover:text-text-primary transition-colors"
          >
            {mode === 'login' ? "UNREGISTERED ENTITY? " : 'EXISTING CLEARANCE? '}
            <span className="text-accent-500 border-b border-accent-500/30 pb-0.5">{mode === 'login' ? 'Register' : 'Authenticate'}</span>
          </button>
        </div>
      </div>
      
      <div className="absolute bottom-8 right-8 text-[9px] font-mono text-text-muted/30 uppercase tracking-[0.3em] text-right pointer-events-none">
        NODE: ALPHA-SECURE<br />
        ENC: 256-BIT NEURAL
      </div>
    </div>
  )
}
