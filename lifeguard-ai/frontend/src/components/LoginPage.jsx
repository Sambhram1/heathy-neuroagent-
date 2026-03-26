import { useState } from 'react'
import { signInWithGoogle } from '../lib/auth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      // useAuth will pick up the new user automatically
    } catch (err) {
      setError('Sign in failed. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-text-primary overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-accent-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-accent-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
          <span className="w-3 h-3 rounded-full bg-accent-500 block glow-anim" />
        </div>
        <div>
          <p className="text-xl font-medium tracking-wide text-text-primary">
            LifeGuard<span className="text-text-muted font-light">AI</span>
          </p>
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-muted/50">
            Health Intelligence
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="glass-card px-10 py-10 flex flex-col items-center gap-6 w-full max-w-sm border border-[rgba(255,255,255,0.08)] rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/5 blur-[60px] rounded-full pointer-events-none" />

        <div className="text-center relative z-10">
          <h1 className="text-lg font-medium tracking-wide text-text-primary mb-1">
            LifeGuard AI
          </h1>
          <p className="text-xs text-text-muted font-mono tracking-wide">
            Your personal health risk companion
          </p>
        </div>

        <div className="w-full h-px bg-[rgba(255,255,255,0.06)]" />

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="relative z-10 w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl
            bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)]
            hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 font-mono text-xs tracking-widest text-text-primary uppercase"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              {/* Google Icon SVG */}
              <svg width="18" height="18" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M488 261.8c0-17.8-1.6-34.9-4.6-51.4H249v97.3h134.9c-5.8 31.7-23.3 58.6-49.7 76.6v63.7h80.4c47-43.3 74.4-107.1 74.4-186.2z"/>
                <path fill="#34A853" d="M249 512c67.5 0 124.1-22.4 165.5-60.6l-80.4-63.7c-22.4 15-51 23.9-85.1 23.9-65.4 0-120.8-44.2-140.7-103.5H25.4v65.7C66.6 455.4 152.1 512 249 512z"/>
                <path fill="#FBBC05" d="M108.3 308.1c-5-15-7.8-31-7.8-47.6s2.8-32.6 7.8-47.6v-65.7H25.4C9.2 179.5 0 215.7 0 260.5s9.2 81 25.4 113.3l82.9-65.7z"/>
                <path fill="#EA4335" d="M249 100.4c36.9 0 70 12.7 96.1 37.6l72-72C375 25.4 318.5 0 249 0 152.1 0 66.6 56.6 25.4 147.2l82.9 65.7C128.2 144.6 183.6 100.4 249 100.4z"/>
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {error && (
          <p className="relative z-10 text-[11px] text-accent-500 font-mono text-center">
            {error}
          </p>
        )}

        <p className="relative z-10 text-[9px] text-text-muted/40 font-mono text-center tracking-wide">
          Secured · End-to-End Encrypted
        </p>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[9px] text-text-muted/30 font-mono uppercase tracking-widest">
        LifeGuard AI · Health Intelligence Platform
      </p>
    </div>
  )
}
