import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Roster } from './components/Roster'
import { Toast } from './components/Toast'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [members, setMembers] = useState([])
  const [page, setPage] = useState('dashboard')
  const [currentSquad, setCurrentSquad] = useState(null)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Data
  const fetchMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*, assignments(*)')
      .order('name')
    if (!error) setMembers(data || [])
  }, [])

  useEffect(() => {
    if (session) fetchMembers()
  }, [session, fetchMembers])

  function navigate(target, squad) {
    setPage(target)
    if (squad) setCurrentSquad(squad)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setMembers([])
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full" style={{ background: '#F5F7FA' }}>
        <div className="text-xs font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>loading…</div>
      </div>
    )
  }

  if (!session) return <Auth />

  const squadMembers = currentSquad
    ? members.filter(m => m.squad === currentSquad)
    : []

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar
        currentPage={page}
        currentSquad={currentSquad}
        onNavigate={navigate}
        onSignOut={signOut}
      />
      <main style={{ flex: 1, overflowY: 'auto', background: '#F5F7FA' }}>
        {page === 'dashboard' && (
          <Dashboard members={members} onNavigate={navigate} />
        )}
        {page === 'roster' && currentSquad && (
          <Roster
            key={currentSquad}
            squadName={currentSquad}
            members={squadMembers}
            onBack={() => setPage('dashboard')}
            onRefresh={fetchMembers}
          />
        )}
      </main>
      <Toast />
    </div>
  )
}
