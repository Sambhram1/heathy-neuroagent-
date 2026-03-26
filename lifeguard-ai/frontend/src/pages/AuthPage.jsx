import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#D8D8D8" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#BEBEBE" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#AFAFAF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#8F8F8F" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

async function ensureFirestoreUser(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      hasAssessment: false,
      createdAt: serverTimestamp(),
    })
  }
}

export default function AuthPage({ onBack }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await ensureFirestoreUser(result.user)
    } catch (err) {
      setError(err.code === 'auth/popup-closed-by-user' ? 'Sign-in cancelled.' : err.message)
    } finally { setGoogleLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        if (!form.name) throw new Error('Name is required.')
        if (form.password.length < 6) throw new Error('Password must be at least 6 characters.')
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password)
        await updateProfile(cred.user, { displayName: form.name })
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: form.name, email: form.email,
          hasAssessment: false, createdAt: serverTimestamp(),
        })
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password)
      }
    } catch (err) {
      const MAP = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'Email already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/invalid-credential': 'Invalid email or password.',
      }
      setError(MAP[err.code] || err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className="h-screen w-screen bg-[#0B0B0B] flex items-center justify-center relative overflow-hidden text-[#F5F5F5]">
      {/* Grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E5E5E5]/[0.04] rounded-full blur-[120px] pointer-events-none" />

      {/* Back */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
      >
        <span className="text-[#E5E5E5]">←</span> Return
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[360px] mx-4 p-8 rounded-3xl border border-white/[0.08] bg-[rgba(255,255,255,0.02)] backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-fade-in">
        {/* Corner glow */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-[#E5E5E5]/[0.08] blur-[40px] rounded-full pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-[#E5E5E5]/10 border border-[#E5E5E5]/25 flex items-center justify-center" style={{ animation: 'brain-float 6s ease-in-out infinite' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5E5E5] block" style={{ boxShadow: '0 0 8px rgba(229,229,229,0.9)' }} />
          </div>
          <span className="text-[14px] font-medium tracking-tight">
            LifeGuard<span className="text-[#E5E5E5]">.AI</span>
          </span>
        </div>

        <h2 className="text-[22px] font-extralight tracking-tight mb-1.5 relative z-10">
          {mode === 'login' ? 'Authentication' : 'Initialisation'}
        </h2>
        <p className="text-[11px] text-white/35 tracking-wide mb-7 border-l border-[#E5E5E5]/35 pl-3 relative z-10 leading-relaxed font-mono">
          {mode === 'login'
            ? 'Sign in to access your health dashboard.'
            : 'Create your profile to begin preventive analysis.'}
        </p>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="relative z-10 w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/[0.1] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.18] transition-all text-[12px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed mb-5"
        >
          {googleLoading
            ? <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            : <GoogleIcon />
          }
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative z-10 flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[11px] font-mono uppercase tracking-widest text-white/25">or</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 relative z-10">
          {mode === 'register' && (
            <div>
              <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1.5">Name</label>
              <input
                type="text" value={form.name} onChange={set('name')} placeholder="Your full name"
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-[12px] text-white placeholder-white/20 outline-none focus:border-[#E5E5E5]/40 transition-all font-mono"
              />
            </div>
          )}
          <div>
            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1.5">Email</label>
            <input
              type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-[12px] text-white placeholder-white/20 outline-none focus:border-[#E5E5E5]/40 transition-all font-mono"
            />
          </div>
          <div>
            <label className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30 block mb-1.5">Password</label>
            <input
              type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-[12px] text-white placeholder-white/20 outline-none focus:border-[#E5E5E5]/40 transition-all font-mono tracking-[0.2em]"
            />
          </div>

          {error && (
            <div className="bg-[#E5E5E5]/[0.07] border border-[#E5E5E5]/20 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in">
              <span className="text-[#E5E5E5] font-bold text-sm flex-shrink-0">!</span>
              <p className="text-[11px] text-[#E5E5E5]/90 font-mono tracking-wide">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#E5E5E5] text-[#0B0B0B] font-bold text-[11px] uppercase font-mono tracking-[0.2em] hover:bg-[#BFBFBF] transition-all hover:shadow-[0_0_25px_rgba(229,229,229,0.35)] mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading && <div className="w-3 h-3 border-2 border-[#0B0B0B]/40 border-t-transparent rounded-full animate-spin" />}
            {loading ? 'Connecting…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.05] text-center relative z-10">
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            className="text-[11px] font-mono tracking-[0.1em] text-white/25 hover:text-white/60 transition-colors"
          >
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span className="text-[#E5E5E5]">{mode === 'login' ? 'Register' : 'Sign in'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
