import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import MainApp from './pages/MainApp'

export default function App() {
  const [view, setView] = useState('loading')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({ uid: user.uid, name: user.displayName || user.email.split('@')[0], email: user.email })
        setView('app')
      } else {
        setCurrentUser(null)
        setView('landing')
      }
    })
    return unsubscribe
  }, [])

  if (view === 'loading') {
    return (
      <div className="h-screen w-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-4 h-4 border-2 border-[#E5E5E5] border-t-transparent rounded-full animate-spin" />
          <p className="text-[9px] font-mono uppercase tracking-widest text-white/30">Initializing…</p>
        </div>
      </div>
    )
  }

  if (view === 'landing') return <LandingPage onGetStarted={() => setView('auth')} />
  if (view === 'auth') return <AuthPage onLogin={() => {}} onBack={() => setView('landing')} />
  return <MainApp user={currentUser} />
}
