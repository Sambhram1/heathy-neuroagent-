import useAuth from './hooks/useAuth'
import { logOut } from './lib/auth'
import LoginPage from './components/LoginPage'
import MainApp from './pages/MainApp'

function FullscreenSpinner() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin w-8 h-8 text-accent-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted/50">
          Initializing...
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <FullscreenSpinner />
  if (!user) return <LoginPage />

  return <MainApp user={user} onLogout={logOut} />
}
