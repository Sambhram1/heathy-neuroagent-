import { useState, useEffect } from 'react'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import MainApp from './pages/MainApp'

export default function App() {
  const [view, setView] = useState('landing')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lifeguard_current_user')
      if (stored) {
        setCurrentUser(JSON.parse(stored))
        setView('app')
      }
    } catch {
      // ignore
    }
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
    setView('app')
  }

  const handleLogout = () => {
    localStorage.removeItem('lifeguard_current_user')
    setCurrentUser(null)
    setView('landing')
  }

  if (view === 'landing') return <LandingPage onGetStarted={() => setView('auth')} />
  if (view === 'auth') return <AuthPage onLogin={handleLogin} onBack={() => setView('landing')} />
  return <MainApp user={currentUser} onLogout={handleLogout} />
}
