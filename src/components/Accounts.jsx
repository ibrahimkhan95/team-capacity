import { useState, useMemo, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core'
import { supabase } from '../lib/supabase'
import {
  TIER_ORDER, TIER_LABELS, TIER_DESCRIPTIONS, TIER_COLORS, TIER_TEXT_COLORS, SQUAD_COLORS, SQUAD_NAMES,
} from '../lib/utils'
import { showToast } from './Toast'
import { ProjectDrawer } from './ProjectDrawer'

export function Accounts({ projects, members, session, onRefresh }) {
  const [drawerProject, setDrawerProject] = useState(null) // null=closed, 'new'=creating, {...}=editing
  const [squadFilter, setSquadFilter] = useState(null)
  const [showInternal, setShowInternal] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'matrix'
  const [pendingTiers, setPendingTiers] = useState({}) // projectId -> optimistic tier while a drag-move saves
  const [activeProject, setActiveProject] = useState(null) // project currently being dragged

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Drop the optimistic override once the refreshed data confirms the new tier
  useEffect(() => {
    setPendingTiers(prev => {
      if (Object.keys(prev).length === 0) return prev
      let changed = false
      const next = { ...prev }
      for (const id of Object.keys(next)) {
        const p = projects.find(pr => String(pr.id) === id)
        if (p && p.tier === next[id]) { delete next[id]; changed = true }
      }
      return changed ? next : prev
    })
  }, [projects])

  const effectiveProjects = useMemo(() => {
    if (Object.keys(pendingTiers).length === 0) return projects
    return projects.map(p => pendingTiers[p.id] != null ? { ...p, tier: pendingTiers[p.id] } : p)
  }, [projects, pendingTiers])

  async function moveProjectToTier(project, newTier) {
    if (newTier === project.tier) return
    setPendingTiers(prev => ({ ...prev, [project.id]: newTier }))
    try {
      const { error } = await supabase.from('projects').update({ tier: newTier }).eq('id', project.id)
      if (error) throw error
      await supabase.from('project_tier_history').insert({
        project_id: project.id,
        from_tier:  project.tier,
        to_tier:    newTier,
        changed_by: session?.user?.email || '',
      })
      showToast(`moved to ${TIER_LABELS[newTier].toLowerCase()}`)
      onRefresh()
    } catch (err) {
      setPendingTiers(prev => { const next = { ...prev }; delete next[project.id]; return next })
      showToast(err.message)
    }
  }

  function handleDragStart(event) {
    const project = effectiveProjects.find(p => String(p.id) === String(event.active.id))
    setActiveProject(project || null)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveProject(null)
    if (!over) return
    const project = effectiveProjects.find(p => String(p.id) === String(active.id))
    if (!project) return
    moveProjectToTier(project, over.id)
  }

  const internalProjects = useMemo(() => effectiveProjects.filter(p => p.internal), [effectiveProjects])

  const squadsByProject = useMemo(() => {
    const map = {}
    for (const m of members) {
      for (const a of m.assignments || []) {
        const pid = a.project_id || a.project_info?.id
        if (!pid) continue
        if (!map[pid]) map[pid] = new Set()
        map[pid].add(m.squad)
      }
    }
    return map
  }, [members])

  const membersByProject = useMemo(() => {
    const map = {}
    for (const m of members) {
      for (const a of m.assignments || []) {
        const pid = a.project_id || a.project_info?.id
        if (!pid) continue
        if (!map[pid]) map[pid] = []
        if (!map[pid].find(x => x.id === m.id)) {
          map[pid].push({ id: m.id, name: m.name, squad: m.squad })
        }
      }
    }
    return map
  }, [members])

  const byTier = useMemo(() => {
    const groups = {}
    for (const t of TIER_ORDER) groups[t] = []
    const external = effectiveProjects.filter(p => !p.internal)
    const filtered = squadFilter
      ? external.filter(p => squadsByProject[p.id]?.has(squadFilter))
      : external
    for (const p of filtered) {
      const key = TIER_ORDER.includes(p.tier) ? p.tier : 'monitor'
      groups[key].push(p)
    }
    return groups
  }, [effectiveProjects, squadFilter, squadsByProject])

  const visibleCount = Object.values(byTier).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">Accounts</h1>
          <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            {visibleCount} projects · tiered account management
          </p>
        </div>
        <button
          onClick={() => setDrawerProject('new')}
          className="inline-flex items-center gap-1.5 text-sm font-mono px-4 py-2 border-2 bg-no text-white cursor-pointer transition-all lowercase"
          style={{ borderColor: '#0D3764' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <Plus size={13} strokeWidth={2} />
          new project
        </button>
      </div>

      {/* Squad filter + view toggle */}
      <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {[['all squads', null], ...SQUAD_NAMES.map(sq => [sq.toLowerCase(), sq])].map(([label, val]) => (
            <button key={label}
              onClick={() => setSquadFilter(val === null ? null : val === squadFilter ? null : val)}
              className="text-[13px] font-mono px-3 py-1.5 border-2 cursor-pointer transition-all lowercase"
              style={squadFilter === val
                ? { background: '#E3492B', borderColor: '#0D3764', color: '#FFFFFF', boxShadow: '2px 2px 0px #0D3764' }
                : { background: 'transparent', borderColor: '#0D3764', color: 'rgba(13,55,100,0.55)' }}
              onMouseEnter={e => { if (squadFilter !== val) e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764' }}
              onMouseLeave={e => { if (squadFilter !== val) e.currentTarget.style.boxShadow = 'none' }}>
              {val && <span className="inline-block w-1.5 h-1.5 mr-1.5 align-middle rounded-full" style={{ background: squadFilter === val ? '#FFFFFF' : SQUAD_COLORS[val] }} />}
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[['list', 'list'], ['matrix', 'matrix']].map(([label, val]) => (
            <button key={val}
              onClick={() => setView(val)}
              className="text-[13px] font-mono px-3 py-1.5 border-2 cursor-pointer transition-all lowercase"
              style={view === val
                ? { background: '#0D3764', borderColor: '#0D3764', color: '#FFFFFF', boxShadow: '2px 2px 0px #0D3764' }
                : { background: 'transparent', borderColor: '#0D3764', color: 'rgba(13,55,100,0.55)' }}
              onMouseEnter={e => { if (view !== val) e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764' }}
              onMouseLeave={e => { if (view !== val) e.currentTarget.style.boxShadow = 'none' }}>
              {label} view
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {view === 'list' ? (
          <div className="flex flex-col gap-10">
            {TIER_ORDER.map(tier => (
              <TierSection
                key={tier}
                tier={tier}
                projects={byTier[tier]}
                membersByProject={membersByProject}
                onProjectClick={project => setDrawerProject(project)}
              />
            ))}
          </div>
        ) : (
          <MatrixView
            byTier={byTier}
            membersByProject={membersByProject}
            onProjectClick={project => setDrawerProject(project)}
          />
        )}

        <DragOverlay>
          {activeProject && (
            <ProjectCardContent
              project={activeProject}
              assignedMembers={membersByProject[activeProject.id] || []}
              lifted
            />
          )}
        </DragOverlay>
      </DndContext>

      {internalProjects.length > 0 && (
        <div className="mt-10 pt-5" style={{ borderTop: '1px solid rgba(13,55,100,0.10)' }}>
          <button
            onClick={() => setShowInternal(v => !v)}
            className="text-[12px] font-mono lowercase cursor-pointer transition-colors"
            style={{ color: 'rgba(13,55,100,0.45)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.45)'}
          >
            {showInternal ? '−' : '+'} {internalProjects.length} internal {internalProjects.length === 1 ? 'project' : 'projects'} (hidden from tiers)
          </button>

          {showInternal && (
            <div className="flex flex-wrap gap-2 mt-3">
              {internalProjects.map(project => (
                <button
                  key={project.id}
                  onClick={() => setDrawerProject(project)}
                  className="text-[12px] font-mono px-3 py-1.5 border-2 cursor-pointer transition-all lowercase"
                  style={{ background: 'transparent', borderColor: 'rgba(13,55,100,0.30)', color: 'rgba(13,55,100,0.55)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D3764'; e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(13,55,100,0.30)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {drawerProject !== null && (
        <ProjectDrawer
          project={drawerProject === 'new' ? null : drawerProject}
          assignedMembers={drawerProject === 'new' ? [] : (membersByProject[drawerProject?.id] || [])}
          session={session}
          onClose={() => setDrawerProject(null)}
          onSaved={() => { onRefresh(); setDrawerProject(null) }}
        />
      )}
    </div>
  )
}

function TierSection({ tier, projects, membersByProject, onProjectClick }) {
  const color     = TIER_COLORS[tier]
  const textColor = TIER_TEXT_COLORS[tier]
  const { setNodeRef, isOver } = useDroppable({ id: tier })

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 pb-3"
        style={{ borderBottom: `2px solid ${color}` }}>
        <h2 className="font-serif text-[20px] font-normal text-nb">{TIER_LABELS[tier]}</h2>
        <span className="text-[12px] font-mono flex-1" style={{ color: 'rgba(13,55,100,0.55)' }}>
          {TIER_DESCRIPTIONS[tier]}
        </span>
        <span className="text-[11px] font-mono font-medium" style={{ color: textColor }}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="transition-all"
        style={{
          outline: isOver ? `2px dashed ${color}` : '2px dashed transparent',
          outlineOffset: '4px',
          background: isOver ? `${color}0D` : 'transparent',
        }}
      >
        {projects.length === 0 ? (
          <p className="text-[13px] font-mono py-2" style={{ color: 'rgba(13,55,100,0.35)' }}>
            {isOver ? 'drop to move here' : 'no projects in this tier'}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                assignedMembers={membersByProject[project.id] || []}
                onClick={() => onProjectClick(project)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Quadrants: rows = account risk/complexity (high → low), columns = designer readiness (low → high)
const MATRIX_CELLS = [
  ['active_oversight', 'monitor'],
  ['coach', 'empower'],
]

function MatrixView({ byTier, membersByProject, onProjectClick }) {
  const axisLabelStyle = { color: 'rgba(13,55,100,0.45)' }

  return (
    <div>
      <div className="flex">
        <div className="w-8 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 mb-2">
          <span className="text-[11px] font-mono tracking-wider lowercase text-center" style={axisLabelStyle}>
            designer readiness — low
          </span>
          <span className="text-[11px] font-mono tracking-wider lowercase text-center" style={axisLabelStyle}>
            designer readiness — high
          </span>
        </div>
      </div>

      <div className="flex">
        <div className="w-8 flex-shrink-0 grid grid-rows-2">
          <div className="flex items-center justify-center">
            <span className="text-[11px] font-mono tracking-wider lowercase whitespace-nowrap"
              style={{ ...axisLabelStyle, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              risk — high
            </span>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-[11px] font-mono tracking-wider lowercase whitespace-nowrap"
              style={{ ...axisLabelStyle, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              risk — low
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATRIX_CELLS.flat().map(tier => (
            <QuadrantCell
              key={tier}
              tier={tier}
              projects={byTier[tier]}
              membersByProject={membersByProject}
              onProjectClick={onProjectClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuadrantCell({ tier, projects, membersByProject, onProjectClick }) {
  const color     = TIER_COLORS[tier]
  const textColor = TIER_TEXT_COLORS[tier]
  const { setNodeRef, isOver } = useDroppable({ id: tier })

  return (
    <div
      ref={setNodeRef}
      className="border-2 p-4 transition-all min-h-[220px]"
      style={{
        borderColor: '#0D3764',
        background: isOver ? `${color}30` : `${color}14`,
        outline: isOver ? `2px dashed ${color}` : '2px dashed transparent',
        outlineOffset: '-6px',
      }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="font-serif text-[18px] font-normal text-nb">{TIER_LABELS[tier]}</h3>
        <span className="text-[11px] font-mono font-medium flex-shrink-0" style={{ color: textColor }}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>
      <p className="text-[11px] font-mono mb-3 leading-relaxed" style={{ color: 'rgba(13,55,100,0.55)' }}>
        {TIER_DESCRIPTIONS[tier]}
      </p>

      {projects.length === 0 ? (
        <p className="text-[12px] font-mono" style={{ color: 'rgba(13,55,100,0.35)' }}>
          {isOver ? 'drop to move here' : 'no projects in this tier'}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {projects.map(project => (
            <ProjectChip
              key={project.id}
              project={project}
              memberCount={(membersByProject[project.id] || []).length}
              onClick={() => onProjectClick(project)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectChip({ project, memberCount, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1.5 border-2 bg-sur transition-all"
      style={{ borderColor: '#0D3764', cursor: isDragging ? 'grabbing' : 'grab', opacity: isDragging ? 0.35 : 1, touchAction: 'none' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '3px 3px 0px #0D3764'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {project.name}
      {memberCount > 0 && (
        <span style={{ color: 'rgba(13,55,100,0.40)' }}>· {memberCount}</span>
      )}
    </div>
  )
}

function ProjectCard({ project, assignedMembers, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: project.id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      style={{ opacity: isDragging ? 0.35 : 1, touchAction: 'none' }}
    >
      <ProjectCardContent project={project} assignedMembers={assignedMembers} />
    </div>
  )
}

function ProjectCardContent({ project, assignedMembers, lifted }) {
  const tierColor     = TIER_COLORS[project.tier]     || TIER_COLORS.monitor
  const tierTextColor = TIER_TEXT_COLORS[project.tier] || TIER_TEXT_COLORS.monitor

  const visible  = assignedMembers.slice(0, 3)
  const overflow = assignedMembers.length - visible.length

  return (
    <div
      className="bg-sur border-2 p-4 transition-all"
      style={{
        borderColor: '#0D3764',
        cursor: lifted ? 'grabbing' : 'grab',
        boxShadow: lifted ? '4px 4px 0px #0D3764' : 'none',
        background: lifted ? '#F4F4F4' : '#FFFFFF',
      }}
      onMouseEnter={lifted ? undefined : e => { e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'; e.currentTarget.style.background = '#F4F4F4' }}
      onMouseLeave={lifted ? undefined : e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FFFFFF' }}
    >
      <p className="font-serif text-[16px] text-nb leading-tight mb-3">{project.name}</p>

      <div className="flex flex-col gap-1 mb-4 min-h-[18px]">
        {assignedMembers.length === 0 ? (
          <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.30)' }}>no assignments</span>
        ) : (
          <>
            {visible.map(m => (
              <div key={m.id} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 inline-block flex-shrink-0 rounded-full" style={{ background: SQUAD_COLORS[m.squad] }} />
                <span className="text-[11px] font-mono truncate" style={{ color: 'rgba(13,55,100,0.70)' }}>{m.name}</span>
              </div>
            ))}
            {overflow > 0 && (
              <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.35)' }}>+{overflow} more</span>
            )}
          </>
        )}
      </div>

      <span
        className="inline-flex items-center text-[11px] font-mono px-2 py-1"
        style={{ background: `${tierColor}30`, color: tierTextColor }}
      >
        {TIER_LABELS[project.tier] || 'Monitor'}
      </span>
    </div>
  )
}

