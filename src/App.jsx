import { useState, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import { supabase } from './lib/supabase'
import { Auth } from './components/Auth'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Roster } from './components/Roster'
import { Accounts } from './components/Accounts'
import { Toast } from './components/Toast'
import './index.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [page, setPage] = useState('dashboard')
  const [currentSquad, setCurrentSquad] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      .select('*, assignments(*, project_info:projects(id, name, tier))')
      .order('name')
    if (!error) setMembers(data || [])
  }, [])

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name')
    if (!error) setProjects(data || [])
  }, [])

  const refreshAll = useCallback(() => {
    fetchMembers()
    fetchProjects()
  }, [fetchMembers, fetchProjects])

  useEffect(() => {
    if (session) refreshAll()
  }, [session, refreshAll])

  function navigate(target, squad) {
    setPage(target)
    if (squad) setCurrentSquad(squad)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setMembers([])
    setProjects([])
  }

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-bg">
        <div className="text-xs font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>loading…</div>
      </div>
    )
  }

  if (!session) return <Auth />

  const ALLOWED_EMAILS = [
    'ibrahim.khan@arbisoft.com',
    'ahmed.hashmi@arbisoft.com',
    'arsal.idrees@arbisoft.com',
    'muhammad.ali.ashraf@arbisoft.com',
    'bakhtawar.bilal@arbisoft.com',
  ]

  if (!ALLOWED_EMAILS.includes(session.user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-bg">
        <div className="bg-sur border-2 p-10 w-full max-w-sm text-center"
          style={{ borderColor: '#0D3764' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <img
              src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
              alt="Nurture"
              className="w-8 h-8"
            />
            <div className="text-left">
              <div className="font-serif text-nb text-lg leading-none">nurture</div>
              <div className="text-[10px] mt-0.5 font-mono tracking-wider" style={{ color: 'rgba(13,55,100,0.60)' }}>
                squad capacity
              </div>
            </div>
          </div>
          <p className="font-serif text-nb text-base mb-2">access restricted</p>
          <p className="text-[13px] font-mono mb-6" style={{ color: 'rgba(13,55,100,0.60)' }}>
            <strong>{session.user.email}</strong> is not authorised to use this app.
          </p>
          <button
            onClick={signOut}
            className="text-[13px] font-mono lowercase transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.target.style.color = '#E3492B'}
            onMouseLeave={e => e.target.style.color = 'rgba(13,55,100,0.60)'}
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
    <div className="flex min-h-screen w-full">
      <Sidebar
        currentPage={page}
        currentSquad={currentSquad}
        onNavigate={navigate}
        onSignOut={signOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 overflow-y-auto" style={{ background: '#F4F4F4' }}>
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center px-4 py-3 border-b-2" style={{ borderColor: '#0D3764', background: '#FFFFFF' }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 mr-3 transition-colors"
            style={{ color: '#0D3764' }}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>
          <div className="font-serif text-nb text-base">nurture</div>
        </div>

        {page === 'dashboard' && (
          <Dashboard members={members} onNavigate={navigate} />
        )}
        {page === 'accounts' && (
          <Accounts
            projects={projects}
            members={members}
            session={session}
            onRefresh={refreshAll}
          />
        )}
        {page === 'roster' && currentSquad && (
          <Roster
            key={currentSquad}
            squadName={currentSquad}
            members={squadMembers}
            projects={projects}
            onBack={() => setPage('dashboard')}
            onRefresh={refreshAll}
          />
        )}
      </main>
      <Toast />
    </div>
  )
}
