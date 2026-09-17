// LOCAL PREVIEW ONLY — renders the app against mock data so the placement UI
// can be reviewed without Supabase.
//   /?demo=placements  → the Placements page (entry point for the pipeline)
//   /?demo=roster      → a squad roster, showing read-only placement status
// Delete this file, src/demoData.js, and the demo routes in main.jsx before merging.
import { useState, useEffect } from 'react'
import { Roster } from './components/Roster'
import { Placements } from './components/Placements'
import { Sidebar } from './components/Sidebar'
import { Toast } from './components/Toast'
import { demoProjects, demoMembers, demoPlacements } from './demoData'

export default function DemoRoster({ initialPage = 'placements' }) {
  // Writes would otherwise hit the real database, since .env.local holds real
  // credentials. This flag makes every write a no-op while the demo is mounted.
  //
  // It MUST be set here rather than at module scope: main.jsx imports this file
  // unconditionally, and a module-level assignment would run on that import —
  // switching the real app into demo mode and silently discarding every save.
  // Set in the effect rather than during render — mutating globals in a render
  // body breaks React's purity rule. Effects run before any interaction, so the
  // guards are live by the time a save can be triggered. The setup assignment
  // also survives StrictMode's setup → cleanup → setup cycle.
  useEffect(() => {
    window.__DEMO_MODE__ = true
    return () => { window.__DEMO_MODE__ = false }
  }, [])

  const [page, setPage] = useState(initialPage)
  const [squad, setSquad] = useState('Squad 1')

  function navigate(target, sq) {
    setPage(target)
    if (sq) setSquad(sq)
  }

  const squadMembers = demoMembers.filter(m => m.squad === squad)

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar
        currentPage={page}
        currentSquad={squad}
        onNavigate={navigate}
        onSignOut={() => {}}
        isOpen={false}
        onClose={() => {}}
      />
      <main className="flex-1 overflow-y-auto" style={{ background: '#F4F4F4' }}>
        {page === 'placements' && (
          <Placements
            placements={demoPlacements}
            projects={demoProjects}
            members={demoMembers}
            onRefresh={() => {}}
          />
        )}
        {page === 'roster' && (
          <Roster
            key={squad}
            squadName={squad}
            members={squadMembers}
            projects={demoProjects}
            placements={demoPlacements}
            onBack={() => setPage('placements')}
            onRefresh={() => {}}
          />
        )}
        {(page === 'dashboard' || page === 'accounts') && (
          <div className="p-8">
            <p className="font-mono text-[13px]" style={{ color: 'rgba(13,55,100,0.60)' }}>
              not part of this prototype — try <strong>placements</strong> or a squad.
            </p>
          </div>
        )}
      </main>
      <Toast />
    </div>
  )
}
