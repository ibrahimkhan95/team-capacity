import { useState, useMemo, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  TIER_ORDER, TIER_LABELS, TIER_DESCRIPTIONS, TIER_COLORS, TIER_TEXT_COLORS, SQUAD_COLORS,
} from '../lib/utils'
import { showToast } from './Toast'

export function Accounts({ projects, members, session, onRefresh }) {
  const [drawerProject, setDrawerProject] = useState(null) // null=closed, 'new'=creating, {...}=editing

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

  const byTier = useMemo(() => {
    const groups = {}
    for (const t of TIER_ORDER) groups[t] = []
    for (const p of projects) {
      const key = TIER_ORDER.includes(p.tier) ? p.tier : 'monitor'
      groups[key].push(p)
    }
    return groups
  }, [projects])

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">Accounts</h1>
          <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            {projects.length} projects · tiered account management
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

      <div className="flex flex-col gap-10">
        {TIER_ORDER.map(tier => (
          <TierSection
            key={tier}
            tier={tier}
            projects={byTier[tier]}
            squadsByProject={squadsByProject}
            onProjectClick={project => setDrawerProject(project)}
          />
        ))}
      </div>

      {drawerProject !== null && (
        <ProjectDrawer
          project={drawerProject === 'new' ? null : drawerProject}
          session={session}
          onClose={() => setDrawerProject(null)}
          onSaved={() => { onRefresh(); setDrawerProject(null) }}
        />
      )}
    </div>
  )
}

function TierSection({ tier, projects, squadsByProject, onProjectClick }) {
  const color     = TIER_COLORS[tier]
  const textColor = TIER_TEXT_COLORS[tier]

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

      {projects.length === 0 ? (
        <p className="text-[13px] font-mono py-2" style={{ color: 'rgba(13,55,100,0.35)' }}>
          no projects in this tier
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              squads={[...(squadsByProject[project.id] || [])]}
              onClick={() => onProjectClick(project)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, squads, onClick }) {
  const tierColor     = TIER_COLORS[project.tier]     || TIER_COLORS.monitor
  const tierTextColor = TIER_TEXT_COLORS[project.tier] || TIER_TEXT_COLORS.monitor

  return (
    <div
      className="bg-sur border-2 p-4 cursor-pointer transition-all"
      style={{ borderColor: '#0D3764' }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'; e.currentTarget.style.background = '#F4F4F4' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#FFFFFF' }}
    >
      <p className="font-serif text-[16px] text-nb leading-tight mb-3">{project.name}</p>

      <div className="flex items-center gap-2 mb-4 min-h-[18px]">
        {squads.length === 0 ? (
          <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.30)' }}>no assignments</span>
        ) : squads.sort().map(squad => (
          <div key={squad} className="flex items-center gap-1">
            <span className="w-2 h-2 inline-block flex-shrink-0" style={{ background: SQUAD_COLORS[squad] }} />
            <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
              {squad.replace('Squad ', 'S')}
            </span>
          </div>
        ))}
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

function ProjectDrawer({ project, session, onClose, onSaved }) {
  const isNew = !project

  const [name, setName]   = useState(project?.name || '')
  const [tier, setTier]   = useState(project?.tier || 'monitor')
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    if (isNew) return
    supabase
      .from('project_tier_history')
      .select('*')
      .eq('project_id', project.id)
      .order('changed_at', { ascending: false })
      .then(({ data }) => setHistory(data || []))
  }, [project?.id])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  async function handleDelete() {
    if (!window.confirm(`remove "${project.name}" and all its assignments?`)) return
    setSaving(true)
    try {
      await supabase.from('assignments').delete().eq('project_id', project.id)
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      showToast('project removed')
      onSaved()
      handleClose()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { showToast('please enter a project name'); return }
    setSaving(true)
    try {
      if (isNew) {
        const { error } = await supabase.from('projects').insert({ name: name.trim(), tier })
        if (error) throw error
        showToast('project created')
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ name: name.trim(), tier })
          .eq('id', project.id)
        if (error) throw error

        if (tier !== project.tier) {
          await supabase.from('project_tier_history').insert({
            project_id: project.id,
            from_tier:  project.tier,
            to_tier:    tier,
            changed_by: session?.user?.email || '',
          })
        }
        showToast('project updated')
      }
      onSaved()
      handleClose()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tierColor     = TIER_COLORS[tier]
  const tierTextColor = TIER_TEXT_COLORS[tier]

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(13,55,100,0.18)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      <div
        className="relative flex flex-col bg-sur h-full w-full md:w-[460px] transition-transform duration-250"
        style={{
          borderLeft: '2px solid #0D3764',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
          <div>
            <h2 className="font-serif text-[20px] font-normal text-nb leading-none">
              {isNew ? 'new project' : 'edit project'}
            </h2>
            {!isNew && (
              <p className="text-[11px] font-mono mt-1" style={{ color: 'rgba(13,55,100,0.60)' }}>
                {project.name}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          <SectionLabel>project details</SectionLabel>

          <FormGroup label="project name">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Client Phoenix"
              autoFocus
              className={inputCls} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E3492B'}
              onBlur={e => e.target.style.borderColor = '#0D3764'}
            />
          </FormGroup>

          <FormGroup label="tier">
            <select value={tier} onChange={e => setTier(e.target.value)} className={inputCls} style={inputStyle}>
              {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </FormGroup>

          <div className="text-[12px] font-mono px-3 py-2.5 leading-relaxed"
            style={{
              background: `${tierColor}30`,
              color: tierTextColor,
              borderLeft: `3px solid ${tierColor}`,
            }}>
            {TIER_DESCRIPTIONS[tier]}
          </div>

          {!isNew && (
            <div>
              <SectionLabel>tier history</SectionLabel>
              {history.length === 0 ? (
                <p className="text-[12px] font-mono mt-3" style={{ color: 'rgba(13,55,100,0.35)' }}>
                  no changes recorded yet
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-start justify-between gap-4 py-2.5 px-3 border-l-2"
                      style={{ borderColor: 'rgba(13,55,100,0.12)', background: 'rgba(13,55,100,0.02)' }}>
                      <div>
                        <div className="flex items-center gap-1.5 text-[12px] font-mono">
                          <span style={{ color: TIER_TEXT_COLORS[h.from_tier] || 'rgba(13,55,100,0.50)' }}>
                            {TIER_LABELS[h.from_tier] || h.from_tier}
                          </span>
                          <span style={{ color: 'rgba(13,55,100,0.35)' }}>→</span>
                          <span className="font-medium" style={{ color: TIER_TEXT_COLORS[h.to_tier] || '#0D3764' }}>
                            {TIER_LABELS[h.to_tier] || h.to_tier}
                          </span>
                        </div>
                        {h.changed_by && (
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(13,55,100,0.40)' }}>
                            {h.changed_by}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-mono flex-shrink-0" style={{ color: 'rgba(13,55,100,0.40)' }}>
                        {new Date(h.changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.02)' }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={saving}
              className="text-sm font-medium font-mono px-4 py-2.5 border-2 cursor-pointer transition-all lowercase"
              style={{ background: 'transparent', color: '#E3492B', borderColor: '#E3492B' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(227,73,43,0.06)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
              remove
            </button>
          )}
          <div className="flex gap-2 ml-auto">
          <button onClick={handleClose}
            className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer transition-all lowercase"
            style={{ background: 'transparent', color: 'rgba(13,55,100,0.55)', borderColor: '#0D3764' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0D3764'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(13,55,100,0.55)'; e.currentTarget.style.boxShadow = 'none' }}>
            cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer bg-no text-white transition-all disabled:opacity-60 lowercase"
            style={{ borderColor: '#0D3764' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            {saving ? 'saving…' : isNew ? 'create project' : 'save changes'}
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-medium tracking-[0.10em] font-mono pb-2 lowercase"
      style={{ color: 'rgba(13,55,100,0.60)', borderBottom: '1px solid rgba(13,55,100,0.10)' }}>
      {children}
    </div>
  )
}

function FormGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium tracking-[0.09em] font-mono lowercase"
        style={{ color: 'rgba(13,55,100,0.60)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border-2 px-3 py-2 text-nb font-mono text-sm outline-none transition-colors w-full'
const inputStyle = { borderColor: '#0D3764', background: '#FFFFFF' }
