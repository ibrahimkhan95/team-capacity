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

  const ALLOWED_EMAILS = [
    'ibrahim.khan@arbisoft.com',
    'ahmed.hashmi@arbisoft.com',
    'arsal.idrees@arbisoft.com',
    'muhammad.ali.ashraf@arbisoft.com',
  ]

  if (!ALLOWED_EMAILS.includes(session.user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-bg">
        <div className="bg-sur border rounded-2xl p-10 w-full max-w-sm text-center"
          style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 8px 32px rgba(13,55,100,0.12)' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <img
              src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
              alt="Nurture"
              className="w-8 h-8"
            />
            <div className="text-left">
              <div className="font-serif text-nb text-lg leading-none">nurture</div>
              <div className="text-[10px] mt-0.5 font-mono tracking-wider" style={{ color: 'rgba(13,55,100,0.42)' }}>
                squad capacity
              </div>
            </div>
          </div>
          <p className="font-serif text-nb text-base mb-2">Access restricted</p>
          <p className="text-[13px] font-mono mb-6" style={{ color: 'rgba(13,55,100,0.42)' }}>
            <strong>{session.user.email}</strong> is not authorised to use this app.
          </p>
          <button
            onClick={signOut}
            className="text-[13px] font-mono transition-colors"
            style={{ color: 'rgba(13,55,100,0.42)' }}
            onMouseEnter={e => e.target.style.color = '#E3492B'}
            onMouseLeave={e => e.target.style.color = 'rgba(13,55,100,0.42)'}
          >
            sign out
          </button>
        </div>
      </div>
    )
  }

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
